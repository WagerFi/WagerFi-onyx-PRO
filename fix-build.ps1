# Fix Windows build permissions and run build
# Run this script if you get EPERM errors during build

Write-Host "Fixing build permissions..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Remove build directories
Write-Host "Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
}

# Wait again
Start-Sleep -Seconds 1

# Run build
Write-Host "Starting build..." -ForegroundColor Green
npm run build

