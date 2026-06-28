.PHONY: help up down build logs ps init-deps

help:
	@echo "Usage:"
	@echo "  make init-deps   Generate go.sum and install npm packages (first time)"
	@echo "  make build       Build all Docker images"
	@echo "  make up          Start all services"
	@echo "  make down        Stop all services"
	@echo "  make logs        Tail all logs"
	@echo "  make ps          Show running containers"

init-deps:
	@echo "→ Resolving Go dependencies..."
	cd backend && go mod tidy
	@echo "→ Installing npm packages..."
	cd frontend && npm install
	@echo "✓ Done. You can now run: make build && make up"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

# Promote a user to admin (usage: make admin USERNAME=yourname)
admin:
	docker compose exec postgres psql -U hb -d huggingbay -c \
		"UPDATE users SET is_admin=TRUE WHERE username='$(USERNAME)';"
