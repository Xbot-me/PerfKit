@echo off
echo.
echo  ==========================================
echo   PerfKit — Starting servers
echo  ==========================================
echo.

cd /d "%~dp0"

echo Starting backend on http://localhost:3001 ...
start "PerfKit Backend" cmd /k "cd /d "%~dp0backend" && node index.js"

timeout /t 2 /nobreak >nul

echo Starting frontend on http://localhost:5173 ...
start "PerfKit Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  Opening PerfKit in your browser...
start http://localhost:5173

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop PerfKit.
echo.
