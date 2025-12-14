$backendPath  = Join-Path $PSScriptRoot 'backend'
$frontendPath = Join-Path $PSScriptRoot 'frontend'

# Backend: create venv if missing, install, activate and run uvicorn in a new window
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backendPath'; if (-Not (Test-Path venv)) { python -m venv venv }; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Frontend: install deps and run dev server in a new window
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendPath'; npm install; npm run dev"