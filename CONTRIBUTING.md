# Contributing

Create a branch from `dev`, keep changes focused, and add tests for behavior changes. Before opening a pull request, run:

```powershell
npm ci
npm run lint
npm test -- --coverage
npm run build
```

Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Run `npm run commit` for the guided Commitizen flow when interactive use is acceptable. Never commit `.env`, tokens, credentials, production data, or generated coverage output.

Pull requests should explain the motivation, API compatibility, operational impact, and verification performed. By participating, you agree to follow the code of conduct.
