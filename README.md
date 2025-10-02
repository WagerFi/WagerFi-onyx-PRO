# onyx.market PRO

A premium trading hub for Polymarket prediction markets with real-time data, advanced order execution, and beautiful UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Polygon](https://img.shields.io/badge/Polygon-Network-purple)

## Features

🔥 **Trending Markets** - Discover the hottest prediction markets by 24h volume  
💰 **Profitable Opportunities** - Find markets with best price spreads and liquidity  
📊 **Real-time Order Books** - Live bid/ask depth with WebSocket updates  
⚡ **Single & Batch Orders** - Place one or multiple orders atomically  
🎨 **Beautiful UI** - Modern glassmorphism design with iridescent effects  
🔐 **Secure Trading** - EIP-712 order signing with MetaMask integration  
📱 **Responsive** - Optimized for desktop, tablet, and mobile  
🚀 **Production Ready** - Full Polymarket API integration with CORS proxy

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit:
- [http://localhost:3000](http://localhost:3000) - Landing page
- [http://localhost:3000/trade](http://localhost:3000/trade) - Trading interface

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Framer Motion
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Web3**: ethers.js v6
- **APIs**: Polymarket CLOB & Gamma
- **Real-time**: WebSocket subscriptions

## Project Structure

```
onyx.market/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page with animation
│   ├── trade/page.tsx       # Trading interface
│   ├── api/                 # API routes (CORS proxy)
│   │   ├── markets/         # Market data endpoints
│   │   ├── trades/          # Trade history endpoints
│   │   └── orderbook/       # Order book endpoints
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles + fonts
├── lib/                      # Core logic
│   ├── polymarket/          # Polymarket integration
│   │   ├── types.ts         # TypeScript definitions
│   │   ├── gamma-client.ts  # Market data API client
│   │   ├── clob-client.ts   # Trading API client
│   │   └── websocket-client.ts # Real-time updates
│   └── hooks/               # React hooks
│       ├── useWallet.ts     # Wallet connection
│       ├── useMarkets.ts    # Market data
│       └── useOrderBook.ts  # Order book data
├── components/              # React components
│   ├── MarketCard.tsx       # Market display card
│   ├── OrderBook.tsx        # Order book visualization
│   ├── TradePanel.tsx       # Single order placement
│   └── BatchOrderPanel.tsx  # Batch order placement
└── public/                  # Static assets
    └── fonts/               # Custom Surgena font
```

## How It Works

### CORS Proxy Architecture

The app uses Next.js API routes to proxy requests to Polymarket's APIs:

```
Browser → Next.js API Route → Polymarket API → Back to Browser
```

This avoids CORS restrictions that would block direct browser-to-API requests.

**API Routes:**
- `GET /api/markets` - Fetch all markets
- `GET /api/markets/[id]` - Fetch specific market
- `GET /api/trades` - Fetch trade history
- `GET /api/orderbook` - Fetch order book

### Polymarket Integration

See [POLYMARKET_INTEGRATION.md](./POLYMARKET_INTEGRATION.md) for detailed docs on:
- API clients and endpoints
- WebSocket subscriptions
- Order signing (EIP-712)
- Security considerations
- Troubleshooting guide

## Usage Guide

### 1. Connect Wallet
1. Click "Connect Wallet" in top right
2. Approve MetaMask connection
3. App switches to Polygon network automatically

### 2. Browse Markets
Choose from three views in the left sidebar:
- **🔥 Trending**: Highest 24h volume markets
- **💰 Profitable**: Best spread opportunities
- **📊 All**: Complete market list

### 3. Place Single Order
1. Select a market from the list
2. Choose Buy or Sell
3. Select outcome
4. Enter price (0-1) and size
5. Review cost/profit
6. Sign and submit

### 4. Place Batch Orders
1. Switch to "Batch Orders" tab
2. Click "+ Add Order" for each position
3. Configure each order
4. Review total cost
5. Submit all at once

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

No environment variables required for basic functionality.

Optional for production:
```env
NEXT_PUBLIC_INFURA_ID=your_infura_project_id
NEXT_PUBLIC_WALLETCONNECT_ID=your_walletconnect_project_id
```

## Design System

### Colors
- **Primary**: Blue (#3a86ff) → Cyan (#06ffa5)
- **Success**: Green (#06ffa5) → Emerald (#10b981)
- **Error**: Red/Pink (#ff006e → #fb5607)
- **Background**: Off-white (#f5f5f5)
- **Cards**: Dark glass (rgba(30, 30, 30, 0.95))

### Typography
- **Display**: Surgena (custom font)
- **Monospace**: JetBrains Mono
- **Body**: System font stack

### Components
- Glassmorphism cards with backdrop blur
- Iridescent hover effects on interactive elements
- Smooth page transitions with Framer Motion
- Responsive grid layouts with Tailwind

## Security

✅ No private keys stored  
✅ All signing happens in user's wallet  
✅ Order validation before submission  
✅ Network verification (Polygon only)  
✅ Input sanitization  
✅ Comprehensive error handling  

## Performance

⚡ Parallel API requests  
⚡ WebSocket with fallback polling  
⚡ Debounced updates  
⚡ Progressive component rendering  
⚡ Optimized re-renders with React.memo  
⚡ Image optimization  

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import on [Vercel](https://vercel.com)
3. Auto-deploys on push

### Other Platforms

Also works on:
- Netlify
- AWS Amplify
- Railway
- Docker

## Troubleshooting

### Wallet Won't Connect
- Install MetaMask extension
- Unlock your wallet
- Refresh the page

### Markets Not Loading
- Check browser console for errors
- Verify API routes are working: `/api/markets`
- Try clearing cache

### Orders Failing
- Ensure sufficient USDC balance
- Check MATIC balance for gas
- Verify price is 0-1 range
- Market must be accepting orders

## Contributing

This is a production-ready implementation. Follow existing patterns when adding features.

## License

MIT

## Resources

- [Polymarket Docs](https://docs.polymarket.com)
- [Next.js Docs](https://nextjs.org/docs)
- [ethers.js Docs](https://docs.ethers.org/v6/)
- [Framer Motion](https://www.framer.com/motion/)

---

Built with ❤️ for prediction markets
