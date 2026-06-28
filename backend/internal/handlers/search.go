package handlers

import (
	"net/http"
)

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	page, limit := parsePage(r)
	filters := r.URL.Query().Get("filter")

	if h.search == nil {
		respondError(w, http.StatusServiceUnavailable, "search is unavailable")
		return
	}

	result, err := h.search.Search(query, page, limit, filters)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "search error")
		return
	}
	respondJSON(w, http.StatusOK, result)
}

func (h *Handler) LatestModels(w http.ResponseWriter, r *http.Request) {
	_, limit := parsePage(r)
	if limit > 50 {
		limit = 50
	}
	models, err := h.store.ListLatestModels(r.Context(), limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusOK, models)
}

func (h *Handler) PopularModels(w http.ResponseWriter, r *http.Request) {
	_, limit := parsePage(r)
	if limit > 50 {
		limit = 50
	}
	models, err := h.store.ListPopularModels(r.Context(), limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusOK, models)
}
