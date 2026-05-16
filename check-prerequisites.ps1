#Requires -Version 5.1
<#
.SYNOPSIS
    Checks and reports all prerequisites required to run the FAMS stack locally.
#>

$ErrorActionPreference = "Continue"
$missing = @()
$found = @()

function Test-Tool {
    param(
        [string]$Name,
        [string]$Command,
        [string]$VersionArg,
        [string]$MinVersion,
        [string]$InstallUrl,
        [string]$InstallNote = ""
    )
    try {
        $output = & $Command $VersionArg 2>&1 | Select-Object -First 1
        $version = ($output -replace '[^\d.]', '').Trim().TrimStart('.')
        Write-Host "  [OK] $Name : $output" -ForegroundColor Green
        $script:found += $Name
    } catch {
        Write-Host "  [MISSING] $Name not found." -ForegroundColor Red
        Write-Host "    Install from: $InstallUrl" -ForegroundColor Yellow
        if ($InstallNote) { Write-Host "    Note: $InstallNote" -ForegroundColor Cyan }
        $script:missing += $Name
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  FAMS Prerequisites Check" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking required tools..." -ForegroundColor White
Write-Host ""

Test-Tool `
    -Name "Docker Desktop" `
    -Command "docker" `
    -VersionArg "--version" `
    -MinVersion "24.0" `
    -InstallUrl "https://www.docker.com/products/docker-desktop/"

Test-Tool `
    -Name "Docker Compose" `
    -Command "docker" `
    -VersionArg "compose version" `
    -MinVersion "2.20" `
    -InstallUrl "https://docs.docker.com/compose/install/" `
    -InstallNote "Bundled with Docker Desktop"

Test-Tool `
    -Name ".NET SDK 8" `
    -Command "dotnet" `
    -VersionArg "--version" `
    -MinVersion "8.0" `
    -InstallUrl "https://dotnet.microsoft.com/download/dotnet/8.0"

Test-Tool `
    -Name "Node.js 20" `
    -Command "node" `
    -VersionArg "--version" `
    -MinVersion "20.0" `
    -InstallUrl "https://nodejs.org/en/download/"

Test-Tool `
    -Name "npm" `
    -Command "npm" `
    -VersionArg "--version" `
    -MinVersion "10.0" `
    -InstallUrl "https://nodejs.org/en/download/" `
    -InstallNote "Bundled with Node.js"

Test-Tool `
    -Name "Git" `
    -Command "git" `
    -VersionArg "--version" `
    -MinVersion "2.40" `
    -InstallUrl "https://git-scm.com/downloads"

Write-Host ""
Write-Host "Optional tools:" -ForegroundColor White
Write-Host ""

Test-Tool `
    -Name "VS Code" `
    -Command "code" `
    -VersionArg "--version" `
    -MinVersion "1.90" `
    -InstallUrl "https://code.visualstudio.com/download" `
    -InstallNote "Recommended IDE with FAMS extensions"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan

if ($missing.Count -eq 0) {
    Write-Host "  RESULT: All prerequisites satisfied!" -ForegroundColor Green
    Write-Host "  Run: cp .env.example .env && docker compose up -d" -ForegroundColor Green
} else {
    Write-Host "  RESULT: Missing tools:" -ForegroundColor Red
    foreach ($m in $missing) {
        Write-Host "    - $m" -ForegroundColor Red
    }
    Write-Host "  Install the missing tools and re-run this script." -ForegroundColor Yellow
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
