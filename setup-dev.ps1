# Setup script for Agent Dashboard development environment
Write-Host "Setting up Agent Dashboard development environment..." -ForegroundColor Green

# Get the current directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Install root dependencies (concurrently)
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
Set-Location $scriptDir
npm install

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$scriptDir\frontend"
npm install

# Check if Python virtual environment exists
Set-Location "$scriptDir\backend"
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment and install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  .\start-app.ps1    (PowerShell - opens separate windows)" -ForegroundColor White
Write-Host "  .\start-app.bat    (Batch file - opens separate windows)" -ForegroundColor White
Write-Host "  npm run dev        (Single terminal with concurrently)" -ForegroundColor White

Set-Location $scriptDir 