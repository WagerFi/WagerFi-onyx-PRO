# Clean Start Script for onyx.market
# Run this if the dev server hangs or has issues

Write-Host "🧹 Cleaning build directories..." -ForegroundColor Cyan

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next" -ForegroundColor Green
}

# Remove node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ Removed node_modules cache" -ForegroundColor Green
}

# Kill any processes on port 3000-3002
Write-Host ""
Write-Host "🔌 Checking for processes on ports 3000-3002..." -ForegroundColor Cyan

$ports = 3000, 3001, 3002
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "⚠️  Killing process on port $port (PID: $($conn.OwningProcess))" -ForegroundColor Yellow
                Stop-Process -Id $conn.OwningProcess -Force
            }
        }
    }
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev

