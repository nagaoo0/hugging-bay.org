package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"

	"huggingbay/internal/db"
	authmw "huggingbay/internal/middleware"
	"huggingbay/internal/search"
	"huggingbay/internal/torrent"
)

func (h *Handler) ListReleases(w http.ResponseWriter, r *http.Request) {
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

	releases, err := h.store.ListReleases(r.Context(), model.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	if releases == nil {
		releases = []*db.Release{}
	}
	respondJSON(w, http.StatusOK, releases)
}

func (h *Handler) GetRelease(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	version := chi.URLParam(r, "version")

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	release, err := h.store.GetRelease(r.Context(), model.ID, version)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "release not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}
	respondJSON(w, http.StatusOK, release)
}

func (h *Handler) GetManifest(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	version := chi.URLParam(r, "version")

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	release, err := h.store.GetRelease(r.Context(), model.ID, version)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "release not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	manifest := map[string]interface{}{
		"id":        release.ID,
		"name":      model.Name,
		"version":   release.Version,
		"license":   model.License,
		"sha256":    release.SHA256,
		"sha512":    release.SHA512,
		"blake3":    release.BLAKE3,
		"info_hash": release.InfoHash,
		"magnet":    release.MagnetURI,
		"torrent":   release.TorrentURL,
		"files":     release.FileManifest,
		"size":      release.TotalSize,
	}
	respondJSON(w, http.StatusOK, manifest)
}

func (h *Handler) GetMagnet(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	version := chi.URLParam(r, "version")

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	release, err := h.store.GetRelease(r.Context(), model.ID, version)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "release not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"magnet": release.MagnetURI})
}

func (h *Handler) DownloadTorrent(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	version := chi.URLParam(r, "version")

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	release, err := h.store.GetRelease(r.Context(), model.ID, version)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "release not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	if release.TorrentURL == "" {
		respondError(w, http.StatusNotFound, "no torrent file for this release")
		return
	}

	if h.storage == nil {
		// Redirect to stored URL
		http.Redirect(w, r, release.TorrentURL, http.StatusFound)
		return
	}

	rc, size, err := h.storage.GetTorrent(r.Context(), release.TorrentURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "could not fetch torrent")
		return
	}
	defer rc.Close()

	filename := fmt.Sprintf("%s-%s.torrent", slug, version)
	w.Header().Set("Content-Type", "application/x-bittorrent")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	if size > 0 {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", size))
	}
	// Track download
	_ = h.store.IncrementDownloadCount(r.Context(), model.ID)
	io.Copy(w, rc)
}

func (h *Handler) CreateRelease(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	userID := authmw.UserID(r.Context())
	isAdmin := authmw.IsAdmin(r.Context())

	model, err := h.store.GetModelBySlug(r.Context(), slug)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "model not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "server error")
		return
	}

	if !isAdmin && model.UploaderID != userID {
		respondError(w, http.StatusForbidden, "you do not own this model")
		return
	}

	// Limit upload to 50MB for torrent file itself
	r.Body = http.MaxBytesReader(w, r.Body, 50<<20)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "could not parse form")
		return
	}

	// Read JSON metadata field
	metaStr := r.FormValue("metadata")
	var meta struct {
		Version        string           `json:"version"`
		Description    string           `json:"description"`
		SHA256         string           `json:"sha256"`
		SHA512         string           `json:"sha512"`
		BLAKE3         string           `json:"blake3"`
		ParameterCount int64            `json:"parameter_count"`
		Quantization   string           `json:"quantization"`
		FileManifest   []db.ManifestFile `json:"file_manifest"`
	}
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		respondError(w, http.StatusBadRequest, "invalid metadata JSON")
		return
	}
	if strings.TrimSpace(meta.Version) == "" {
		respondError(w, http.StatusBadRequest, "version is required")
		return
	}

	var infoHash string
	var torrentURL string
	var totalSize int64

	// Process uploaded torrent file
	file, _, err := r.FormFile("torrent")
	if err == nil {
		defer file.Close()
		torrentData, err := io.ReadAll(file)
		if err != nil {
			respondError(w, http.StatusBadRequest, "could not read torrent file")
			return
		}

		infoHash, err = torrent.ExtractInfoHash(torrentData)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid torrent file: "+err.Error())
			return
		}
		totalSize = torrent.TorrentSize(torrentData)

		if h.storage != nil {
			objectName := fmt.Sprintf("%s/%s.torrent", model.ID, meta.Version)
			storedPath, err := h.storage.UploadTorrent(r.Context(), objectName, torrentData)
			if err != nil {
				respondError(w, http.StatusInternalServerError, "could not store torrent file")
				return
			}
			torrentURL = storedPath
		}
	}

	// Build magnet URI
	magnetURI := buildMagnetURI(infoHash, model.Name, totalSize, h.cfg.TrackerAnnounceURL)

	manifestJSON, _ := json.Marshal(meta.FileManifest)

	params := db.CreateReleaseParams{
		ModelID:        model.ID,
		Version:        meta.Version,
		Description:    meta.Description,
		MagnetURI:      magnetURI,
		TorrentURL:     torrentURL,
		InfoHash:       infoHash,
		SHA256:         meta.SHA256,
		SHA512:         meta.SHA512,
		BLAKE3:         meta.BLAKE3,
		TotalSize:      totalSize,
		ParameterCount: meta.ParameterCount,
		Quantization:   meta.Quantization,
		FileManifest:   manifestJSON,
		UploaderID:     userID,
	}

	release, err := h.store.CreateRelease(r.Context(), params)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			respondError(w, http.StatusConflict, "this version already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "could not create release")
		return
	}

	// Re-index model with updated release info
	if h.search != nil {
		_ = h.search.IndexModel(search.ModelDocument{
			ID: model.ID, Slug: model.Slug, Name: model.Name,
			Architecture: model.Architecture, Framework: model.Framework,
			License: model.License, Tags: model.Tags,
			VerificationStatus: model.VerificationStatus,
			DownloadCount:      model.DownloadCount,
			ParameterCount:     release.ParameterCount,
			Quantization:       release.Quantization,
			TotalSize:          release.TotalSize,
		})
	}

	respondJSON(w, http.StatusCreated, release)
}

func buildMagnetURI(infoHash, name string, size int64, trackerURL string) string {
	if infoHash == "" {
		return ""
	}
	q := url.Values{}
	q.Set("xt", "urn:btih:"+strings.ToUpper(infoHash))
	q.Set("dn", name)
	if size > 0 {
		q.Set("xl", fmt.Sprintf("%d", size))
	}
	if trackerURL != "" {
		q.Add("tr", trackerURL)
	}
	// Always include a few well-known public trackers
	q.Add("tr", "udp://tracker.opentrackr.org:1337/announce")
	q.Add("tr", "udp://open.tracker.cl:1337/announce")
	q.Add("tr", "udp://tracker.torrent.eu.org:451/announce")
	return "magnet:?" + q.Encode()
}
