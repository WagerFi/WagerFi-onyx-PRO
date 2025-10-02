# Implementation Guide: WagerFi → onyx.market

This guide provides step-by-step instructions for migrating WagerFi functionality into onyx.market.

---

## 🎯 Quick Start (Days 1-3)

### Day 1: Setup & Dependencies

#### 1.1 Install Required Packages
```bash
cd onyx.market
npm install @privy-io/react-auth@^2.24.0 \
  @solana/web3.js@^1.98.2 \
  @solana/wallet-adapter-react@^0.15.39 \
  @solana/wallet-adapter-base@^0.9.27 \
  @project-serum/anchor@^0.26.0 \
  @supabase/supabase-js@^2.39.6 \
  lightweight-charts@^4.1.3 \
  date-fns@^2.30.0 \
  uuid@^11.1.0

npm install -D @types/uuid@^10.0.0
```

#### 1.2 Environment Setup
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_WAGERFI_PROGRAM_ID=4Soix4nNvj5HT3v9iaYa5XTENiWEaJdMFzQYGz279di9

# Background Worker
NEXT_PUBLIC_WORKER_URL=http://localhost:3001
```

#### 1.3 Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Init project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref
```

#### 1.4 Run Migrations
```bash
# Copy migration files from WagerFi
cp -r ../supabase/migrations/* ./supabase/migrations/

# Push to Supabase
supabase db push
```

---

### Day 2: Core Setup

#### 2.1 Update Root Layout
```typescript
// app/layout.tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            appearance: {
              theme: 'dark',
              accentColor: '#8338ec',
              logo: '/logo.png',
              walletChainType: 'solana-only',
            },
            loginMethods: ['wallet'],
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
              showWalletUIs: true,
            },
            externalWallets: {
              solana: {
                connectors: toSolanaWalletConnectors(),
              },
            },
          }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
```

#### 2.2 Create Supabase Client
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### 2.3 Create Wallet Hook
```typescript
// lib/hooks/useWallet.ts
'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (wallets.length > 0) {
      const solanaWallet = wallets.find(w => w.walletClientType === 'privy');
      if (solanaWallet) {
        setWalletAddress(solanaWallet.address);
      }
    }
  }, [wallets]);

  return {
    ready,
    authenticated,
    user,
    walletAddress,
    login,
    logout,
  };
}
```

---

### Day 3: UI Components

#### 3.1 Create GlassCard Component
```typescript
// components/ui/GlassCard.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function GlassCard({ children, className = '', hoverable = true }: GlassCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverable) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      className={`relative rounded-xl backdrop-blur-md ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onMouseMove={handleMouseMove}
      whileHover={hoverable ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
      
      {/* Iridescent border on hover */}
      {hoverable && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(200px circle at ${mousePosition.x}% ${mousePosition.y}%, 
              hsl(280, 100%, 70%), 
              hsl(200, 100%, 60%) 25%, 
              rgba(0, 0, 0, 0.6) 50%, 
              rgba(0, 0, 0, 0.5) 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '2px',
          }}
        />
      )}
    </motion.div>
  );
}
```

#### 3.2 Create Button Component
```typescript
// components/ui/Button.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  const gradients = {
    primary: 'linear-gradient(135deg, #8338ec, #3a86ff)',
    secondary: 'linear-gradient(135deg, #178, #8338ec)',
    danger: 'linear-gradient(135deg, #ef476f, #fb5607)',
  };

  return (
    <motion.button
      className={`relative px-6 py-3 rounded-xl font-medium overflow-hidden ${className}`}
      style={{
        background: gradients[variant],
        fontFamily: 'Surgena, sans-serif',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      disabled={disabled}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Shimmer effect on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
}
```

#### 3.3 Update globals.css
```css
/* Add to existing globals.css */

/* Utility classes */
@layer utilities {
  .font-surgena {
    font-family: 'Surgena', sans-serif;
  }
  
  .font-jetbrains {
    font-family: 'JetBrains Mono', monospace;
  }
  
  .text-gradient {
    @apply bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(131, 56, 236, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(131, 56, 236, 0.7);
}
```

---

## 🏗️ Core Features Implementation (Days 4-30)

### Week 1: Wager Creation

#### Step 1: Create Wager Types
```typescript
// types/wagers.ts
export interface CryptoWager {
  id: string;
  wager_id: string;
  creator_id: string;
  acceptor_id?: string;
  amount: number;
  token_symbol: string;
  prediction_type: 'above' | 'below';
  target_price: number;
  expiry_time: string;
  status: 'open' | 'active' | 'resolved' | 'cancelled' | 'expired';
  winner_id?: string;
  winner_position?: 'creator' | 'acceptor';
  resolution_price?: number;
  resolution_time?: string;
  on_chain_signature?: string;
  escrow_pda?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SportsWager {
  id: string;
  wager_id: string;
  creator_id: string;
  acceptor_id?: string;
  amount: number;
  sport: string;
  league: string;
  team1: string;
  team2: string;
  prediction: string;
  game_time: string;
  expiry_time: string;
  status: 'open' | 'active' | 'resolved' | 'cancelled' | 'expired';
  winner_id?: string;
  winner_position?: 'creator' | 'acceptor';
  resolution_outcome?: string;
  resolution_time?: string;
  on_chain_signature?: string;
  escrow_pda?: string;
  reserved_address?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
```

#### Step 2: Create Wager Card Component
```typescript
// components/wagering/WagerCard.tsx
'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CryptoWager } from '@/types/wagers';
import { formatDistance } from 'date-fns';

interface WagerCardProps {
  wager: CryptoWager;
  onAccept?: (wagerId: string) => void;
}

export function WagerCard({ wager, onAccept }: WagerCardProps) {
  const timeLeft = formatDistance(new Date(wager.expiry_time), new Date(), {
    addSuffix: true,
  });

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-surgena text-xl font-bold text-gradient">
            {wager.token_symbol.toUpperCase()}
          </h3>
          <p className="font-jetbrains text-sm text-gray-400 mt-1">
            {wager.prediction_type === 'above' ? '↑' : '↓'} ${wager.target_price.toLocaleString()}
          </p>
        </div>
        
        <div className="text-right">
          <p className="font-surgena text-2xl font-bold text-white">
            {wager.amount} SOL
          </p>
          <p className="font-jetbrains text-xs text-gray-400 mt-1">
            {timeLeft}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-4" />

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Prediction</p>
          <p className="font-medium">
            {wager.prediction_type === 'above' ? 'Above' : 'Below'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Target</p>
          <p className="font-medium">${wager.target_price.toLocaleString()}</p>
        </div>
      </div>

      {/* Action */}
      {wager.status === 'open' && onAccept && (
        <Button
          onClick={() => onAccept(wager.id)}
          className="w-full"
        >
          Accept Wager
        </Button>
      )}
    </GlassCard>
  );
}
```

#### Step 3: Create Wagers Page
```typescript
// app/wagers/crypto/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { WagerCard } from '@/components/wagering/WagerCard';
import { supabase } from '@/lib/supabase/client';
import { CryptoWager } from '@/types/wagers';

export default function CryptoWagersPage() {
  const [wagers, setWagers] = useState<CryptoWager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWagers();
  }, []);

  async function fetchWagers() {
    const { data, error } = await supabase
      .from('crypto_wagers')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWagers(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="font-surgena text-4xl font-bold mb-8 text-gradient">
        Crypto Wagers
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wagers.map((wager) => (
          <WagerCard key={wager.id} wager={wager} />
        ))}
      </div>
      
      {wagers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No open wagers found
        </div>
      )}
    </div>
  );
}
```

---

### Week 2: Background Worker Integration

#### Step 1: Create API Route
```typescript
// app/api/wagers/create/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Forward to background worker
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/create-wager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create wager' },
      { status: 500 }
    );
  }
}
```

#### Step 2: Deploy Background Worker
```bash
# From WagerFi/backgroundWorker directory

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SOLANA_RPC_URL=your_helius_rpc_url
WAGERFI_PROGRAM_ID=4Soix4nNvj5HT3v9iaYa5XTENiWEaJdMFzQYGz279di9
AUTHORITY_PRIVATE_KEY=[your,private,key,array]
PORT=3001
EOF

