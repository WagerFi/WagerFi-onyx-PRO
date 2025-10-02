# onyx.market Setup Guide

## 🚀 Quick Start

We've successfully integrated Supabase and Privy authentication with sports and crypto wagers pages!

### What's Been Set Up

✅ **Supabase Client** - Database connection ready  
✅ **Privy Authentication** - Solana wallet authentication  
✅ **TypeScript Types** - Full type safety for wagers and users  
✅ **Wallet Hooks** - `useWallet()` and `useProfile()`  
✅ **UI Components** - GlassCard and Button with glassmorphism  
✅ **Wager Card** - Beautiful wager display component  
✅ **Pages** - `/wagers/crypto` and `/wagers/sports`

---

## 📋 Next Steps

### 1. Set Up Environment Variables

Create `.env.local` in the `onyx.market` directory:

```env
# Supabase (get from https://app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Privy (get from https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_WAGERFI_PROGRAM_ID=4Soix4nNvj5HT3v9iaYa5XTENiWEaJdMFzQYGz279di9

# Background Worker (set up later)
NEXT_PUBLIC_WORKER_URL=http://localhost:3001
```

### 2. Set Up Supabase Database

You need to create the database tables. You have two options:

#### Option A: Copy Migrations from WagerFi
```bash
# From the root WagerFi directory
cd onyx.market
mkdir -p supabase/migrations
cp -r ../supabase/migrations/* ./supabase/migrations/

# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### Option B: Run SQL Manually
1. Go to your Supabase project dashboard
2. Click on "SQL Editor"
3. Run the following SQL files in order:
   - `../supabase/migrations/20250101000000_initial_schema.sql`
   - `../supabase/migrations/20250101000001_add_missing_columns.sql`
   - And any other migration files

### 3. Set Up Privy

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create a new app
3. Configure for Solana:
   - Enable "Solana" chain
   - Set wallet type to "Solana only"
   - Enable wallet login
4. Copy your App ID to `.env.local`

### 4. Run the Development Server

```bash
cd onyx.market
npm run dev
```

Visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/wagers/crypto - Crypto wagers
- http://localhost:3000/wagers/sports - Sports wagers

---

## 🎨 What You Can Do Now

### View Wagers
- Navigate to `/wagers/crypto` or `/wagers/sports`
- See wagers in beautiful glassmorphism cards
- Filter by status (open, active, live, all)
- Real-time updates via Supabase Realtime

### Connect Wallet
- Click "Connect Wallet" button
- Privy modal will appear
- Connect your Phantom/Solflare/Backpack wallet
- Your wallet address will be stored

### User Profiles
The `useProfile()` hook automatically:
- Fetches user profile from Supabase
- Creates profile if it doesn't exist (you'll need to add a signup flow)
- Syncs with wallet address

---

## 🧪 Testing

### Test Wallet Connection
```typescript
import { useWallet } from '@/lib/hooks/useWallet';

function TestComponent() {
  const { connected, walletAddress, connect } = useWallet();
  
  return (
    <div>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <p>Address: {walletAddress || 'None'}</p>
      <button onClick={connect}>Connect</button>
    </div>
  );
}
```

### Test Supabase Connection
```typescript
import { supabase } from '@/lib/supabase/client';

async function testSupabase() {
  const { data, error } = await supabase
    .from('crypto_wagers')
    .select('*')
    .limit(5);
    
  console.log('Wagers:', data);
  console.log('Error:', error);
}
```

---

## 📁 File Structure

```
onyx.market/
├── app/
│   ├── layout.tsx              ✅ Updated with Privy
│   ├── providers.tsx           ✅ New - Privy provider
│   ├── wagers/
│   │   ├── crypto/
│   │   │   └── page.tsx        ✅ New - Crypto wagers page
│   │   └── sports/
│   │       └── page.tsx        ✅ New - Sports wagers page
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx       ✅ New - Reusable glass card
│   │   └── Button.tsx          ✅ New - Styled button
│   └── wagering/
│       └── WagerCard.tsx       ✅ New - Wager display card
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ✅ New - Supabase client
│   │   └── types.ts            ✅ New - Database types
│   └── hooks/
│       ├── useWallet.ts        ✅ New - Wallet hook
│       └── useProfile.ts       ✅ New - Profile hook
└── .env.local                  ⚠️ You need to create this
```

---

## 🔍 Code Examples

### Using the Wallet Hook

```typescript
'use client';

import { useWallet } from '@/lib/hooks/useWallet';

export function MyComponent() {
  const { connected, walletAddress, connect, disconnect } = useWallet();

  if (!connected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {walletAddress}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### Using the Profile Hook

```typescript
'use client';

import { useProfile } from '@/lib/hooks/useProfile';

export function ProfileDisplay() {
  const { profile, loading, createProfile } = useProfile();

  if (loading) return <div>Loading...</div>;

  if (!profile) {
    return (
      <button onClick={() => createProfile('username', 'email@example.com')}>
        Create Profile
      </button>
    );
  }

  return (
    <div>
      <h2>{profile.username}</h2>
      <p>Win Rate: {profile.win_rate}%</p>
      <p>Total Wagered: {profile.total_wagered} SOL</p>
    </div>
  );
}
```

### Fetching Wagers

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { CryptoWager } from '@/lib/supabase/types';

export function WagerList() {
  const [wagers, setWagers] = useState<CryptoWager[]>([]);

  useEffect(() => {
    fetchWagers();
  }, []);

  async function fetchWagers() {
    const { data } = await supabase
      .from('crypto_wagers')
      .select('*')
      .eq('status', 'open');
    
    if (data) setWagers(data);
  }

  return (
    <div>
      {wagers.map(wager => (
        <div key={wager.id}>{wager.token_symbol}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 Features

### Current Features
- ✅ Privy wallet authentication (Solana)
- ✅ Supabase database integration
- ✅ Real-time wager updates
- ✅ Crypto wagers page
- ✅ Sports wagers page
- ✅ Glassmorphism UI components
- ✅ Responsive design
- ✅ Type-safe database queries

### Coming Next
- [ ] Create wager modal
- [ ] Accept wager flow
- [ ] User signup modal
- [ ] User dashboard
- [ ] Wager detail page
- [ ] Background worker integration
- [ ] On-chain escrow integration

---

## 🐛 Troubleshooting

### Privy Not Loading
- Make sure `NEXT_PUBLIC_PRIVY_APP_ID` is set in `.env.local`
- Restart dev server after adding env vars
- Check browser console for errors

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase dashboard for project status
- Ensure RLS policies allow public reads

### Wagers Not Showing
- Check if database has wagers: Go to Supabase dashboard → Table Editor
- Verify RLS policies allow public SELECT on crypto_wagers and sports_wagers
- Check browser console for fetch errors

### TypeScript Errors
```bash
# Rebuild types
npm run build

# Or check types only
npx tsc --noEmit
```

---

## 📚 Documentation

- [Privy Docs](https://docs.privy.io/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

## 🚀 Next Steps

1. **Set up environment variables** (.env.local)
2. **Create Supabase database** (run migrations)
3. **Configure Privy app** (dashboard.privy.io)
4. **Test the pages** (npm run dev)
5. **Add some test wagers** (Supabase dashboard)
6. **Implement create wager flow** (next task!)

---

*Happy coding! 🎉*

