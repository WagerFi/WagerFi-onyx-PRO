@echo off
echo.
echo ===============================================
echo   Starting onyx.market Development Server
echo ===============================================
echo.

echo Cleaning build directories...
if exist .next (
    rmdir /s /q .next
    echo   - Removed .next folder
)

if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo   - Removed cache folder
)

echo.
echo Starting server...
echo.
echo Visit: http://localhost:3000/wagers/crypto
echo.

npm run dev

