# WagerFi to onyx.market Migration Plan

## 🎯 Project Overview

This document outlines the comprehensive plan to migrate WagerFi's core functionality into onyx.market while maintaining onyx.market's premium design aesthetic.

**Goal**: Transform onyx.market from a Polymarket trading interface into a full-featured decentralized wagering platform (like WagerFi) while keeping the beautiful glassmorphism UI and modern design.

---

## 📊 Current State Analysis

### WagerFi (Source)
- **Framework**: React 18 + Vite
- **Blockchain**: Solana (mainnet)
- **Auth**: Privy (Solana wallets)
- **Backend**: Supabase (PostgreSQL)
- **Worker**: Node.js Express server (background worker for on-chain operations)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Key Features**:
  - Crypto price prediction wagers (BTC, ETH, SOL, etc.)
  - Sports betting wagers (NFL, NBA, MLB, NHL, etc.)
  - User profiles with stats (win rate, streak, total wagered)
  - Achievement system (milestones, badges)
  - Referral system with earnings
  - Reward system (daily rewards, scheduled distributions)
  - Social features (chat, direct messages, friends, notifications)
  - Real-time price charts (CoinGecko integration)
  - Live sports data integration
  - On-chain escrow system via Solana program
  - Twitter integration for announcements

### onyx.market (Target)
- **Framework**: Next.js 14 (App Router)
- **Blockchain**: Polygon (currently for Polymarket)
- **Auth**: MetaMask
- **Styling**: Tailwind CSS with custom design system
- **Design System**: 
  - Surgena font family
  - Glassmorphism effects
  - Iridescent borders and hover effects
  - JetBrains Mono for monospace text
  - Custom CSS variables for colors
  - Advanced animations with Framer Motion
- **Current Features**:
  - Polymarket market browsing
  - Order book visualization
  - Single/batch order placement
  - Real-time WebSocket updates

---

## 🏗️ Migration Strategy

### Phase 1: Foundation Setup (Week 1)
**Goal**: Set up the technical foundation while preserving onyx.market's design

#### 1.1 Update Dependencies
```json
{
  "@privy-io/react-auth": "^2.24.0",
  "@solana/web3.js": "^1.98.2",
  "@solana/wallet-adapter-react": "^0.15.39",
  "@supabase/supabase-js": "^2.39.6",
  "framer-motion": "^12.23.22" // Already installed
}
```

#### 1.2 Environment Configuration
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=your_helius_rpc_url
NEXT_PUBLIC_WAGERFI_PROGRAM_ID=4Soix4nNvj5HT3v9iaYa5XTENiWEaJdMFzQYGz279di9

# Background Worker
NEXT_PUBLIC_WORKER_URL=https://your-worker.onrender.com

