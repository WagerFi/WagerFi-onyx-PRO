# Technical Architecture - WagerFi on onyx.market

## 🏛️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   Wagers   │  │ Dashboard  │  │   Social   │  │  Profile   ││
│  │   Pages    │  │   Pages    │  │   Pages    │  │   Pages    ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Privy Authentication Provider                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            State Management (React Context)                 │ │
│  │  - WalletContext  - ProfileContext  - NotificationContext  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (Proxy)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ /wagers  │  │ /profile │  │ /notify  │  │ /rewards │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
         │                                │
         │                                │
         ▼                                ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Background Worker   │    │      Supabase Backend        │
│   (Node.js/Express)  │    │    (PostgreSQL + Realtime)   │
│                      │    │                              │
│  - Create Wager     │    │  Tables:                     │
│  - Accept Wager     │    │  - users                     │
│  - Resolve Wager    │    │  - crypto_wagers             │
│  - Cancel Wager     │    │  - sports_wagers             │
│  - Handle Expired   │    │  - notifications             │
│                      │    │  - referrals                 │
│  Hosted on:          │    │  - achievements              │
│  Render.com          │    │  - rewards                   │
└──────────────────────┘    │  - chat_messages             │
         │                   │  - direct_messages           │
         │                   │  + 15 more tables            │
         ▼                   └──────────────────────────────┘
┌──────────────────────┐              │
│   Solana Blockchain  │              │
│                      │              │
│  WagerFi Program:    │              │
│  - Create Escrow    │◀──────────────┘
│  - Accept Wager     │    Realtime
│  - Resolve Wager    │   Subscriptions
│  - Cancel/Refund    │
│                      │
│  Program ID:         │
│  4Soix4nNv...        │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│   External APIs      │
│                      │
│  - CoinGecko (prices)│
│  - Sports APIs       │
│  - Twitter API       │
└──────────────────────┘
```

---

## 🔧 Technology Stack Comparison

| Component | WagerFi (Current) | onyx.market (New) | Migration Strategy |
|-----------|-------------------|-------------------|-------------------|
| **Framework** | React 18 + Vite | Next.js 14 App Router | Convert to file-based routing |
| **Language** | TypeScript | TypeScript | Keep TypeScript |
| **Styling** | Tailwind CSS | Tailwind CSS + Custom | Merge style systems |
| **Fonts** | Default | Surgena + JetBrains Mono | Adopt onyx.market fonts |
| **Animations** | Framer Motion | Framer Motion | Keep existing animations |
| **State** | React Context | React Context | Keep context providers |
| **Routing** | React Router DOM | Next.js App Router | File-based routing |
| **Auth** | Privy (Solana) | MetaMask (Polygon) | Replace with Privy (Solana) |
| **Blockchain** | Solana | Polygon | Keep Solana |
| **Database** | Supabase | None | Add Supabase |
| **Backend** | Express Worker | API Routes | Hybrid: API Routes + Worker |
| **WebSocket** | Native WS | Polymarket WS | Replace with Supabase Realtime |
| **Charts** | Lightweight Charts | None | Add Lightweight Charts |
| **Deployment** | Netlify + Render | Vercel (Polymarket) | Vercel + Render |

---

## 📦 Package Dependencies

### Core Dependencies (Add to onyx.market)

```json
{
  "dependencies": {
    "@privy-io/react-auth": "^2.24.0",
    "@solana/web3.js": "^1.98.2",
    "@solana/wallet-adapter-react": "^0.15.39",
    "@solana/wallet-adapter-base": "^0.9.27",
    "@project-serum/anchor": "^0.26.0",
    "@supabase/supabase-js": "^2.39.6",
    "lightweight-charts": "^4.1.3",
    "date-fns": "^2.30.0",
    "uuid": "^11.1.0",
    "framer-motion": "^12.23.22",
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.11",
    "@types/uuid": "^10.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2"
  }
}
```

---

## 🗄️ Database Schema (Supabase)

### Core Tables

#### 1. users
```sql
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    wallet_address TEXT UNIQUE,
    total_wagered DECIMAL(20, 8) DEFAULT 0,
    total_won DECIMAL(20, 8) DEFAULT 0,
    total_lost DECIMAL(20, 8) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. crypto_wagers
