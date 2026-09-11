# Demo guide

1. Run `docker-compose up --build -d`.
2. Open <http://localhost:3000/docs> and create a high-priority task.
3. List tasks using `status=todo` and `sort=-createdAt`.
4. Patch the task to `done`, then delete it.
5. Show `/metrics`, `/health`, and the Postman collection.
6. Run `npm test -- --coverage` and open `coverage/lcov-report/index.html`.

Use `DEMO_SCRIPT.txt` as the short screencast checklist.
