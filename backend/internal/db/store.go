package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/lib/pq"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// ─── Types ───────────────────────────────────────────────────────────────────

type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email,omitempty"`
	DisplayName string    `json:"display_name"`
	Bio         string    `json:"bio"`
	AvatarURL   string    `json:"avatar_url"`
	IsAdmin     bool      `json:"is_admin"`
	IsModerator bool      `json:"is_moderator"`
	CreatedAt   time.Time `json:"created_at"`
}

type Model struct {
	ID                 string    `json:"id"`
	Slug               string    `json:"slug"`
	Name               string    `json:"name"`
	Description        string    `json:"description"`
	Architecture       string    `json:"architecture"`
	Framework          string    `json:"framework"`
	License            string    `json:"license"`
	Language           string    `json:"language"`
	UploaderID         string    `json:"uploader_id"`
	Uploader           *User     `json:"uploader,omitempty"`
	VerificationStatus string    `json:"verification_status"`
	Tags               []string  `json:"tags"`
	DownloadCount      int64     `json:"download_count"`
	LatestRelease      *Release  `json:"latest_release,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Release struct {
	ID             string         `json:"id"`
	ModelID        string         `json:"model_id"`
	Version        string         `json:"version"`
	Description    string         `json:"description"`
	IsLatest       bool           `json:"is_latest"`
	MagnetURI      string         `json:"magnet_uri"`
	TorrentURL     string         `json:"torrent_url"`
	InfoHash       string         `json:"info_hash"`
	SHA256         string         `json:"sha256"`
	SHA512         string         `json:"sha512"`
	BLAKE3         string         `json:"blake3"`
	TotalSize      int64          `json:"total_size"`
	ParameterCount int64          `json:"parameter_count"`
	Quantization   string         `json:"quantization"`
	FileManifest   []ManifestFile `json:"file_manifest"`
	UploaderID     string         `json:"uploader_id"`
	CreatedAt      time.Time      `json:"created_at"`
}

type ManifestFile struct {
	Path   string `json:"path"`
	Size   int64  `json:"size"`
	SHA256 string `json:"sha256,omitempty"`
}

type Comment struct {
	ID        string    `json:"id"`
	ModelID   string    `json:"model_id"`
	UserID    string    `json:"user_id"`
	User      *User     `json:"user,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type APIKey struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	Name       string     `json:"name"`
	KeyPreview string     `json:"key_preview"`
	LastUsedAt *time.Time `json:"last_used_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

// ─── Users ───────────────────────────────────────────────────────────────────

func (s *Store) CreateUser(ctx context.Context, username, email, passwordHash string) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, display_name, bio, avatar_url, is_admin, is_moderator, created_at
	`, username, email, passwordHash).Scan(
		&u.ID, &u.Username, &u.Email, &u.DisplayName, &u.Bio,
		&u.AvatarURL, &u.IsAdmin, &u.IsModerator, &u.CreatedAt,
	)
	return u, err
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*User, string, error) {
	u := &User{}
	var hash string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, display_name, bio, avatar_url, is_admin, is_moderator, created_at, password_hash
		FROM users WHERE email = $1
	`, email).Scan(
		&u.ID, &u.Username, &u.Email, &u.DisplayName, &u.Bio,
		&u.AvatarURL, &u.IsAdmin, &u.IsModerator, &u.CreatedAt, &hash,
	)
	return u, hash, err
}

func (s *Store) GetUserByID(ctx context.Context, id string) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, display_name, bio, avatar_url, is_admin, is_moderator, created_at
		FROM users WHERE id = $1
	`, id).Scan(
		&u.ID, &u.Username, &u.Email, &u.DisplayName, &u.Bio,
		&u.AvatarURL, &u.IsAdmin, &u.IsModerator, &u.CreatedAt,
	)
	return u, err
}