```sql
CREATE TABLE public.crypto_wagers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wager_id TEXT UNIQUE NOT NULL,
    creator_id UUID REFERENCES users(id) NOT NULL,
    acceptor_id UUID REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    token_symbol TEXT NOT NULL,
    prediction_type TEXT NOT NULL, -- 'above' | 'below'
    target_price DECIMAL(20, 8) NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'open',
    winner_id UUID REFERENCES users(id),
    winner_position TEXT, -- 'creator' | 'acceptor'
    resolution_price DECIMAL(20, 8),
    resolution_time TIMESTAMP WITH TIME ZONE,
    on_chain_signature TEXT,
    escrow_pda TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. sports_wagers
```sql
CREATE TABLE public.sports_wagers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wager_id TEXT UNIQUE NOT NULL,
    creator_id UUID REFERENCES users(id) NOT NULL,
    acceptor_id UUID REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    sport TEXT NOT NULL,
    league TEXT NOT NULL,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    prediction TEXT NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'open',
    winner_id UUID REFERENCES users(id),
    winner_position TEXT,
    resolution_outcome TEXT,
    resolution_time TIMESTAMP WITH TIME ZONE,
    on_chain_signature TEXT,
    escrow_pda TEXT,
    reserved_address TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. notifications
```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supporting Tables

- `referrals` - Referral relationships
- `referral_earnings` - Earnings from referrals
- `rewards` - User reward balances
- `scheduled_reward_distributions` - Scheduled rewards
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress
- `milestone_winners` - Milestone tracking
- `treasury_snapshots` - Treasury balance tracking
- `support_tracker` - Support tickets
- `support_messages` - Support conversations
- `chat_messages` - Global chat
- `direct_messages` - Private messages
- `friends` - Friend relationships
- `friend_requests` - Pending friend requests
- `wager_resolutions` - Resolution attempts

---

## 🔐 Authentication Flow

```
┌─────────────┐
│    User     │
└─────────────┘
      │
      │ 1. Click "Connect Wallet"
      ▼
┌─────────────┐
│   Privy     │ 2. Select Wallet (Phantom, Solflare, etc.)
│   Modal     │
└─────────────┘
      │
      │ 3. Approve Connection
      ▼
┌─────────────┐
│   Wallet    │ 4. Sign Message
│  Extension  │
└─────────────┘
      │
      │ 5. Return Wallet Address
      ▼
┌─────────────┐
│   Privy     │ 6. Create Session
│   Session   │
└─────────────┘
      │
      │ 7. Check if user exists
      ▼
┌─────────────┐
│  Supabase   │
│   Query     │ SELECT * FROM users WHERE wallet_address = ?
└─────────────┘
      │
      ├─── User Exists ────────┐
      │                        │
      │                        ▼
      │              ┌─────────────┐
      │              │   Load      │
      │              │   Profile   │
      │              └─────────────┘
      │
      └─── User Not Exists ───┐
                              │
                              ▼
                    ┌─────────────┐
                    │   Show      │
                    │   Signup    │
                    │   Modal     │
                    └─────────────┘
                              │
                              │ 8. Enter Username
                              ▼
                    ┌─────────────┐
                    │  Create     │
                    │  User       │ INSERT INTO users (...)
                    └─────────────┘
                              │
                              ▼
                    ┌─────────────┐
                    │   Load      │
                    │   Profile   │
                    └─────────────┘
