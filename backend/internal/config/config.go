package config

import (
	"os"
)

type Config struct {
	Port               string
	DatabaseURL        string
	RedisURL           string
	MeilisearchURL     string
	MeilisearchKey     string
	MinioEndpoint      string
	MinioAccessKey     string
	MinioSecretKey     string
	MinioBucket        string
	MinioUseSSL        bool
	JWTSecret          string
	TrackerAnnounceURL string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://hb:password@localhost:5432/huggingbay?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		MeilisearchURL:     getEnv("MEILISEARCH_URL", "http://localhost:7700"),
		MeilisearchKey:     getEnv("MEILISEARCH_KEY", ""),
		MinioEndpoint:      getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey:     getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey:     getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:        getEnv("MINIO_BUCKET", "huggingbay"),
		MinioUseSSL:        getEnv("MINIO_USE_SSL", "false") == "true",
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
		TrackerAnnounceURL: getEnv("TRACKER_ANNOUNCE_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
