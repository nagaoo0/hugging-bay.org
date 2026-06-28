package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"huggingbay/internal/config"
	"huggingbay/internal/db"
	authmw "huggingbay/internal/middleware"
	"huggingbay/internal/search"
	"huggingbay/internal/storage"
)

type Handler struct {
	store   *db.Store
	search  *search.Client
	storage *storage.Client
	cfg     *config.Config
	auth    *authmw.Auth
}

func New(store *db.Store, search *search.Client, storage *storage.Client, cfg *config.Config, auth *authmw.Auth) *Handler {
	return &Handler{store: store, search: search, storage: storage, cfg: cfg, auth: auth}
}

// ─── Response helpers ─────────────────────────────────────────────────────────

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

func parsePage(r *http.Request) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

type PagedResponse struct {
	Data  interface{} `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

var nonAlphanumRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	slug := strings.ToLower(s)
	slug = nonAlphanumRe.ReplaceAllString(slug, "-")
	return strings.Trim(slug, "-")
}
