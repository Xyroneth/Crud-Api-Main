# Task Manager API

A production-oriented TypeScript, Express, MongoDB REST API with validation, observability, generated client types, tests, containers, Kubernetes templates, and automated GitHub release plumbing.

## Quick start with Docker

```powershell
docker-compose up --build -d
```

Open Swagger UI at <http://localhost:3000/docs>, health at <http://localhost:3000/health>, and Prometheus metrics at <http://localhost:3000/metrics>.

The web dashboard is available at <http://localhost:8080> when using Docker Compose.

## Local development

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

MongoDB must be available at the URI in `.env`. To run only MongoDB from Compose:

```powershell
docker-compose up -d mongo
```

## Commands

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start with automatic TypeScript reload      |
| `npm run build`        | Compile TypeScript                          |
| `npm start`            | Run the compiled production server          |
| `npm run lint`         | Check source and tests                      |
| `npm test`             | Run Jest tests                              |
| `npm run coverage`     | Run tests with the 85% global coverage gate |
| `npm run seed`         | Replace tasks with 50 realistic examples    |
| `npm run compose:up`   | Start API and MongoDB                       |
| `npm run compose:down` | Stop services and remove the data volume    |

### Frontend development

```powershell
cd frontend
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Vite proxies API requests to the backend on port 3000.

## API

CRUD endpoints live under `/api/v1/tasks`. Listing supports `page`, `limit`, `status`, `priority`, `search`, and `sort`. Every error uses `{ "error": { "code", "message", "details?" } }`, and responses carry an `x-request-id` header.

Import `openapi.yaml` into an OpenAPI client, or import `postman_collection.json` into Postman. The checked-in TypeScript client is at `src/client/generated.ts`; see `src/client/example.ts`.

Python 3.10+ users can use the dependency-free client in `python-client/`:

```powershell
cd python-client
python -m pip install -e .
python example.py
```

## Operations

The image runs as a non-root user and includes a health check. Compose includes MongoDB and an optional Mongo Express profile (`docker-compose --profile tools up`). Kubernetes YAML and a Helm chart are under `deploy/`. Replace the placeholder image owner before deployment.

See [README_AUTOMATION.md](README_AUTOMATION.md) for the one-command validation and GitHub publication workflow, and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution standards.