func (s *Store) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, display_name, bio, avatar_url, is_admin, is_moderator, created_at
		FROM users WHERE username = $1
	`, username).Scan(
		&u.ID, &u.Username, &u.DisplayName, &u.Bio,
		&u.AvatarURL, &u.IsAdmin, &u.IsModerator, &u.CreatedAt,
	)
	return u, err
}

func (s *Store) UpdateUser(ctx context.Context, id, displayName, bio, avatarURL string) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx, `
		UPDATE users SET display_name=$2, bio=$3, avatar_url=$4, updated_at=NOW()
		WHERE id=$1
		RETURNING id, username, email, display_name, bio, avatar_url, is_admin, is_moderator, created_at
	`, id, displayName, bio, avatarURL).Scan(
		&u.ID, &u.Username, &u.Email, &u.DisplayName, &u.Bio,
		&u.AvatarURL, &u.IsAdmin, &u.IsModerator, &u.CreatedAt,
	)
	return u, err
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

func (s *Store) CreateAPIKey(ctx context.Context, userID, name, keyHash, keyPreview string) (*APIKey, error) {
	k := &APIKey{}
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO api_keys (user_id, name, key_hash, key_preview)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, key_preview, last_used_at, created_at
	`, userID, name, keyHash, keyPreview).Scan(
		&k.ID, &k.UserID, &k.Name, &k.KeyPreview, &k.LastUsedAt, &k.CreatedAt,
	)
	return k, err
}

func (s *Store) ListAPIKeys(ctx context.Context, userID string) ([]*APIKey, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, user_id, name, key_preview, last_used_at, created_at
		FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var keys []*APIKey
	for rows.Next() {
		k := &APIKey{}
		if err := rows.Scan(&k.ID, &k.UserID, &k.Name, &k.KeyPreview, &k.LastUsedAt, &k.CreatedAt); err != nil {
			return nil, err
		}
		keys = append(keys, k)
	}
	return keys, rows.Err()
}

func (s *Store) DeleteAPIKey(ctx context.Context, id, userID string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM api_keys WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Store) GetAPIKeyByHash(ctx context.Context, hash string) (*APIKey, error) {
	k := &APIKey{}
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, name, key_preview, last_used_at, created_at
		FROM api_keys WHERE key_hash = $1
	`, hash).Scan(&k.ID, &k.UserID, &k.Name, &k.KeyPreview, &k.LastUsedAt, &k.CreatedAt)
	if err != nil {
		return nil, err
	}
	_, _ = s.db.ExecContext(ctx, `UPDATE api_keys SET last_used_at=NOW() WHERE id=$1`, k.ID)
	return k, nil
}

// ─── Models ──────────────────────────────────────────────────────────────────

func (s *Store) CreateModel(ctx context.Context, slug, name, description, architecture, framework, license, language, uploaderID string, tags []string) (*Model, error) {
	m := &Model{}
	var dbTags pq.StringArray
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO models (slug, name, description, architecture, framework, license, language, uploader_id, tags)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, slug, name, description, architecture, framework, license, language,
		          uploader_id, verification_status, tags, download_count, created_at, updated_at
	`, slug, name, description, architecture, framework, license, language, uploaderID, pq.Array(tags)).Scan(
		&m.ID, &m.Slug, &m.Name, &m.Description, &m.Architecture, &m.Framework,
		&m.License, &m.Language, &m.UploaderID, &m.VerificationStatus, &dbTags,
		&m.DownloadCount, &m.CreatedAt, &m.UpdatedAt,
	)
	m.Tags = toStringSlice(dbTags)
	return m, err
}

