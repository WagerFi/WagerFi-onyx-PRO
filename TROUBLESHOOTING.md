# Troubleshooting Guide

## 🔴 500 Internal Server Error

### Problem
You see errors like:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
main.js:1  Failed to load resource...
react-refresh.js:1  Failed to load resource...
```

### Cause
Windows permission error with the `.next` build directory.

### Solution

#### Option 1: Use the Fix Script (Recommended)
```powershell
cd onyx.market
.\fix-and-run.ps1
```

#### Option 2: Manual Fix
1. **Stop the dev server** (Ctrl+C in terminal)

2. **Delete the .next directory:**
   ```powershell
   cd onyx.market
   Remove-Item -Recurse -Force .next
   ```

3. **Start fresh:**
   ```powershell
   npm run dev
   ```

#### Option 3: Full Clean
If the issue persists:
```powershell
# Stop all Node processes
Get-Process -Name "node" | Stop-Process -Force

# Clean everything
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Restart
npm run dev
```

---

## 🔴 Module Not Found Errors

### Problem
```
Module not found: Can't resolve '@/lib/...'
```

### Solution
1. Make sure you're in the `onyx.market` directory
2. Check that all files exist
3. Restart the dev server

---

## 🔴 Privy Not Loading

### Problem
Wallet connect button doesn't appear or Privy modal doesn't open.

### Solution
1. **Check environment variable:**
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_actual_app_id
   ```

2. **Restart dev server after adding env vars:**
   ```powershell
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check browser console for errors**

---

## 🔴 Supabase Connection Failed

### Problem
```
Error: Invalid Supabase URL
```

### Solution
1. **Verify .env.local has correct values:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **No trailing slashes in URL**

3. **Restart dev server**

---

## 🔴 No Wagers Showing

### Problem
Pages load but show "No wagers found"

### Possible Causes & Solutions

### 1. Database Not Set Up
**Check if tables exist:**
- Go to Supabase Dashboard → Table Editor
- Look for `crypto_wagers` and `sports_wagers` tables
- If missing, run migrations

### 2. No Data in Database
**Add test data:**
```sql
-- In Supabase SQL Editor
INSERT INTO crypto_wagers (
  wager_id,
  creator_id,
  amount,
  token_symbol,
  prediction_type,
  target_price,
  expiry_time,
  status
) VALUES (
  'test-wager-1',
  '00000000-0000-0000-0000-000000000000',
  0.5,
  'bitcoin',
  'above',
  50000,
  NOW() + INTERVAL '1 day',
  'open'
);
```

### 3. RLS Policies Too Restrictive
**Allow public reads:**
```sql
-- In Supabase SQL Editor
DROP POLICY IF EXISTS "Anyone can view crypto wagers" ON crypto_wagers;
CREATE POLICY "Anyone can view crypto wagers"
  ON crypto_wagers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view sports wagers" ON sports_wagers;
CREATE POLICY "Anyone can view sports wagers"
  ON sports_wagers FOR SELECT
  USING (true);
```

---

## 🔴 TypeScript Errors

### Problem
Red squiggly lines or build errors

### Solution
```powershell
# Check types without building
npx tsc --noEmit

# If errors persist, restart VS Code
# Then restart dev server
```

---

## 🔴 Port Already in Use

### Problem
```
Error: Port 3000 is already in use
```

### Solution
```powershell
# Find and kill process on port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}

# Or use a different port
npm run dev -- -p 3001
```

---

## 🔴 Wallet Won't Connect

### Problem
Privy modal opens but wallet doesn't connect

### Solutions

1. **Make sure wallet extension is installed**
   - Phantom: https://phantom.app/
   - Solflare: https://solflare.com/

2. **Wallet is unlocked**

3. **Correct network**
   - Should be on Solana Mainnet

4. **Clear browser cache**
   ```
   Ctrl+Shift+Delete → Clear cache
   ```

5. **Try incognito mode**
   - To rule out extension conflicts

---

## 🔴 Build Fails

### Problem
```
npm run build
Error: ...
```

### Solution
```powershell
# Clean everything
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Reinstall dependencies
npm install

# Try build again
npm run build
```

---

## 🔴 Real-time Updates Not Working

### Problem
New wagers don't appear automatically

### Solution

1. **Check Supabase Realtime is enabled**
   - Supabase Dashboard → Database → Replication
   - Enable for `crypto_wagers` and `sports_wagers`

2. **Check browser console for WebSocket errors**

3. **Restart dev server**

---

## 📋 General Debugging Steps

1. **Check browser console** (F12)
   - Look for error messages
   - Check network tab for failed requests

2. **Check terminal output**
   - Look for compilation errors
   - Check for warnings

3. **Verify environment variables**
   ```powershell
   cat .env.local
   ```

4. **Restart everything**
   ```powershell
   # Stop server
   # Close terminal
   # Reopen terminal
   cd onyx.market
   npm run dev
   ```

5. **Clear Next.js cache**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

---

## 🆘 Still Having Issues?

1. **Check the SETUP_GUIDE.md** for step-by-step instructions

2. **Verify all dependencies are installed:**
   ```powershell
   npm list @privy-io/react-auth
   npm list @supabase/supabase-js
   npm list @solana/web3.js
   ```

3. **Compare your setup with the documentation files:**
   - WAGERFI_MIGRATION_PLAN.md
   - TECHNICAL_ARCHITECTURE.md
   - IMPLEMENTATION_GUIDE.md

---

*Last Updated: 2025-01-24*

