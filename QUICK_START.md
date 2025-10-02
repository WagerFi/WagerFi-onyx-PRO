# Quick Start - Get Running in 5 Minutes

## ⚠️ Current Issue

You're seeing a Privy error because you need to set up your own Privy account. The placeholder App ID won't work.

## 🚀 Fix It Now (5 minutes)

### Step 1: Get a Privy App ID (2 minutes)

1. **Go to**: https://dashboard.privy.io
2. **Sign up** with your email (it's free!)
3. **Create a new app**:
   - Name: "onyx.market" (or anything you want)
   - Click "Create App"
4. **Copy your App ID** (looks like: `clpxxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Create Environment File (1 minute)

Create a file called `.env.local` in the `onyx.market` directory:

```env
# Privy (REQUIRED - paste your actual App ID here)
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_from_step_1

# Supabase (optional for now - we'll set up later)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder

# Solana (optional for now)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_WAGERFI_PROGRAM_ID=4Soix4nNvj5HT3v9iaYa5XTENiWEaJdMFzQYGz279di9
```

### Step 3: Restart Dev Server (30 seconds)

Stop your dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

### Step 4: Test It! (1 minute)

1. Go to: `http://localhost:3000/wagers/crypto`
2. Click "Connect Wallet"
3. Privy modal should appear!
4. Connect your Phantom/Solflare wallet

---

## ✅ Success!

If you see the Privy wallet connection modal, you're all set! 🎉

**What works now:**
- ✅ Wallet connection
- ✅ Beautiful UI pages
- ✅ Filter buttons
- ⚠️ No wagers showing (need to set up Supabase)

---

## 🔧 Configure Privy for Solana (Optional but Recommended)

After creating your Privy app:

1. **Go to**: Dashboard → Settings
2. **Supported Chains**: Enable "Solana"
3. **Login Methods**: Keep only "Wallet" enabled
4. **Save changes**

---

## 📊 Next: Set Up Supabase (Optional)

To see actual wagers, you'll need to set up Supabase:

### Quick Supabase Setup (10 minutes)

1. **Go to**: https://supabase.com
2. **Sign up** (free tier is fine)
3. **Create a new project**:
   - Name: "onyx-market"
   - Database password: (save this!)
   - Region: Choose closest to you
   - Wait for project to finish setting up (~2 minutes)

4. **Get your credentials**:
   - Go to: Settings → API
   - Copy "Project URL" → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Update .env.local**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

6. **Run database migrations**:
   ```bash
   # From the WagerFi root directory
   cd onyx.market
   mkdir -p supabase
   cp -r ../supabase/migrations ./supabase/
   
   # Install Supabase CLI
   npm install -g supabase
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

7. **Add test data** (optional):
   - Go to: Supabase Dashboard → SQL Editor
   - Paste and run:
   ```sql
   INSERT INTO crypto_wagers (
     wager_id,
     creator_id,
     creator_address,
     amount,
     token_symbol,
     prediction_type,
     target_price,
     expiry_time,
     status
   ) VALUES (
     'test-wager-1',
     '00000000-0000-0000-0000-000000000000',
     'DummyAddress123',
     0.5,
     'bitcoin',
     'above',
     50000,
     NOW() + INTERVAL '1 day',
     'open'
   );
   ```

8. **Restart dev server** and you should see wagers!

---

## 🎯 Current Status Checklist

- [ ] Privy App ID set in `.env.local`
- [ ] Dev server running without errors
- [ ] Can access `/wagers/crypto` and `/wagers/sports`
- [ ] "Connect Wallet" button works
- [ ] (Optional) Supabase set up
- [ ] (Optional) Test data added

---

## 🆘 Still Having Issues?

### Privy Modal Not Appearing?
- Check browser console for errors
- Make sure you copied the entire App ID
- Try clearing browser cache (Ctrl+Shift+Delete)
- Make sure `.env.local` file is in the `onyx.market` directory

### Pages Look Broken?
- Make sure dev server restarted after creating `.env.local`
- Check terminal for compilation errors
- Try deleting `.next` folder and restarting

### Need Help?
- Check `TROUBLESHOOTING.md` for common issues
- Check `SETUP_GUIDE.md` for detailed instructions

---

*You're almost there! Just need that Privy App ID.* 🚀

