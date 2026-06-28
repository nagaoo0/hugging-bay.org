package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if len(req.Username) < 3 || len(req.Username) > 50 {
		respondError(w, http.StatusBadRequest, "username must be 3–50 characters")
		return
	}
	if len(req.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "invalid email")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	user, err := h.store.CreateUser(r.Context(), req.Username, req.Email, string(hash))
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			respondError(w, http.StatusConflict, "username or email already taken")
			return
		}
		respondError(w, http.StatusInternalServerError, "could not create user")
		return
	}

	token, err := h.auth.SignJWT(user.ID, user.Username, user.IsAdmin)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "could not sign token")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"token": token, "user": user})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, hash, err := h.store.GetUserByEmail(r.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := h.auth.SignJWT(user.ID, user.Username, user.IsAdmin)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "could not sign token")
		return
	}

	user.Email = "" // don't expose in response
	respondJSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}
