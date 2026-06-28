package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"huggingbay/internal/db"
	authmw "huggingbay/internal/middleware"
	"huggingbay/internal/search"
)

type createModelRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Architecture string   `json:"architecture"`
	Framework    string   `json:"framework"`
	License      string   `json:"license"`
	Language     string   `json:"language"`
	Tags         []string `json:"tags"`
}

func (h *Handler) CreateModel(w http.ResponseWriter, r *http.Request) {
	var req createModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if len(req.Name) < 2 {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	userID := authmw.UserID(r.Context())
	slug := slugify(req.Name)

	model, err := h.store.CreateModel(r.Context(), slug, req.Name, req.Description,
		req.Architecture, req.Framework, req.License, req.Language, userID, req.Tags)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			respondError(w, http.StatusConflict, "a model with this name already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "could not create model")
		return
	}

	// Index in search
	if h.search != nil {
		_ = h.search.IndexModel(search.ModelDocument{
			ID:                 model.ID,
			Slug:               model.Slug,
			Name:               model.Name,
			Description:        model.Description,
			Architecture:       model.Architecture,
			Framework:          model.Framework,
			License:            model.License,
			Language:           model.Language,
			Tags:               model.Tags,
			VerificationStatus: model.VerificationStatus,
			DownloadCount:      model.DownloadCount,
		})
	}

	respondJSON(w, http.StatusCreated, model)
}

func (h *Handler) GetModel(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	// Attach latest release
	releases, _ := h.store.ListReleases(r.Context(), model.ID)
	for _, rel := range releases {
		if rel.IsLatest {
			model.LatestRelease = rel
			break
		}
	}

	respondJSON(w, http.StatusOK, model)
}

func (h *Handler) ListModels(w http.ResponseWriter, r *http.Request) {
	page, limit := parsePage(r)
	q := r.URL.Query()
	architecture := q.Get("architecture")
	license := q.Get("license")
	framework := q.Get("framework")

	models, total, err := h.store.ListModels(r.Context(), page, limit, architecture, license, framework)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	if models == nil {
		models = make([]*db.Model, 0)
	}
	respondJSON(w, http.StatusOK, PagedResponse{Data: models, Total: total, Page: page, Limit: limit})
}

func (h *Handler) UpdateModel(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	userID := authmw.UserID(r.Context())
	isAdmin := authmw.IsAdmin(r.Context())

	existing, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	if !isAdmin && existing.UploaderID != userID {
		respondError(w, http.StatusForbidden, "you do not own this model")
		return
	}

	var req createModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	model, err := h.store.UpdateModel(r.Context(), existing.ID, req.Name, req.Description,
		req.Architecture, req.Framework, req.License, req.Language, req.Tags)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "could not update model")
		return
	}

	if h.search != nil {
		_ = h.search.IndexModel(search.ModelDocument{
			ID: model.ID, Slug: model.Slug, Name: model.Name,
			Description: model.Description, Architecture: model.Architecture,
			Framework: model.Framework, License: model.License,
			Tags: model.Tags, VerificationStatus: model.VerificationStatus,
			DownloadCount: model.DownloadCount,
		})
	}

	respondJSON(w, http.StatusOK, model)
}

func (h *Handler) VerifyModel(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	validStatuses := map[string]bool{
		"verified_author": true, "community_verified": true,
		"mirror": true, "archived": true, "unverified": true,
	}
	if !validStatuses[body.Status] {
		respondError(w, http.StatusBadRequest, "invalid verification status")
		return
	}

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	if err := h.store.SetVerificationStatus(r.Context(), model.ID, body.Status); err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": body.Status})
}

func (h *Handler) ListComments(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	page, limit := parsePage(r)
	comments, total, err := h.store.ListComments(r.Context(), model.ID, page, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	if comments == nil {
		comments = make([]*db.Comment, 0)
	}
	respondJSON(w, http.StatusOK, PagedResponse{Data: comments, Total: total, Page: page, Limit: limit})
}

func (h *Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	body.Content = strings.TrimSpace(body.Content)
	if len(body.Content) < 1 {
		respondError(w, http.StatusBadRequest, "content is required")
		return
	}

	userID := authmw.UserID(r.Context())
	comment, err := h.store.CreateComment(r.Context(), model.ID, userID, body.Content)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusCreated, comment)
}

func (h *Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")
	userID := authmw.UserID(r.Context())
	isAdmin := authmw.IsAdmin(r.Context())

	if err := h.store.DeleteComment(r.Context(), commentID, userID, isAdmin); err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "comment not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