func (s *Store) GetModelBySlug(ctx context.Context, slug string) (*Model, error) {
	m := &Model{}
	var dbTags pq.StringArray
	var uID, uUsername, uDisplayName, uAvatarURL sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT m.id, m.slug, m.name, m.description, m.architecture, m.framework, m.license,
		       m.language, m.uploader_id, m.verification_status, m.tags, m.download_count,
		       m.created_at, m.updated_at,
		       u.id, u.username, u.display_name, u.avatar_url
		FROM models m
		LEFT JOIN users u ON m.uploader_id = u.id
		WHERE m.slug = $1
	`, slug).Scan(
		&m.ID, &m.Slug, &m.Name, &m.Description, &m.Architecture, &m.Framework, &m.License,
		&m.Language, &m.UploaderID, &m.VerificationStatus, &dbTags, &m.DownloadCount,
		&m.CreatedAt, &m.UpdatedAt,
		&uID, &uUsername, &uDisplayName, &uAvatarURL,
	)
	if err != nil {
		return nil, err
	}
	m.Tags = toStringSlice(dbTags)
	if uID.Valid {
		m.Uploader = &User{
			ID:          uID.String,
			Username:    uUsername.String,
			DisplayName: uDisplayName.String,
			AvatarURL:   uAvatarURL.String,
		}
	}
	return m, nil
}

func (s *Store) ListModels(ctx context.Context, page, limit int, architecture, license, framework string) ([]*Model, int, error) {
	offset := (page - 1) * limit
	where, args := buildModelFilter(architecture, license, framework)

	var total int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM models WHERE 1=1`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	queryArgs := append(args, limit, offset)
	limitPlaceholder := fmt.Sprintf("$%d", len(queryArgs)-1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(queryArgs))

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT m.id, m.slug, m.name, m.description, m.architecture, m.framework, m.license,
		       m.language, m.uploader_id, m.verification_status, m.tags, m.download_count,
		       m.created_at, m.updated_at,
		       u.username, u.display_name
		FROM models m
		LEFT JOIN users u ON m.uploader_id = u.id
		WHERE 1=1%s ORDER BY m.created_at DESC LIMIT %s OFFSET %s
	`, where, limitPlaceholder, offsetPlaceholder), queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var models []*Model
	for rows.Next() {
		m := &Model{}
		var dbTags pq.StringArray
		var uUsername, uDisplayName sql.NullString
		if err := rows.Scan(
			&m.ID, &m.Slug, &m.Name, &m.Description, &m.Architecture, &m.Framework, &m.License,
			&m.Language, &m.UploaderID, &m.VerificationStatus, &dbTags, &m.DownloadCount,
			&m.CreatedAt, &m.UpdatedAt, &uUsername, &uDisplayName,
		); err != nil {
			return nil, 0, err
		}
		m.Tags = toStringSlice(dbTags)
		if uUsername.Valid {
			m.Uploader = &User{Username: uUsername.String, DisplayName: uDisplayName.String}
		}
		models = append(models, m)
	}
	return models, total, rows.Err()
}

func buildModelFilter(architecture, license, framework string) (string, []interface{}) {
	var where string
	var args []interface{}
	i := 1
	if architecture != "" {
		where += fmt.Sprintf(" AND architecture = $%d", i)
		args = append(args, architecture)
		i++
	}
	if license != "" {
		where += fmt.Sprintf(" AND license = $%d", i)
		args = append(args, license)
		i++
	}
	if framework != "" {
		where += fmt.Sprintf(" AND framework = $%d", i)
		args = append(args, framework)
	}
	return where, args
}

func (s *Store) ListLatestModels(ctx context.Context, limit int) ([]*Model, error) {
	return s.queryModelList(ctx, `ORDER BY created_at DESC LIMIT $1`, limit)
}

func (s *Store) ListPopularModels(ctx context.Context, limit int) ([]*Model, error) {
	return s.queryModelList(ctx, `ORDER BY download_count DESC LIMIT $1`, limit)
}

func (s *Store) queryModelList(ctx context.Context, orderClause string, args ...interface{}) ([]*Model, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, name, description, architecture, framework, license,
		       verification_status, tags, download_count, created_at, updated_at
		FROM models `+orderClause, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var models []*Model
	for rows.Next() {
		m := &Model{}
		var dbTags pq.StringArray
		if err := rows.Scan(
			&m.ID, &m.Slug, &m.Name, &m.Description, &m.Architecture, &m.Framework,
			&m.License, &m.VerificationStatus, &dbTags, &m.DownloadCount, &m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, err
		}
		m.Tags = toStringSlice(dbTags)
		models = append(models, m)
	}
	return models, rows.Err()
}

