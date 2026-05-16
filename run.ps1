#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the entire FAMS stack (API, Gateway, Frontend, Postgres, Redis, MinIO, Seq, Prometheus, Grafana) via Docker Compose.
.PARAMETER Down
    Stops and removes the stack.
.PARAMETER Rebuild
    Forces a rebuild of the application images before starting.
.PARAMETER Logs
    Tails logs after starting.
#>
[CmdletBinding()]
param(
    [switch]$Down,
    [switch]$Rebuild,
    [switch]$Logs
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn2($m)  { Write-Host "    $m" -ForegroundColor Yellow }

# --- 1. Docker check ---
Write-Step "Checking Docker"
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Error "Docker is not installed or not on PATH. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
}
try { docker info --format '{{.ServerVersion}}' 1>$null } catch {
    Write-Error "Docker daemon is not running. Start Docker Desktop and try again."
}
Write-Ok "Docker is running."

# --- 2. Stop mode ---
if ($Down) {
    Write-Step "Stopping FAMS stack"
    docker compose down
    Write-Ok "Stack stopped."
    return
}

# --- 3. .env bootstrap ---
Write-Step "Checking .env file"
if (-not (Test-Path .\.env)) {
    if (Test-Path .\.env.example) {
        Copy-Item .\.env.example .\.env
        Write-Warn2 ".env created from .env.example - review secrets before production use."
    } else {
        Write-Error ".env.example not found; cannot bootstrap environment."
    }
} else {
    Write-Ok ".env present."
}

# --- 4. Build + Up ---
$composeArgs = @('compose', 'up', '-d')
if ($Rebuild) { $composeArgs += '--build' }

Write-Step "Starting containers ($([string]::Join(' ', $composeArgs)))"
& docker @composeArgs
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose up failed (exit $LASTEXITCODE)." }

# --- 5. Wait for API health ---
Write-Step "Waiting for API to become healthy"
$deadline = (Get-Date).AddMinutes(3)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 3 }
}
if ($healthy) { Write-Ok "API is healthy." } else { Write-Warn2 "API did not report healthy within 3 minutes - check 'docker compose logs fams-api'." }

# --- 6. Status + URLs ---
Write-Step "Container status"
docker compose ps

Write-Host ""
Write-Host "FAMS is up. Open:" -ForegroundColor Green
Write-Host "  Frontend (entry) : http://localhost:8080"
Write-Host "  API Swagger      : http://localhost:5000/swagger"
Write-Host "  Hangfire         : http://localhost:5000/hangfire"
Write-Host "  Seq logs         : http://localhost:8081"
Write-Host "  MinIO console    : http://localhost:9001"
Write-Host "  Grafana          : http://localhost:3001"
Write-Host "  Prometheus       : http://localhost:9090"
Write-Host ""
Write-Host "Stop with: .\run.ps1 -Down" -ForegroundColor DarkGray

if ($Logs) {
    Write-Step "Tailing logs (Ctrl+C to exit)"
    docker compose logs -f
}
