# Install Dependencies Script
# This script installs all required dependencies for the PDF conversion feature

Write-Host "Installing PDF Conversion Dependencies..." -ForegroundColor Green

# Navigate to backend directory
Set-Location "backend"

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install all requirements
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

# Verify key dependencies
Write-Host "Verifying key dependencies..." -ForegroundColor Yellow

$dependencies = @(
    "python-docx",
    "python-pptx", 
    "Pillow",
    "reportlab",
    "libreoffice-convert"
)

foreach ($dep in $dependencies) {
    try {
        python -c "import $($dep.Replace('-', '_')); print('✅ $dep is installed')"
    } catch {
        Write-Host "❌ $dep is NOT installed" -ForegroundColor Red
    }
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "You can now start the backend with:" -ForegroundColor Cyan
Write-Host "cd backend && python -m uvicorn app.main:app --reload" -ForegroundColor White

# Return to original directory
Set-Location ".." 