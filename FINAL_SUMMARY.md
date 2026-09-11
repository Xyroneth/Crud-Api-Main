# Final Summary

- GitHub repository: https://github.com/Xyroneth/Crud-Api
- Docker start: `docker-compose up --build -d`
- Frontend: http://localhost:8080
- API documentation: http://localhost:3000/docs
- API health: http://localhost:3000/health
- Prometheus metrics: http://localhost:3000/metrics
- Local start: `Copy-Item .env.example .env; npm ci; npm run dev`
- Frontend checks: `cd frontend; npm ci; npm run lint; npm run build`
- Seed: `npm run seed`
- Tests: `npm test -- --coverage`
- Python client tests: `cd python-client; python -m unittest discover -s tests -v`
- Coverage report: `coverage/lcov-report/index.html`
- Demo script: `DEMO_SCRIPT.txt`
- OpenAPI document: `openapi.yaml`
