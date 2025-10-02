# 🔨 How to Run Production Build

## Option 1: Using PowerShell (Recommended)

Open PowerShell in the `onyx.market` folder and run:

```powershell
.\fix-build.ps1
```

## Option 2: Direct Terminal Command

Or just run this command directly:

```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force; if (Test-Path .next) { Remove-Item -Recurse -Force .next }; npm run build
```

## Option 3: Using the Terminal in VS Code

1. Open a new PowerShell terminal (Ctrl + Shift + `)
2. Navigate to the onyx.market folder:
   ```powershell
   cd onyx.market
   ```
3. Run the script:
   ```powershell
   .\fix-build.ps1
   ```

---

## ⚠️ Note

You only need to run a production build if you're:
- Deploying to production
- Testing production optimizations
- Creating a production bundle

**For development, just use `npm run dev` which is already running!** 🚀

---

## If You Get "Execution Policy" Error

If PowerShell blocks the script, run this first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Then run the script again:

```powershell
.\fix-build.ps1
```

