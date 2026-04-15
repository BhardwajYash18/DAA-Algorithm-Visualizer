@echo off
echo ============================================
echo   Algorithm Visualizer - Starting Servers
echo ============================================
echo.

echo [1/2] Starting Flask backend on http://localhost:5000 ...
start "Flask Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

echo [2/2] Starting React frontend on http://localhost:5173 ...
timeout /t 2 /nobreak >nul
start "React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting...
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
