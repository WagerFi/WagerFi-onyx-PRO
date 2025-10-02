# Security Setup Guide - Polymarket Integration

## ⚠️ CRITICAL: Private Key Security

**NEVER** commit your private key to git or share it publicly!

## Setup Steps

### 1. Create a `.env.local` file

In the root of your project, create a file named `.env.local`:

```bash
# .env.local
POLYMARKET_PRIVATE_KEY=0xYOUR_NEW_PRIVATE_KEY_HERE
```

### 2. Get a New Private Key

**Option A: Create a Dedicated Trading Wallet (Recommended)**
1. Open MetaMask
2. Click your account icon → "Create Account"
3. Name it "Polymarket Trading"
4. Click the 3 dots → Account Details → Export Private Key
5. Enter your password
6. Copy the private key
7. Paste it in `.env.local`

**Option B: Use Existing Wallet**
- ⚠️ **Not recommended** - Only use a wallet with funds you're willing to risk
- Export private key from MetaMask as above

### 3. Fund the Wallet

Your trading wallet needs:
- **USDC** - For placing trades on Polymarket
- **MATIC** - For gas fees (small amount, ~$5-10 worth)

### 4. Verify Configuration

1. Make sure `.env.local` exists and has your key
2. Restart the dev server:
   ```bash
   npm run dev
   ```
3. Check the configuration:
   ```bash
   curl http://localhost:3000/api/polymarket/init
   ```

### 5. Initialize API Keys

```bash
curl -X POST http://localhost:3000/api/polymarket/init
```

You should see:
```json
{
  "success": true,
  "message": "API keys initialized",
  "hasKeys": true
}
```

## What Gets Generated

The private key is used to:
1. **Derive API credentials** (apiKey, apiSecret, apiPassphrase)
2. **Sign orders** when you place trades
3. **Authenticate WebSocket** connections for real-time data

## Security Best Practices

✅ **DO:**
- Use a dedicated wallet for trading
- Keep private key in `.env.local` only
- Add `.env.local` to `.gitignore`
- Use small amounts for testing
- Backup your private key securely (password manager)

❌ **DON'T:**
- Share private key in chat/email
- Commit to git
- Use your main wallet
- Store in frontend code
- Leave in production logs

## Production Deployment

For production (Vercel, etc.):
1. Add `POLYMARKET_PRIVATE_KEY` as environment variable in your hosting platform
2. Never expose it in client-side code
3. All API key operations happen server-side only

## Need Help?

If you exposed a private key:
1. Create a new wallet immediately
2. Transfer all funds to the new wallet
3. Never use the old key again

---

**Your private key = Full access to your funds. Protect it like a password.**