```

---

## 🎮 Wager Lifecycle

### Crypto Wager Flow

```
┌─────────────┐
│   Creator   │ 1. Select token (BTC, ETH, etc.)
└─────────────┘
      │         2. Choose prediction (above/below)
      │         3. Set target price ($50,000)
      │         4. Choose deadline (24 hours)
      │         5. Set amount (0.5 SOL)
      │
      │ 6. Click "Create Wager"
      ▼
┌─────────────────────────────────────┐
│  Next.js API Route                  │
│  POST /api/wagers/create            │
└─────────────────────────────────────┘
      │
      │ 7. Forward to Background Worker
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  POST /create-wager                 │
└─────────────────────────────────────┘
      │
      │ 8. Create escrow on-chain
      ▼
┌─────────────────────────────────────┐
│  Solana Blockchain                  │
│  WagerFi Program: createWager()     │
│  - Creates escrow PDA               │
│  - Transfers 0.5 SOL to escrow      │
│  - Returns signature                │
└─────────────────────────────────────┘
      │
      │ 9. On-chain transaction complete
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  INSERT INTO crypto_wagers          │
│  - wager_id                         │
│  - creator_id                       │
│  - amount                           │
│  - token_symbol                     │
│  - prediction_type                  │
│  - target_price                     │
│  - expiry_time                      │
│  - status = 'open'                  │
│  - on_chain_signature               │
│  - escrow_pda                       │
└─────────────────────────────────────┘
      │
      │ 10. Insert notification
      ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  INSERT INTO notifications          │
│  "Your wager is now live!"          │
└─────────────────────────────────────┘
      │
      │ 11. Realtime broadcast
      ▼
┌─────────────────────────────────────┐
│  All Connected Clients              │
│  Supabase Realtime Channel          │
│  → Update wager lists               │
└─────────────────────────────────────┘
```

### Accept Wager Flow

```
┌─────────────┐
│  Acceptor   │ 1. Browse open wagers
└─────────────┘
      │         2. Find interesting wager
      │         3. Click "Accept Wager"
      │
      ▼
┌─────────────────────────────────────┐
│  Next.js API Route                  │
│  POST /api/wagers/accept            │
└─────────────────────────────────────┘
      │
      │ 4. Forward to Background Worker
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  POST /accept-wager                 │
└─────────────────────────────────────┘
      │
      │ 5. Accept wager on-chain
      ▼
┌─────────────────────────────────────┐
│  Solana Blockchain                  │
│  WagerFi Program: acceptWager()     │
│  - Transfers 0.5 SOL to escrow      │
│  - Updates wager status to 'active' │
│  - Returns signature                │
└─────────────────────────────────────┘
      │
      │ 6. Update database
      ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  UPDATE crypto_wagers               │
│  SET acceptor_id = ?,               │
│      status = 'active'              │
└─────────────────────────────────────┘
      │
      │ 7. Create notifications
      ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  - Notify creator: "Wager accepted!"│
│  - Notify acceptor: "Wager active!" │
└─────────────────────────────────────┘
      │
      │ 8. Realtime broadcast
      ▼
┌─────────────────────────────────────┐
│  All Connected Clients              │
│  → Update wager status              │
└─────────────────────────────────────┘
```

### Resolution Flow

```
┌─────────────┐
│  Deadline   │ 1. Wager expires (24 hours passed)
│  Reached    │
└─────────────┘
      │
      │ 2. Admin/Cron triggers resolution
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  POST /resolve-crypto-wager         │
└─────────────────────────────────────┘
      │
      │ 3. Fetch current price from CoinGecko
      ▼
┌─────────────────────────────────────┐
│  CoinGecko API                      │
│  GET /simple/price?ids=bitcoin      │
│  → Current price: $51,000           │
└─────────────────────────────────────┘
      │
      │ 4. Compare with target price
      │    Target: $50,000
      │    Current: $51,000
      │    Prediction: "above"
      │    Result: Creator wins!
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  Determine winner_position          │
│  → 'creator'                        │
└─────────────────────────────────────┘
      │
      │ 5. Resolve on-chain
      ▼
