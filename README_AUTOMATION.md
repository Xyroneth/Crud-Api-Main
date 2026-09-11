# Automation checklist

- Install Node.js 18+ (the project requires 18+, despite the broader 16+ prerequisite), npm, Docker Desktop, Docker Compose, Git, GitHub CLI (`gh`), and VS Code with its `code` command.
- Authenticate GitHub CLI with `gh auth login`.
- Ensure `git config user.name` and `git config user.email` are set.
- Open PowerShell in this project root and run `Set-ExecutionPolicy -Scope Process Bypass; .\run-on-pc.ps1`.

## What the script does

The script performs all work non-interactively. It checks every required tool and GitHub authentication, creates a lockfile when needed, installs exact dependencies, lints, runs the test suite with the 85% coverage gate, compiles TypeScript, builds the production container, starts MongoDB and the API, performs a live CRUD smoke test, and stops the containers.

Only after those checks pass, it verifies the authenticated account is `xyroneth`, creates the public `xyroneth/Crud-Api` GitHub repository, commits the project on `main`, pushes `main` and `dev`, and writes `FINAL_SUMMARY.md`.

The script requires permission to execute local programs, download npm packages and container images, start Docker containers, create files in this directory, and create a public repository in the authenticated GitHub account. It never reads, prints, or stores authentication tokens. GitHub access is handled by the existing `gh` credential store.

Interactive prompts are disabled through CI, Git, GitHub CLI, and npm environment settings. On failure, the script prints the failed command, its captured output, and an exact remediation command.

## Run

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run-on-pc.ps1
```

Optional after completion:

```powershell
code .
```
