@echo off
echo.
echo  ==========================================
echo   PerfKit — Installing dependencies
echo  ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Cleaning old backend modules (if any)...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "backend\package-lock.json" del "backend\package-lock.json"

echo [2/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
  echo.
  echo ERROR: Backend npm install failed
  echo Check the error above and re-run INSTALL.bat
  pause
  exit /b 1
)
cd ..

echo.
echo [3/4] Installing frontend dependencies...
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
cd frontend
call npm install
if %errorlevel% neq 0 (
  echo ERROR: Frontend npm install failed
  pause
  exit /b 1
)
cd ..

echo.
echo [4/4] Creating screenshots directory...
if not exist "screenshots" mkdir screenshots

echo.
echo  ==========================================
echo   Installation complete!
echo   Run START.bat to launch PerfKit
echo  ==========================================
echo.
pause
