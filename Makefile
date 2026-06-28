.PHONY: help build up down restart logs ps admin

help:
	@echo ""
	@echo "  Hugging-Bay — quick reference"
	@echo ""
	@echo "  First deploy:"
	@echo "    cp .env.example .env   # edit secrets"
	@echo "    make build             # build images (handles Go + npm inside Docker)"
	@echo "    make up                # start all services"
	@echo "    make admin USERNAME=you"
	@echo ""
	@echo "  Day-to-day:"
	@echo "    make up      Start services"
	@echo "    make down    Stop services"
	@echo "    make restart Rebuild + restart"
	@echo "    make logs    Tail all logs"
	@echo "    make ps      Show running containers"
	@echo ""
	@echo "  Local dev (requires Go 1.22+ and Node 20+):"
	@echo "    cd backend && go mod tidy"
	@echo "    cd frontend && npm install && npm run dev"
	@echo ""

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart: build
	docker compose up -d

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

# Promote a user to admin: make admin USERNAME=yourname
admin:
	docker compose exec postgres psql -U hb -d huggingbay -c \
		"UPDATE users SET is_admin=TRUE WHERE username='$(USERNAME)';"