┌─────────────────────────────────────┐
│  Solana Blockchain                  │
│  WagerFi Program: resolveWager()    │
│  - Calculate payouts:               │
│    Winner: 0.95 SOL (95%)           │
│    Treasury: 0.05 SOL (5%)          │
│  - Transfer funds                   │
│  - Close escrow account             │
│  - Returns signature                │
└─────────────────────────────────────┘
      │
      │ 6. Update database
      ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  UPDATE crypto_wagers               │
│  SET status = 'resolved',           │
│      winner_id = creator_id,        │
│      winner_position = 'creator',   │
│      resolution_price = 51000,      │
│      resolution_time = NOW()        │
└─────────────────────────────────────┘
      │
      │ 7. Update user stats
      ▼
┌─────────────────────────────────────┐
│  Supabase Triggers                  │
│  - Update winner stats (total_won)  │
│  - Update loser stats (total_lost)  │
│  - Update win_rate                  │
│  - Update streak_count              │
│  - Check for achievements           │
└─────────────────────────────────────┘
      │
      │ 8. Process referral rewards
      ▼
┌─────────────────────────────────────┐
│  Background Worker                  │
│  - Calculate referral earnings      │
│  - INSERT INTO referral_earnings    │
│  - UPDATE users.total_referral_     │
│    earnings                         │
└─────────────────────────────────────┘
      │
      │ 9. Create notifications
      ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  - Notify winner: "You won 0.95 SOL!"│
│  - Notify loser: "Better luck next  │
│    time!"                           │
└─────────────────────────────────────┘
      │
      │ 10. Realtime broadcast
      ▼
┌─────────────────────────────────────┐
│  All Connected Clients              │
│  → Update wager status              │
│  → Update user stats                │
│  → Show notifications               │
└─────────────────────────────────────┘
```

---

## 🎨 Component Architecture

### Page Components (Next.js App Router)

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout with providers
├── wagers/
│   ├── page.tsx               # Wagers hub (tabs: sports/crypto)
│   ├── sports/page.tsx        # Sports wagers grid
│   └── crypto/page.tsx        # Crypto wagers grid
├── wager/[id]/page.tsx        # Wager detail page
├── dashboard/
│   ├── page.tsx               # User dashboard
│   ├── active/page.tsx        # Active wagers
│   ├── history/page.tsx       # Wager history
│   └── settings/page.tsx      # User settings
├── profile/[address]/page.tsx # User profile
├── referrals/page.tsx         # Referral dashboard
└── rewards/page.tsx           # Rewards dashboard
```

### Shared Components

```
components/
├── layout/
│   ├── Header.tsx             # Main navigation
│   ├── Sidebar.tsx            # Sidebar navigation
│   └── Footer.tsx             # Footer
├── wagering/
│   ├── WagerCard.tsx          # Wager display card
│   ├── CreateWagerModal.tsx   # Modal for creating wagers
│   ├── CryptoWagerForm.tsx    # Crypto wager form
│   ├── SportsWagerForm.tsx    # Sports wager form
│   └── WagerFilters.tsx       # Filter controls
├── dashboard/
│   ├── UserStats.tsx          # Stats display
│   ├── StatsCard.tsx          # Individual stat card
│   ├── WagerHistory.tsx       # History table
│   └── ActiveWagersList.tsx   # Active wagers list
├── social/
│   ├── Chat.tsx               # Global chat
│   ├── DirectMessage.tsx      # DM interface
│   ├── FriendsList.tsx        # Friends list
│   └── NotificationPanel.tsx  # Notifications
├── achievements/
│   ├── AchievementBadge.tsx   # Badge display
│   └── AchievementModal.tsx   # Achievement details
└── ui/
    ├── GlassCard.tsx          # Glass card component
    ├── Button.tsx             # Styled button
    ├── Input.tsx              # Styled input
    ├── Modal.tsx              # Modal component
    └── Toast.tsx              # Toast notification
```

---

## 🔌 API Architecture

