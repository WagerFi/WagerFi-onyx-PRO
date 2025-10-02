# 🚨 Dev Server Hanging? Try This!

## Quick Fix

The server might be hanging because of a port conflict or cache issue. Here's how to fix it:

### Option 1: Use the Clean Start Script (Easiest)

```powershell
# From the onyx.market directory
.\start-clean.ps1
```

This will:
- Clean build directories
- Kill any processes on ports 3000-3002
- Start fresh

### Option 2: Manual Steps

```powershell
# 1. Navigate to onyx.market folder
cd C:\Users\Studio\Desktop\Downloads\WagerFi\WagerFi\onyx.market

# 2. Kill any Node processes
Get-Process -Name "node" | Stop-Process -Force

# 3. Remove build cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# 4. Start dev server
npm run dev
```

### Option 3: Use Different Port

If port 3000 is in use:

```powershell
npm run dev -- -p 3002
```

This will start on port 3002 instead.

---

## 🔍 Troubleshooting

### Still Hanging?

1. **Check if it's actually running:**
   - Wait 30-60 seconds (first build can be slow)
   - Look for "Ready in X ms" message
   - Check http://localhost:3000

2. **Check terminal output:**
   - Any error messages?
   - Any warnings about ports?

3. **Check Task Manager:**
   - Is Node.exe running?
   - Is it using CPU? (Should spike during build, then calm down)

### Common Issues

**"Port 3000 is already in use"**
```powershell
# Find and kill the process
$conn = Get-NetTCPConnection -LocalPort 3000
Stop-Process -Id $conn.OwningProcess -Force
npm run dev
```

**"EPERM: operation not permitted"**
```powershell
# Run as administrator or clean .next folder
Remove-Item -Recurse -Force .next
npm run dev
```

**Stuck at "Starting..."**
- Wait 60 seconds (initial build is slow)
- If still stuck, kill and restart:
```powershell
Ctrl+C  # Kill the process
npm run dev
```

---

## ✅ Success Indicators

You'll know it's working when you see:

```
   ▲ Next.js 14.2.33
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 3.2s
```

Then visit: http://localhost:3000/wagers/crypto

---

## 🎯 What to Expect

Once running:
- **Home page**: http://localhost:3000 (original onyx.market landing)
- **Crypto wagers**: http://localhost:3000/wagers/crypto ✨
- **Sports wagers**: http://localhost:3000/wagers/sports ✨

You should see:
- Beautiful glassmorphism design
- Your WagerFi data (since we're using same database)
- Connect wallet button
- Filter buttons (Open, Active, All)

---

*Still stuck? Check TROUBLESHOOTING.md for more help!*

