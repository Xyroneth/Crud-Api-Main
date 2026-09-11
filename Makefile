.PHONY: install dev build lint test coverage seed up down
install:
	npm ci
dev:
	npm run dev
build:
	npm run build
lint:
	npm run lint
test:
	npm test
coverage:
	npm run coverage
seed:
	npm run seed
up:
	docker-compose up --build -d
down:
	docker-compose down -v
