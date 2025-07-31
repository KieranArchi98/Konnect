@echo off
echo Starting Agent Dashboard...
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Start frontend in new window
echo Starting Frontend...
start "Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

REM Start backend in new window  
echo Starting Backend...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo ✅ Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo.
pause 