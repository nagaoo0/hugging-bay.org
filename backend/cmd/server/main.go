package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"huggingbay/internal/config"
	"huggingbay/internal/db"
	"huggingbay/internal/handlers"
	authmw "huggingbay/internal/middleware"
	"huggingbay/internal/search"
	"huggingbay/internal/storage"
)

func main() {
	cfg := config.Load()

	// Database
	sqlDB, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}
	defer sqlDB.Close()

	if err := db.RunMigrations(sqlDB); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	store := db.NewStore(sqlDB)

	// Search (non-fatal if unavailable)
	searchClient := search.NewClient(cfg.MeilisearchURL, cfg.MeilisearchKey)
	if err := searchClient.EnsureIndexes(); err != nil {
		log.Printf("warning: search setup failed: %v", err)
	}

	// Storage (non-fatal if unavailable)
	var storageClient *storage.Client
	storageClient, err = storage.NewMinIO(cfg)
	if err != nil {
		log.Printf("warning: MinIO unavailable: %v", err)
		storageClient = nil
	}

	// Auth middleware
	authMiddleware := authmw.NewAuth(cfg.JWTSecret, store)

	// Handlers
	h := handlers.New(store, searchClient, storageClient, cfg, authMiddleware)

	// Router
	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RealIP)
	r.Use(chimw.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(r chi.Router) {
		// Auth
		r.Post("/auth/register", h.Register)
		r.Post("/auth/login", h.Login)

		// Discovery
		r.Get("/search", h.Search)
		r.Get("/latest", h.LatestModels)
		r.Get("/popular", h.PopularModels)

		// Models (public reads)
		r.Get("/models", h.ListModels)
		r.Get("/models/{slug}", h.GetModel)
		r.Get("/models/{slug}/releases", h.ListReleases)
		r.Get("/models/{slug}/releases/{version}", h.GetRelease)
		r.Get("/models/{slug}/releases/{version}/manifest", h.GetManifest)
		r.Get("/models/{slug}/releases/{version}/magnet", h.GetMagnet)
		r.Get("/models/{slug}/releases/{version}/torrent", h.DownloadTorrent)
		r.Get("/models/{slug}/comments", h.ListComments)

		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)

			r.Post("/models", h.CreateModel)
			r.Put("/models/{slug}", h.UpdateModel)
			r.Post("/models/{slug}/releases", h.CreateRelease)

			r.Post("/models/{slug}/comments", h.CreateComment)
			r.Delete("/models/{slug}/comments/{id}", h.DeleteComment)

			r.Get("/me", h.GetMe)
			r.Put("/me", h.UpdateMe)
			r.Get("/me/api-keys", h.ListAPIKeys)
			r.Post("/me/api-keys", h.CreateAPIKey)
			r.Delete("/me/api-keys/{id}", h.DeleteAPIKey)
		})

		// Admin-only routes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)
			r.Use(authMiddleware.RequireAdmin)

			r.Post("/models/{slug}/verify", h.VerifyModel)
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Printf("hugging-bay API listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
