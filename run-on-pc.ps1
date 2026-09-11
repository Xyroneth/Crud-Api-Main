[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$env:CI = 'true'
$env:GIT_TERMINAL_PROMPT = '0'
$env:GH_PROMPT_DISABLED = '1'
$env:NPM_CONFIG_YES = 'true'
$script:ComposeStarted = $false

function Stop-Automation {
  param([string]$Command, [object[]]$Output, [string]$Remediation)
  [Console]::Error.WriteLine("FAILED COMMAND: $Command")
  if ($Output) { $Output | ForEach-Object { [Console]::Error.WriteLine([string]$_) } }
  [Console]::Error.WriteLine("REMEDIATION: $Remediation")
  throw 'AUTOMATION_ABORT'
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory)][string]$File,
    [string[]]$Arguments = @(),
    [Parameter(Mandatory)][string]$Remediation
  )
  $display = (($File) + ' ' + (($Arguments | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' ')).Trim()
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $output = & $File @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($exitCode -ne 0) { Stop-Automation -Command $display -Output $output -Remediation $Remediation }
  return $output
}

function Require-Tool {
  param([string]$Name, [string]$Install)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Stop-Automation -Command "$Name --version" -Output @("$Name was not found on PATH.") -Remediation $Install
  }
}

try {
  Require-Tool 'node' 'Install Node.js LTS: winget install OpenJS.NodeJS.LTS; restart PowerShell.'
  Require-Tool 'npm' 'Install Node.js LTS (includes npm): winget install OpenJS.NodeJS.LTS; restart PowerShell.'
  Require-Tool 'git' 'Install Git: winget install Git.Git; restart PowerShell.'
  Require-Tool 'gh' 'Install GitHub CLI: winget install GitHub.cli; then run: gh auth login; gh auth status; gh api user --jq .login'
  Require-Tool 'docker' 'Install Docker Desktop: winget install Docker.DockerDesktop; start Docker Desktop. See https://docs.docker.com/get-docker/'
  Require-Tool 'docker-compose' 'Install Docker Compose: https://docs.docker.com/compose/install/ and ensure docker-compose is on PATH.'
  Require-Tool 'code' 'Install VS Code and its CLI: winget install Microsoft.VisualStudioCode; restart PowerShell.'

  Invoke-Checked node @('--version') 'Reinstall Node.js LTS: winget install OpenJS.NodeJS.LTS'
  Invoke-Checked npm @('--version') 'Reinstall Node.js LTS: winget install OpenJS.NodeJS.LTS'
  Invoke-Checked git @('--version') 'Reinstall Git: winget install Git.Git'
  Invoke-Checked gh @('--version') 'Reinstall GitHub CLI: winget install GitHub.cli'
  Invoke-Checked docker @('--version') 'Start or reinstall Docker Desktop: winget install Docker.DockerDesktop'
  Invoke-Checked docker-compose @('--version') 'Install Docker Compose: https://docs.docker.com/compose/install/'
  Invoke-Checked code @('--version') 'Reinstall VS Code: winget install Microsoft.VisualStudioCode'

  Invoke-Checked gh @('auth', 'status') 'Authenticate without sharing credentials: gh auth login; then verify with: gh auth status; gh api user --jq .login'
  $loginOutput = Invoke-Checked gh @('api', 'user', '--jq', '.login') 'Re-authenticate: gh auth login; gh auth status; gh api user --jq .login'
  $login = ([string]($loginOutput | Select-Object -Last 1)).Trim()
  if ($login -ine 'xyroneth') {
    Stop-Automation 'gh api user --jq .login' @("Authenticated account is '$login', expected 'xyroneth'.") 'Switch or authenticate the correct account: gh auth switch -u xyroneth; gh auth status; gh api user --jq .login'
  }

  $gitName = (& git config user.name 2>&1 | Select-Object -Last 1)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$gitName)) {
    Stop-Automation 'git config user.name' @('Git user.name is missing.') 'Set it: git config --global user.name "Your Name"'
  }
  $gitEmail = (& git config user.email 2>&1 | Select-Object -Last 1)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$gitEmail)) {
    Stop-Automation 'git config user.email' @('Git user.email is missing.') 'Set it: git config --global user.email "you@example.com"'
  }

  if (-not (Test-Path 'package-lock.json')) {
    Invoke-Checked npm @('install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund') 'Check npm network/proxy settings, then run: npm install --package-lock-only --ignore-scripts --no-audit --no-fund'
  }
  if (-not (Test-Path '.git')) { Invoke-Checked git @('init') 'Remove only the incomplete .git directory if safe, then rerun this script.' }
  Invoke-Checked npm @('ci', '--no-audit', '--no-fund') 'Remove node_modules if present, confirm package-lock.json is valid, then run: npm ci --no-audit --no-fund'
  Invoke-Checked npm @('run', 'lint') 'Fix the reported lint errors, then run: npm run lint'
  Invoke-Checked npm @('test', '--', '--coverage') 'Fix the reported tests or coverage shortfall, then run: npm test -- --coverage'
  Invoke-Checked npm @('run', 'build') 'Fix the reported TypeScript errors, then run: npm run build'
  Invoke-Checked docker @('build', '-t', 'task-manager-api:local', '.') 'Start Docker Desktop and verify it with: docker info; then run: docker build -t task-manager-api:local .'

  Invoke-Checked docker-compose @('up', '--build', '-d') 'Start Docker Desktop, inspect with: docker-compose logs; then retry: docker-compose up --build -d'
  $script:ComposeStarted = $true
  $healthy = $false
  for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/health' -TimeoutSec 3
      if ($health.status -eq 'ok') { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 2 }
  }
  if (-not $healthy) {
    $logs = & docker-compose logs --no-color 2>&1
    Stop-Automation 'GET http://localhost:3000/health' $logs 'Inspect: docker-compose logs; resolve the reported startup error; then run: docker-compose up --build -d'
  }
  Invoke-Checked powershell @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/smoke.ps1') 'Inspect API logs with: docker-compose logs api; then rerun: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke.ps1'
  Invoke-Checked docker-compose @('down') 'Retry cleanup: docker-compose down'
  $script:ComposeStarted = $false

  $repoName = 'Crud-Api'
  Invoke-Checked git @('checkout', '-B', 'main') 'Resolve the branch error, then run: git checkout -B main'
  Invoke-Checked git @('add', '.') 'Check file permissions, then run: git add .'
  Invoke-Checked git @('commit', '-m', 'feat: create production task manager API') 'Review git status and hooks, then run: git commit -m "feat: create production task manager API"'
  Invoke-Checked git @('branch', '-f', 'dev', 'main') 'Create the branch manually: git branch -f dev main'

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
  $createOutput = & gh repo create "xyroneth/$repoName" --public --source=. --push --remote=origin 2>&1
    $createExit = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  $createOutput | ForEach-Object { Write-Output $_ }
  if ($createExit -ne 0) {
    Stop-Automation "gh repo create xyroneth/$repoName --public --source=. --push --remote=origin" $createOutput "If the repository already exists, run: git remote add origin https://github.com/xyroneth/Crud-Api.git; git push -u origin main; git push -u origin dev"
  }
  Invoke-Checked git @('push', '-u', 'origin', 'dev') 'Retry after checking GitHub access: git push -u origin dev'
  $repoUrlOutput = Invoke-Checked gh @('repo', 'view', '--json', 'url', '--jq', '.url') 'Get the URL manually: gh repo view --web'
  $repoUrl = ([string]($repoUrlOutput | Select-Object -Last 1)).Trim()

  $summary = @"
# Final Summary

- GitHub repository: $repoUrl
- Docker start: ``docker-compose up --build -d``
- Local start: ``Copy-Item .env.example .env; npm ci; npm run dev``
- Seed: ``npm run seed``
- Tests: ``npm test -- --coverage``
- Coverage report: ``coverage/lcov-report/index.html``
- Demo script: ``DEMO_SCRIPT.txt``
- OpenAPI document: ``openapi.yaml``
"@
  Set-Content -LiteralPath 'FINAL_SUMMARY.md' -Value $summary -Encoding utf8

  [ordered]@{
    repo_url = $repoUrl
    local_start_commands = @('docker-compose up --build -d', 'Copy-Item .env.example .env; npm ci; npm run dev')
    seed_command = 'npm run seed'
    test_command = 'npm test -- --coverage'
    coverage_report_path = 'coverage/lcov-report/index.html'
    demo_script_path = 'DEMO_SCRIPT.txt'
    openapi_path = 'openapi.yaml'
  } | ConvertTo-Json -Depth 3
} catch {
  if ($_.Exception.Message -ne 'AUTOMATION_ABORT') {
    [Console]::Error.WriteLine("Unexpected automation failure: $($_.Exception.Message)")
  }
  exit 1
} finally {
  if ($script:ComposeStarted) { & docker-compose down 2>&1 | Write-Output }
}