# Run locally
npm run dev

# Deploy to Render.com
# 1. Push to GitHub
# 2. Connect Render.com to repo
# 3. Set environment variables in Render dashboard
# 4. Deploy
```

---

### Week 3: Real-time Features

#### Step 1: Create Realtime Hook
```typescript
// lib/hooks/useRealtimeWagers.ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CryptoWager } from '@/types/wagers';

export function useRealtimeWagers() {
  const [wagers, setWagers] = useState<CryptoWager[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchWagers();

    // Subscribe to changes
    const channel = supabase
      .channel('crypto_wagers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_wagers',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWagers((prev) => [payload.new as CryptoWager, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setWagers((prev) =>
              prev.map((w) =>
                w.id === payload.new.id ? (payload.new as CryptoWager) : w
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setWagers((prev) => prev.filter((w) => w.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchWagers() {
    const { data } = await supabase
      .from('crypto_wagers')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (data) {
      setWagers(data);
    }
  }

  return { wagers };
}
```

---

## 📝 Testing Checklist

### Unit Tests
- [ ] Supabase client connection
- [ ] Wallet connection (Privy)
- [ ] Wager creation logic
- [ ] Wager acceptance logic
- [ ] Resolution logic

### Integration Tests
- [ ] Create wager end-to-end
- [ ] Accept wager end-to-end
- [ ] Resolve wager end-to-end
- [ ] Real-time updates

### E2E Tests
- [ ] User signup flow
- [ ] Create crypto wager
- [ ] Accept crypto wager
- [ ] View wager details
- [ ] Check notifications

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All environment variables set
- [ ] Background worker deployed
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] Performance audit (Lighthouse > 90)

### Deployment
- [ ] Push to GitHub
- [ ] Connect Vercel
- [ ] Set environment variables
- [ ] Deploy preview
- [ ] Test preview
- [ ] Deploy production

### Post-deployment
- [ ] Verify all features work
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Set up monitoring (Sentry)
- [ ] Set up analytics

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Supabase Connection Fails
```typescript
// Check environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test connection
const { data, error } = await supabase.from('users').select('count');
console.log('Connection test:', { data, error });
```

#### 2. Privy Authentication Not Working
```typescript
// Verify Privy app ID
console.log('Privy App ID:', process.env.NEXT_PUBLIC_PRIVY_APP_ID);

// Check wallet detection
const { wallets } = useWallets();
console.log('Detected wallets:', wallets);
```

#### 3. Background Worker Timeout
```typescript
// Increase timeout in API route
export const maxDuration = 60; // 60 seconds

// Or use a queue system (Bull, BullMQ)
```

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Privy Docs](https://docs.privy.io/)
- [Supabase Docs](https://supabase.com/docs)
- [Solana Docs](https://docs.solana.com/)

### Tutorials
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Privy Quickstart](https://docs.privy.io/guide/quickstart)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### Community
- [WagerFi Discord](#)
- [Solana Discord](https://discord.gg/solana)
- [Next.js Discord](https://discord.gg/nextjs)

---

*Last Updated: 2025-01-24*