# APIs
NEXT_PUBLIC_COINGECKO_API_KEY=optional
NEXT_PUBLIC_SPORTS_API_KEY=your_sports_api_key
```

#### 1.3 File Structure Plan
```
onyx.market/
├── app/
│   ├── layout.tsx                 # Root layout with Privy + Supabase providers
│   ├── page.tsx                   # Landing page (keep current design)
│   ├── globals.css                # Keep + enhance with WagerFi utilities
│   ├── wagers/
│   │   ├── page.tsx              # Main wagers page (sports/crypto tabs)
│   │   ├── sports/
│   │   │   └── page.tsx          # Sports wagers grid
│   │   └── crypto/
│   │       └── page.tsx          # Crypto wagers grid
│   ├── wager/
│   │   └── [id]/
│   │       └── page.tsx          # Individual wager detail page
│   ├── dashboard/
│   │   ├── page.tsx              # User dashboard
│   │   ├── active/
│   │   │   └── page.tsx          # Active wagers
│   │   ├── history/
│   │   │   └── page.tsx          # Wager history
│   │   └── settings/
│   │       └── page.tsx          # User settings
│   ├── profile/
│   │   └── [address]/
│   │       └── page.tsx          # User profile page
│   ├── referrals/
│   │   └── page.tsx              # Referral dashboard
│   ├── rewards/
│   │   └── page.tsx              # Rewards dashboard
│   ├── leaderboard/
│   │   └── page.tsx              # Global leaderboard
│   └── api/                       # Keep existing + add new endpoints
│       ├── wagers/
│       │   ├── create/
│       │   │   └── route.ts      # Create wager
│       │   ├── accept/
│       │   │   └── route.ts      # Accept wager
│       │   └── cancel/
│       │       └── route.ts      # Cancel wager
│       ├── profile/
│       │   └── route.ts          # User profile operations
│       └── notifications/
│           └── route.ts          # Notification operations
├── components/
│   ├── wagering/
│   │   ├── WagerCard.tsx         # Individual wager card
│   │   ├── CreateWagerModal.tsx  # Create wager modal
│   │   ├── CryptoWagerPanel.tsx  # Crypto wager creation
│   │   ├── SportsWagerPanel.tsx  # Sports wager creation
│   │   └── WagerFilters.tsx      # Advanced filters
│   ├── dashboard/
│   │   ├── UserStats.tsx         # User statistics
│   │   ├── WagerHistory.tsx      # History table
│   │   └── ActiveWagers.tsx      # Active wagers list
│   ├── social/
│   │   ├── Chat.tsx              # Live chat
│   │   ├── DirectMessages.tsx    # DM system
│   │   ├── Friends.tsx           # Friends list
│   │   └── Notifications.tsx     # Notification panel
│   ├── achievements/
│   │   ├── AchievementBadge.tsx  # Achievement badge
│   │   └── AchievementModal.tsx  # Achievement details
│   ├── layout/
│   │   ├── Header.tsx            # Main header
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── Footer.tsx            # Footer
│   └── ui/
│       ├── GlassCard.tsx         # Reusable glass card
│       ├── IridescentButton.tsx  # Styled button
│       └── AnimatedBackground.tsx # Background effects
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   ├── types.ts              # Database types
│   │   └── queries.ts            # Database queries
│   ├── solana/
│   │   ├── connection.ts         # Solana connection
│   │   ├── escrow.ts             # Escrow client (Anchor)
│   │   └── utils.ts              # Solana utilities
│   ├── hooks/
│   │   ├── useWallet.ts          # Wallet hook (Privy)
│   │   ├── useWagers.ts          # Wagers hook
│   │   ├── useProfile.ts         # Profile hook
│   │   ├── useNotifications.ts   # Notifications hook
│   │   └── useRealtime.ts        # Real-time subscriptions
│   └── utils/
│       ├── formatting.ts         # Number/date formatting
│       └── validation.ts         # Input validation
├── public/
│   └── fonts/
│       └── surgena/              # Keep existing fonts
└── types/
    ├── wagers.ts                 # Wager types
    ├── users.ts                  # User types
    └── notifications.ts          # Notification types