func (s *Store) UpdateModel(ctx context.Context, id, name, description, architecture, framework, license, language string, tags []string) (*Model, error) {
	m := &Model{}
	var dbTags pq.StringArray
	err := s.db.QueryRowContext(ctx, `
		UPDATE models SET name=$2, description=$3, architecture=$4, framework=$5,
		                  license=$6, language=$7, tags=$8, updated_at=NOW()
		WHERE id=$1
		RETURNING id, slug, name, description, architecture, framework, license,
		          language, uploader_id, verification_status, tags, download_count, created_at, updated_at
	`, id, name, description, architecture, framework, license, language, pq.Array(tags)).Scan(
		&m.ID, &m.Slug, &m.Name, &m.Description, &m.Architecture, &m.Framework,
		&m.License, &m.Language, &m.UploaderID, &m.VerificationStatus, &dbTags,
		&m.DownloadCount, &m.CreatedAt, &m.UpdatedAt,
	)
	m.Tags = toStringSlice(dbTags)
	return m, err
}

func (s *Store) SetVerificationStatus(ctx context.Context, modelID, status string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE models SET verification_status=$2, updated_at=NOW() WHERE id=$1`, modelID, status)
	return err
}

func (s *Store) IncrementDownloadCount(ctx context.Context, modelID string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE models SET download_count=download_count+1 WHERE id=$1`, modelID)
	return err
}

// ─── Releases ────────────────────────────────────────────────────────────────

type CreateReleaseParams struct {
	ModelID        string
	Version        string
	Description    string
	MagnetURI      string
	TorrentURL     string
	InfoHash       string
	SHA256         string
	SHA512         string
	BLAKE3         string
	TotalSize      int64
	ParameterCount int64
	Quantization   string
	FileManifest   []byte
	UploaderID     string
}

func (s *Store) CreateRelease(ctx context.Context, p CreateReleaseParams) (*Release, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `UPDATE releases SET is_latest=FALSE WHERE model_id=$1`, p.ModelID); err != nil {
		return nil, err
	}

	r := &Release{}
	var manifest []byte
	err = tx.QueryRowContext(ctx, `
		INSERT INTO releases (model_id, version, description, is_latest, magnet_uri, torrent_url,
		                      info_hash, sha256, sha512, blake3, total_size, parameter_count,
		                      quantization, file_manifest, uploader_id)
		VALUES ($1,$2,$3,TRUE,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id, model_id, version, description, is_latest, magnet_uri, torrent_url,
		          info_hash, sha256, sha512, blake3, total_size, parameter_count,
		          quantization, file_manifest, uploader_id, created_at
	`, p.ModelID, p.Version, p.Description, p.MagnetURI, p.TorrentURL,
		p.InfoHash, p.SHA256, p.SHA512, p.BLAKE3, p.TotalSize, p.ParameterCount,
		p.Quantization, p.FileManifest, p.UploaderID).Scan(
		&r.ID, &r.ModelID, &r.Version, &r.Description, &r.IsLatest, &r.MagnetURI, &r.TorrentURL,
		&r.InfoHash, &r.SHA256, &r.SHA512, &r.BLAKE3, &r.TotalSize, &r.ParameterCount,
		&r.Quantization, &manifest, &r.UploaderID, &r.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	parseManifest(r, manifest)
	return r, nil
}