### Next.js API Routes (Proxy Layer)

```typescript
// app/api/wagers/create/route.ts
export async function POST(req: NextRequest) {
  // 1. Validate request
  const body = await req.json();
  
  // 2. Get user from session
  const user = await getUser(req);
  
  // 3. Forward to background worker
  const response = await fetch(`${WORKER_URL}/create-wager`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, userId: user.id }),
  });
  
  // 4. Return response
  return NextResponse.json(await response.json());
}
```

### Background Worker Endpoints

```javascript
// backgroundWorker/server.js

// Create wager on-chain
app.post('/create-wager', async (req, res) => {
  const { wagerId, amount, userId, wagerType } = req.body;
  
  // 1. Create escrow on Solana
  const escrowResult = await createEscrowOnChain(wagerId, amount);
  
  // 2. Insert into Supabase
  await supabase.from('crypto_wagers').insert({
    wager_id: wagerId,
    creator_id: userId,
    amount,
    escrow_pda: escrowResult.escrowPda,
    on_chain_signature: escrowResult.signature,
  });
  
  // 3. Return result
  res.json({ success: true, signature: escrowResult.signature });
});

// Accept wager on-chain
app.post('/accept-wager', async (req, res) => { /* ... */ });

// Resolve wager
app.post('/resolve-crypto-wager', async (req, res) => { /* ... */ });
app.post('/resolve-sports-wager', async (req, res) => { /* ... */ });

// Cancel wager
app.post('/cancel-wager', async (req, res) => { /* ... */ });

// Handle expired wagers
app.post('/handle-expired-wager', async (req, res) => { /* ... */ });
```

---

## 🔒 Security Considerations

### Row Level Security (RLS) Policies

```sql
-- Users can view all profiles
CREATE POLICY "Anyone can view users"
  ON public.users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view wagers
CREATE POLICY "Anyone can view wagers"
  ON public.crypto_wagers FOR SELECT
  USING (true);

-- Only authenticated users can create wagers
CREATE POLICY "Users can create wagers"
  ON public.crypto_wagers FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
```

### API Route Protection

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const token = req.headers.get('authorization');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify Privy token
  const user = await verifyPrivyToken(token);
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  return NextResponse.next();
}
```

---

## 📊 Performance Optimizations

### 1. Database Indexing
```sql
CREATE INDEX idx_crypto_wagers_status ON crypto_wagers(status);
CREATE INDEX idx_crypto_wagers_creator_id ON crypto_wagers(creator_id);
CREATE INDEX idx_crypto_wagers_expiry_time ON crypto_wagers(expiry_time);
```

### 2. Caching Strategy
- **Client-side**: React Query for data caching
- **Server-side**: Next.js automatic route caching
- **Database**: Supabase connection pooling

### 3. Code Splitting
```typescript
// Lazy load heavy components
const CreateWagerModal = dynamic(() => import('@/components/CreateWagerModal'), {
  loading: () => <Spinner />,
});
```

### 4. Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/token-logo.png"
  alt="Token"
  width={40}
  height={40}
  priority // For above-the-fold images
/>
```

---

## 🚀 Deployment Strategy

### Frontend (Vercel)
```bash
# Build command
npm run build

# Environment variables (Vercel Dashboard)
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_PRIVY_APP_ID=***
NEXT_PUBLIC_WORKER_URL=***
```

### Background Worker (Render.com)
```yaml
# render.yaml
services:
  - type: web
    name: wagerfi-worker
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: AUTHORITY_PRIVATE_KEY
        sync: false
```

### Database (Supabase)
- Production instance: Separate from development
- Automatic backups enabled
- Connection pooling configured
- RLS policies enforced

---

## 📈 Monitoring & Analytics

### Error Tracking
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Analytics
```typescript
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Performance Monitoring
- Lighthouse CI for continuous performance checks
- Web Vitals tracking
- Custom performance marks for critical paths

---

*Last Updated: 2025-01-24*

