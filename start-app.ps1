# Start frontend and backend in separate PowerShell windows
$frontendCommand = 'cd frontend; npm run dev'
$backendCommand = 'cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload'

Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Write-Host 'Frontend running on http://localhost:5173' -ForegroundColor Yellow
Write-Host 'Backend running on http://localhost:8000' -ForegroundColor Yellow
Write-Host 'Press any key to exit this launcher...' -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')