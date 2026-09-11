$ErrorActionPreference = 'Stop'
$health = Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/health'
if ($health.status -ne 'ok') { throw 'Health endpoint did not return status=ok' }
$created = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/v1/tasks' -ContentType 'application/json' -Body '{"title":"Automation smoke test","priority":"high"}'
if (-not $created.data._id) { throw 'Task creation did not return an id' }
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/api/v1/tasks/$($created.data._id)"
Write-Output 'Container smoke test passed.'
