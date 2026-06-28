# Hugging-Bay

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q2L8227VO8)

An open, decentralized registry for AI models. Upload model metadata, attach a `.torrent` file, and let the BitTorrent network handle distribution. No gatekeepers, no bandwidth bills, no lock-in.

Built with Go, Next.js, PostgreSQL, Meilisearch, MinIO, and opentracker. Runs entirely with `docker compose`.

---

## What it does

- Browse and search AI models by name, architecture, license, or format
- Upload models with metadata and attach a `.torrent` file to get a magnet link
- Verify downloads with SHA-256, SHA-512, or BLAKE3 hashes
- REST API with JWT + API key auth for scripting and automation
- Built-in BitTorrent tracker (opentracker) on port 6969

---

## Running it

### Requirements

- Docker Engine ≥ 24 and Docker Compose V2
- A reverse proxy with TLS (Nginx Proxy Manager works well)
- Port 6969 open in your firewall for the BitTorrent tracker

### Setup

```bash
git clone https://github.com/yourname/hugging-bay
cd hugging-bay
cp .env.example .env
```

Edit `.env` and set strong secrets:

```bash
openssl rand -hex 32   # paste into JWT_SECRET
openssl rand -hex 16   # paste into MEILI_MASTER_KEY
# Set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD to anything you like
```

### Start

```bash
make build
make up
```

```bash
docker compose logs -f backend   # watch for errors
docker compose logs -f frontend
```

### Reverse proxy

Point your domain at the two services. In Nginx Proxy Manager, add a custom location snippet:

```nginx
location /api {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 512M;
}
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

> Set `client_max_body_size 512M` or more — torrent files can be large.

### First admin account

Register through the UI, then run:

```bash
make admin USERNAME=yourusername
# or manually:
docker compose exec postgres psql -U hb -d huggingbay \
  -c "UPDATE users SET is_admin=TRUE WHERE username='yourusername';"
```

### Tracker URL

Add this to `.env` so magnet links point to your tracker:

```
TRACKER_ANNOUNCE_URL=udp://yourdomain.com:6969/announce
```

---

## Services

| Service        | Exposed on host                          |
|----------------|------------------------------------------|
| frontend        | `FRONTEND_PORT` (default 3000)          |
| backend         | `BACKEND_PORT` (default 8080)           |
| opentracker     | `TRACKER_PORT` (default 6969, TCP+UDP)  |
| minio console   | `MINIO_CONSOLE_PORT` (default 9001, localhost only) |
| postgres / redis / meilisearch / minio | internal only |

---

## API

All endpoints are under `/api`.

```
GET  /api/models                           list models (paginated, filterable)
GET  /api/models/:slug                     model detail
POST /api/models                           create model  [auth]
PUT  /api/models/:slug                     update model  [auth]
GET  /api/models/:slug/releases            list releases
POST /api/models/:slug/releases            upload release (multipart)  [auth]
GET  /api/models/:slug/releases/:v/magnet  magnet URI
GET  /api/models/:slug/releases/:v/torrent download .torrent file
GET  /api/search?q=...                     full-text search
GET  /api/latest                           recently added
GET  /api/popular                          most downloaded
POST /api/auth/register                    create account
POST /api/auth/login                       sign in → JWT
GET  /api/me                               current user  [auth]
GET  /api/me/api-keys                      list API keys  [auth]
POST /api/me/api-keys                      create API key  [auth]
```

Uploading a release:

```bash
curl -X POST https://yourdomain.com/api/models/my-model/releases \
  -H "Authorization: Bearer $TOKEN" \
  -F 'metadata={"version":"1.0","quantization":"Q4_K_M","parameter_count":7000000000,"sha256":"abc..."}' \
  -F 'torrent=@my-model.torrent'
```

---

## Stack

- **Backend** — Go, Chi, PostgreSQL, Meilisearch, MinIO, opentracker
- **Frontend** — Next.js 14 App Router, Tailwind CSS
- **Distribution** — BitTorrent via opentracker (UDP + TCP, port 6969)
