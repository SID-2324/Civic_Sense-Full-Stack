param(
  [string]$DemoId = '9764b712-eaf7-4836-895f-d5a4348b2bb5',
  [int]$WaitSeconds = 6
)

# Script to: run migrations, start backend in a new window, then run smoke tests locally.
# Usage: Open PowerShell, run from repo root or just execute this script.

# Move to repo root (assumes script is in scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Set-Location ..\

$env:API_DEMO_ID = $DemoId
Write-Host "Using demo id: $DemoId"

Write-Host "Running migrations..."
npm run migrate
if ($LASTEXITCODE -ne 0) {
  Write-Error "Migrations failed. Check output above and fix before continuing."
  exit 1
}

Write-Host "Starting backend (npm run dev) in a new PowerShell window..."
# Start backend in a new window so it stays running while we run smoke tests here.
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","npm run dev" -WindowStyle Normal

Write-Host "Waiting $WaitSeconds seconds for backend to warm up..."
Start-Sleep -Seconds $WaitSeconds

Write-Host "Running smoke tests (scripts/test.ps1)..."
& ".\scripts\test.ps1"

Write-Host "Smoke tests complete. Review output above and backend window for runtime logs."