func (s *Store) ListReleases(ctx context.Context, modelID string) ([]*Release, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, model_id, version, description, is_latest, magnet_uri, torrent_url,
		       info_hash, sha256, sha512, blake3, total_size, parameter_count,
		       quantization, file_manifest, uploader_id, created_at
		FROM releases WHERE model_id=$1 ORDER BY created_at DESC
	`, modelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var releases []*Release
	for rows.Next() {
		r := &Release{}
		var manifest []byte
		if err := rows.Scan(
			&r.ID, &r.ModelID, &r.Version, &r.Description, &r.IsLatest, &r.MagnetURI, &r.TorrentURL,
			&r.InfoHash, &r.SHA256, &r.SHA512, &r.BLAKE3, &r.TotalSize, &r.ParameterCount,
			&r.Quantization, &manifest, &r.UploaderID, &r.CreatedAt,
		); err != nil {
			return nil, err
		}
		parseManifest(r, manifest)
		releases = append(releases, r)
	}
	return releases, rows.Err()
}

func (s *Store) GetRelease(ctx context.Context, modelID, version string) (*Release, error) {
	r := &Release{}
	var manifest []byte
	var row *sql.Row
	if version == "latest" {
		row = s.db.QueryRowContext(ctx, `
			SELECT id, model_id, version, description, is_latest, magnet_uri, torrent_url,
			       info_hash, sha256, sha512, blake3, total_size, parameter_count,
			       quantization, file_manifest, uploader_id, created_at
			FROM releases WHERE model_id=$1 AND is_latest=TRUE
		`, modelID)
	} else {
		row = s.db.QueryRowContext(ctx, `
			SELECT id, model_id, version, description, is_latest, magnet_uri, torrent_url,
			       info_hash, sha256, sha512, blake3, total_size, parameter_count,
			       quantization, file_manifest, uploader_id, created_at
			FROM releases WHERE model_id=$1 AND version=$2
		`, modelID, version)
	}
	err := row.Scan(
		&r.ID, &r.ModelID, &r.Version, &r.Description, &r.IsLatest, &r.MagnetURI, &r.TorrentURL,
		&r.InfoHash, &r.SHA256, &r.SHA512, &r.BLAKE3, &r.TotalSize, &r.ParameterCount,
		&r.Quantization, &manifest, &r.UploaderID, &r.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	parseManifest(r, manifest)
	return r, nil
}

// ─── Comments ────────────────────────────────────────────────────────────────

func (s *Store) CreateComment(ctx context.Context, modelID, userID, content string) (*Comment, error) {
	c := &Comment{}
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO comments (model_id, user_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, model_id, user_id, content, created_at, updated_at
	`, modelID, userID, content).Scan(
		&c.ID, &c.ModelID, &c.UserID, &c.Content, &c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}

func (s *Store) ListComments(ctx context.Context, modelID string, page, limit int) ([]*Comment, int, error) {
	var total int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM comments WHERE model_id=$1`, modelID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT c.id, c.model_id, c.user_id, c.content, c.created_at, c.updated_at,
		       u.username, u.display_name, u.avatar_url
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.model_id=$1 ORDER BY c.created_at DESC
		LIMIT $2 OFFSET $3
	`, modelID, limit, (page-1)*limit)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		c := &Comment{User: &User{}}
		if err := rows.Scan(
			&c.ID, &c.ModelID, &c.UserID, &c.Content, &c.CreatedAt, &c.UpdatedAt,
			&c.User.Username, &c.User.DisplayName, &c.User.AvatarURL,
		); err != nil {
			return nil, 0, err
		}
		comments = append(comments, c)
	}
	return comments, total, rows.Err()
}

func (s *Store) DeleteComment(ctx context.Context, id, userID string, isAdmin bool) error {
	var res sql.Result
	var err error
	if isAdmin {
		res, err = s.db.ExecContext(ctx, `DELETE FROM comments WHERE id=$1`, id)
	} else {
		res, err = s.db.ExecContext(ctx, `DELETE FROM comments WHERE id=$1 AND user_id=$2`, id, userID)
	}
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func toStringSlice(a pq.StringArray) []string {
	if a == nil {
		return []string{}
	}
	return []string(a)
}

func parseManifest(r *Release, data []byte) {
	if len(data) > 0 {
		_ = json.Unmarshal(data, &r.FileManifest)
	}
	if r.FileManifest == nil {
		r.FileManifest = []ManifestFile{}
	}
}
