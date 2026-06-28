# ─── Build stage ──────────────────────────────────────────────────────────────
# No local Go needed — everything runs inside this container.
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go.mod first. go.sum may or may not exist yet.
COPY go.mod go.sum* ./

# Download declared dependencies (works even without go.sum).
# The || true lets us proceed to the full build if this partially fails.
RUN go mod download || true

# Copy full source so go mod tidy can resolve all imports.
COPY . .

# Tidy generates/updates go.sum and fetches any missing modules,
# then build the binary.
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /huggingbay ./cmd/server

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /huggingbay /usr/local/bin/huggingbay

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/huggingbay"]
