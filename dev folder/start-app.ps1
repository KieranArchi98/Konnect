$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath  = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

# Backend: simple startup script
$backendScript = @"
cd '$backendPath'
if (-Not (Test-Path venv)) { python -m venv venv }
.\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$backendScript

# Frontend: install deps and run dev server in a new window
$frontendScript = @"
cd '$frontendPath'
npm install
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendScript