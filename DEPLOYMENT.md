# Deployment Guide for WagerFi.onyx PRO

## 🚀 Recommended: Deploy to Vercel (Easiest)

Vercel is made by the Next.js team and has zero-config deployment:

### Steps:
1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Add Environment Variables**
   In Vercel dashboard, go to Settings > Environment Variables and add:
   ```
   NEXT_PUBLIC_PRIVY_APP_ID=cmf6t0hd40005ju0bitgmflbd
   NEXT_PUBLIC_SUPABASE_URL=https://zdhvlqkiaxnawwxxlzkg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_WAGERFI_PROGRAM_ID=7XqYNMDMkHf8R9Qj8Zv9Yc3Qx1Yz2Wv3Xp4Qr5St6Tu
   NEXT_PUBLIC_BACKGROUND_WORKER_URL=https://wagerfi-resolver.onrender.com
   NEXT_PUBLIC_TREASURY_WALLET=9XqYNMDMkHf8R9Qj8Zv9Yc3Qx1Yz2Wv3Xp4Qr5St6Tu
   ```

4. **Redeploy** - Your app will be live at `your-app.vercel.app`

---

## 🌐 Option 2: Deploy to Netlify

### Steps:
1. **Push to GitHub** (same as above)

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repo

3. **Build Settings**
   - Base directory: `onyx.market`
   - Build command: `npm run build`
   - Publish directory: `.next`
   
4. **Install Next.js Plugin**
   - In Netlify dashboard, go to "Plugins"
   - Search for "@netlify/plugin-nextjs"
   - Click "Install"

5. **Add Environment Variables**
   - Go to Site settings > Environment variables
   - Add all variables from `.env.local`

6. **Deploy** - Click "Deploy site"

**Note**: The `netlify.toml` file is already configured in your project.

---

## ❌ Why Drag-and-Drop Doesn't Work

Next.js apps have:
- **API Routes** (backend functionality)
- **Server-side Rendering** (dynamic pages)
- **Build-time Generation** (needs Node.js to build)

These require a build process and server environment, not just static HTML files.

---

## 📦 What's in Your Build?

After running `npm run build`, you get:
- `.next/` - Server-rendered pages and API routes
- `.next/static/` - Client-side JavaScript and CSS
- `.next/server/` - Server-side code

This is **NOT** a simple `index.html` - it's a full-stack application.

---

## 🎯 Quick Deploy Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] Environment variables added to hosting platform
- [ ] Build command: `npm run build`
- [ ] Node version: 18 or higher
- [ ] Deploy triggered

---

## 🔧 Troubleshooting

**Build fails?**
- Make sure all environment variables are set
- Check Node.js version is 18+
- Verify all dependencies are installed

**App loads but features don't work?**
- Check environment variables are set correctly
- Verify API keys are valid
- Check browser console for errors

**Need help?**
- Vercel docs: https://vercel.com/docs
- Netlify docs: https://docs.netlify.com
- Next.js deployment: https://nextjs.org/docs/deployment