```

---

### Phase 2: Core Features Migration (Weeks 2-3)

#### 2.1 Authentication System
- [x] Replace MetaMask with Privy
- [x] Support Solana wallets (Phantom, Solflare, Backpack, etc.)
- [x] User profile creation flow
- [x] Wallet address → user ID mapping
- [x] Session management

**Implementation**:
```typescript
// app/layout.tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export default function RootLayout({ children }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#8338ec',
          walletChainType: 'solana-only',
        },
        loginMethods: ['wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      <WalletProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </WalletProvider>
    </PrivyProvider>
  );
}
```

#### 2.2 Database Layer (Supabase)
Migrate all database tables and functions:

**Core Tables**:
- `users` - User profiles and stats
- `crypto_wagers` - Crypto price prediction wagers
- `sports_wagers` - Sports betting wagers
- `notifications` - User notifications
- `wager_resolutions` - Resolution tracking
- `referrals` - Referral relationships
- `referral_earnings` - Referral earnings tracking
- `rewards` - User rewards
- `scheduled_reward_distributions` - Scheduled rewards
- `achievements` - User achievements
- `milestone_winners` - Milestone winners tracking
- `treasury_snapshots` - Treasury tracking
- `support_tracker` - Support tickets
- `support_messages` - Support messages
- `chat_messages` - Global chat messages
- `direct_messages` - Private messages
- `friends` - Friend relationships
- `friend_requests` - Friend requests

**Migrations**:
Copy all migration files from `WagerFi/supabase/migrations/` to `onyx.market/supabase/migrations/`

#### 2.3 Wager Creation System

**Crypto Wagers**:
- Token selection (BTC, ETH, SOL, etc.)
- Price prediction (above/below)
- Target price input
- Deadline selection
- Amount input (SOL)
- Reserved address (optional)
- On-chain escrow creation

**Sports Wagers**:
- Sport selection (NFL, NBA, MLB, NHL, etc.)
- Game selection (live API integration)
- Team prediction
- Amount input (SOL)
- Auto-expiry at game start
- On-chain escrow creation

**UI Components** (with onyx.market styling):
```typescript
// components/wagering/CreateWagerModal.tsx
export function CreateWagerModal({ isOpen, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Glass card with iridescent border */}
      <motion.div
        className="relative glass-box"
        style={{
          background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
        }}
      >
        {/* Wager creation form */}
      </motion.div>
    </motion.div>
  );
}
```

#### 2.4 Wager Display & Interaction
- Wager cards with glassmorphism design
- Filter system (status, type, amount, date)
- Search functionality
- Accept wager flow
- Cancel wager flow
- Real-time updates via Supabase realtime

---

### Phase 3: Advanced Features (Weeks 4-5)

#### 3.1 User Dashboard
Redesign with onyx.market aesthetic:
- User stats (total wagered, win rate, streak)
- Active wagers grid
- Wager history table
- Chart visualizations (using same chart library as current onyx.market)
- Achievement badges
- Referral stats

#### 3.2 Achievement System
- Milestone achievements (1st wager, 10 wagers, 100 wagers, etc.)
- Winning streak achievements
- Volume achievements
- Social achievements
- Achievement notifications with animations
- Share to social media

#### 3.3 Referral System
- Unique referral codes
- Referral tracking
- Earnings dashboard
- Claim earnings flow
- Referral leaderboard

#### 3.4 Reward System
- Daily check-in rewards
- Wager participation rewards
- Milestone rewards
- Scheduled reward distributions
- Claim rewards flow

#### 3.5 Social Features
- Global chat (real-time)
- Direct messaging
- Friends system
- Friend requests
- Notification system
- In-app notifications
- Push notifications (optional)

---

### Phase 4: Design System Integration (Week 6)

#### 4.1 Typography
- Primary: Surgena (already configured)
- Monospace: JetBrains Mono (already configured)
- Apply consistently across all new components

#### 4.2 Color System
Adapt WagerFi colors to onyx.market palette:

```css
:root {
  /* Existing onyx.market colors */
  --hue-primary: 223;
  --hue-secondary: 178;
  
  /* Add WagerFi semantic colors */
  --wager-open: hsl(178, 90%, 60%);      /* Cyan */
  --wager-active: hsl(223, 90%, 60%);    /* Blue */
  --wager-won: hsl(142, 71%, 45%);       /* Green */
  --wager-lost: hsl(4, 90%, 58%);        /* Red */
  --wager-cancelled: hsl(45, 93%, 47%);  /* Yellow */
  --wager-expired: hsl(0, 0%, 50%);      /* Gray */
}
```

#### 4.3 Component Styling
Apply glassmorphism to all components:

```typescript
// Reusable glass card component
export function GlassCard({ children, className }) {
  return (
    <div
      className={cn(
        "glass-box relative rounded-xl p-6",
        "backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02]",
        "border border-white/10",
        className
      )}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
      }}
    >
      {children}
    </div>
  );
}
```

#### 4.4 Animations
Use Framer Motion for all animations:
- Page transitions
- Modal animations
- Card hover effects
- Number animations (rolling counters)
- Achievement pop-ups
- Notification toasts

---

### Phase 5: Backend Worker Integration (Week 7)

#### 5.1 Background Worker
Keep the existing Node.js Express server:
- Host on Render.com (or similar)
- Environment variables configuration
- API endpoints for wager operations

**Endpoints to expose**:
- `POST /create-wager` - Create wager on-chain
- `POST /accept-wager` - Accept wager on-chain
- `POST /resolve-crypto-wager` - Resolve crypto wager
- `POST /resolve-sports-wager` - Resolve sports wager
- `POST /cancel-wager` - Cancel and refund wager
- `POST /handle-expired-wager` - Handle expired wagers
- `GET /health` - Health check
- `GET /status` - Service status

#### 5.2 Next.js API Routes
Create proxy routes to background worker:

```typescript
// app/api/wagers/create/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const response = await fetch(`${process.env.WORKER_URL}/create-wager`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

---

### Phase 6: Real-time Features (Week 8)

#### 6.1 Supabase Realtime
Subscribe to database changes:

```typescript
// lib/hooks/useRealtime.ts
export function useRealtimeWagers() {
  const supabase = useSupabaseClient();
  const [wagers, setWagers] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel('wagers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crypto_wagers' },
        (payload) => {
          // Update wagers in real-time
          handleWagerUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { wagers };
}
```

#### 6.2 Live Price Updates
- WebSocket connection to CoinGecko
- Real-time price charts
- Price alerts for active wagers

#### 6.3 Live Sports Data
- Real-time game scores
- Live game status updates
- Auto-resolution when games finish

