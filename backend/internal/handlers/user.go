package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"huggingbay/internal/db"
	authmw "huggingbay/internal/middleware"
)

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := authmw.UserID(r.Context())
	user, err := h.store.GetUserByID(r.Context(), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := authmw.UserID(r.Context())
	var body struct {
		DisplayName string `json:"display_name"`
		Bio         string `json:"bio"`
		AvatarURL   string `json:"avatar_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	user, err := h.store.UpdateUser(r.Context(), userID, body.DisplayName, body.Bio, body.AvatarURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *Handler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	userID := authmw.UserID(r.Context())
	keys, err := h.store.ListAPIKeys(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	if keys == nil {
		keys = make([]*db.APIKey, 0)
	}
	respondJSON(w, http.StatusOK, keys)
}

func (h *Handler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID := authmw.UserID(r.Context())
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	// Generate a random 32-byte key prefixed with "hb_"
	rawKey := make([]byte, 32)
	if _, err := rand.Read(rawKey); err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	keyStr := "hb_" + hex.EncodeToString(rawKey)
	keyPreview := keyStr[len(keyStr)-4:]

	h256 := sha256.Sum256([]byte(keyStr))
	keyHash := hex.EncodeToString(h256[:])

	key, err := h.store.CreateAPIKey(r.Context(), userID, body.Name, keyHash, keyPreview)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	// Return the full key only once at creation time
	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":          key.ID,
		"name":        key.Name,
		"key":         keyStr,
		"key_preview": key.KeyPreview,
		"created_at":  key.CreatedAt,
	})
}

func (h *Handler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	keyID := chi.URLParam(r, "id")
	userID := authmw.UserID(r.Context())
	if err := h.store.DeleteAPIKey(r.Context(), keyID, userID); err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "api key not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
