# Fix and Run Script for onyx.market
# This script cleans the build directory and starts the dev server

Write-Host "🔧 Fixing build issues..." -ForegroundColor Cyan

# Stop any running Next.js processes
Write-Host "Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*onyx.market*" } | Stop-Process -Force

# Remove .next directory
Write-Host "Removing .next directory..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next directory removed" -ForegroundColor Green
}

# Optional: Remove node_modules/.cache if it exists
Write-Host "Clearing cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ Cache cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host ""

# Start dev server
npm run dev