---

### Phase 7: Testing & Optimization (Week 9)

#### 7.1 Testing
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- On-chain transaction testing (devnet first)

#### 7.2 Performance Optimization
- Image optimization (Next.js Image component)
- Code splitting
- Lazy loading
- Database query optimization
- Caching strategy

#### 7.3 Security Audit
- RLS policies review
- API route protection
- Input validation
- XSS prevention
- CSRF protection

---

### Phase 8: Deployment & Launch (Week 10)

#### 8.1 Deployment Checklist
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Set up environment variables
- [ ] Deploy background worker to Render
- [ ] Configure Supabase production instance
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure analytics

#### 8.2 Documentation
- [ ] User guide
- [ ] Developer documentation
- [ ] API documentation
- [ ] Deployment guide

#### 8.3 Marketing
- [ ] Landing page copy
- [ ] Social media announcements
- [ ] Demo video
- [ ] Blog post

---

## 🔄 Migration Checklist

### Must-Have Features (MVP)
- [x] Privy authentication
- [x] User profiles
- [x] Create crypto wagers
- [x] Create sports wagers
- [x] Accept wagers
- [x] Cancel wagers
- [x] Wager resolution (crypto)
- [x] Wager resolution (sports)
- [x] User dashboard
- [x] Notifications
- [x] Real-time updates

### Nice-to-Have Features (V1.1)
- [ ] Achievement system
- [ ] Referral system
- [ ] Reward system
- [ ] Global chat
- [ ] Direct messaging
- [ ] Friends system
- [ ] Leaderboard
- [ ] Social sharing
- [ ] Twitter integration

### Future Enhancements (V2.0)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Custom token support
- [ ] Multi-chain support
- [ ] NFT wagering
- [ ] Tournament mode
- [ ] Staking system

---

## 🎨 Design Specifications

### Glass Card Template
```css
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95));
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-card:hover::after {
  opacity: 1;
}

.glass-card::after {
  content: "";
  position: absolute;
  inset: -1px;
  padding: 2px;
  border-radius: inherit;
  background: radial-gradient(
    200px circle at var(--mouse-x) var(--mouse-y),
    hsl(280, 100%, 70%),
    hsl(200, 100%, 60%) 25%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.5) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
```

### Button Template
```typescript
<motion.button
  className="relative px-6 py-3 rounded-xl font-medium overflow-hidden"
  style={{
    background: 'linear-gradient(135deg, #8338ec, #3a86ff)',
    fontFamily: 'Surgena, sans-serif',
  }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <span className="relative z-10">Create Wager</span>
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    initial={{ x: '-100%' }}
    whileHover={{ x: '100%' }}
    transition={{ duration: 0.5 }}
  />
</motion.button>
```

---

## 📝 Migration Notes

### Key Differences to Handle

1. **Routing**: React Router → Next.js App Router
   - Convert `<Route>` to file-based routing
   - Convert `useNavigate()` to `useRouter()` (next/navigation)
   - Convert `<Link>` from react-router-dom to next/link

2. **State Management**: Context API remains the same
   - Keep existing context providers
   - Wrap in client components (`'use client'`)

3. **API Calls**: Fetch → Next.js API Routes
   - Move edge function logic to API routes
   - Keep background worker for on-chain operations

4. **Environment Variables**: 
   - Prefix with `NEXT_PUBLIC_` for client-side
   - Keep server-side variables private

5. **Images**: 
   - Use `next/image` for optimization
   - Update imports from `/public`

6. **CSS**: 
   - Keep Tailwind configuration
   - Merge WagerFi utilities with onyx.market globals

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd onyx.market
npm install @privy-io/react-auth @solana/web3.js @supabase/supabase-js

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Solana Documentation](https://docs.solana.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## ✅ Success Criteria

The migration is complete when:

1. ✅ Users can create crypto wagers with glassmorphism UI
2. ✅ Users can create sports wagers with glassmorphism UI
3. ✅ Users can accept wagers from other users
4. ✅ Wagers resolve correctly on-chain
5. ✅ User profiles show accurate stats
6. ✅ Real-time updates work seamlessly
7. ✅ All animations are smooth (60fps)
8. ✅ Design is consistent with onyx.market aesthetic
9. ✅ Mobile responsive design works perfectly
10. ✅ Performance metrics meet targets:
    - Lighthouse score > 90
    - First Contentful Paint < 1.5s
    - Time to Interactive < 3s

---

*Last Updated: 2025-01-24*

