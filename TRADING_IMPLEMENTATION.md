# 🎯 Polymarket Trading Implementation - Complete Guide

## 📋 Summary

We've successfully implemented a complete trading system for **onyx.market** that integrates with Polymarket's CLOB (Central Limit Order Book) API. Users can now:

✅ **View live markets** - 1049+ markets with real-time data  
✅ **Place single orders** - Buy/Sell with custom price and size  
✅ **Place batch orders** - Submit multiple orders at once  
✅ **Cancel orders** - Cancel single or multiple orders  
✅ **Check allowances** - View USDC balance and approval status  
✅ **Real-time order book** - WebSocket streaming of bids/asks  

## 🏗️ Architecture

### **Frontend (Client-Side)**
```
lib/hooks/
├── useWallet.ts          # MetaMask wallet connection
├── useMarkets.ts         # Market data fetching & caching
├── useOrderBook.ts       # Live order book via WebSocket
└── usePrices.ts          # Price data

components/
├── MarketCard.tsx        # Compact market display
├── OrderBook.tsx         # Live bids/asks display
├── TradePanel.tsx        # Single order placement UI
└── BatchOrderPanel.tsx   # Batch order placement UI

app/
├── page.tsx              # Landing page
├── trade/page.tsx        # Market grid view
└── market/[id]/page.tsx  # Detailed market page
```

### **Backend (API Routes)**
```
app/api/
├── trade/
│   ├── place-order/route.ts          # POST - Place single order
│   ├── place-orders-batch/route.ts   # POST - Place batch orders
│   ├── cancel-order/route.ts         # POST - Cancel order
│   └── check-allowances/route.ts     # GET  - Check USDC allowances
├── events/route.ts                    # Proxy for Gamma API
├── markets/[id]/route.ts              # Proxy for market data
└── orderbook/route.ts                 # Proxy for order book
```

### **Core Libraries**
```
lib/polymarket/
├── gamma-client.ts       # Gamma Markets API (market data)
├── clob-client.ts        # CLOB API (trading operations)
├── websocket-client.ts   # Real-time data streaming
├── api-keys.ts           # Server-side API key management
└── types.ts              # TypeScript interfaces
```

## 🔄 Complete Trading Flow

### **1. Wallet Connection**
```typescript
// User clicks "Connect MetaMask"
const { connect, signer, address, isConnected } = useWallet();

await connect();
// → MetaMask popup
// → User approves
// → Auto-switch to Polygon (Chain ID 137)
// → Signer is ready
```

### **2. Browse Markets**
```typescript
// Automatically loads on page load
const { markets, trending, profitable } = useMarkets();

// 1049 markets cached in memory
// Sorted by volume (trending) and spread (profitable)
// Updates every 30 seconds
```

### **3. View Market Details**
```typescript
// Click on market card → Navigate to /market/[conditionId]
const { market } = useMarket(conditionId);

// Instantly loads from cache
// Displays:
// - Question & outcomes
// - Current prices (YES/NO)
// - 24h volume, total volume, liquidity
// - Live order book
```

### **4. Check Allowances** (First-time only)
```typescript
const allowances = await clobClient.checkAllowances(address);

console.log(allowances);
// {
//   usdc: {
//     balance: "100.50",
//     allowance: "0",
//     hasAllowance: false
//   }
// }

// If hasAllowance = false, user needs to approve USDC spending
// This is done via MetaMask interaction with Exchange contract
```

### **5. Place Order**
```typescript
// 5a. Create and sign order
const signedOrder = await clobClient.createOrder({
    tokenID: '12345...',  // Token ID from market
    price: 0.65,          // 65¢
    size: 100,            // 100 shares
    side: 'BUY',         // or 'SELL'
});

// Order is signed using EIP-712 (MetaMask popup)
// Creates unique order with salt, expiration, etc.

// 5b. Submit order
const result = await clobClient.postOrder(signedOrder, 'GTC');

console.log(result);
// {
//   success: true,
//   orderID: "abc123...",
//   status: "matched",  // or "live", "delayed", "unmatched"
// }
```

### **6. Monitor Order**
```typescript
// Orders are tracked server-side by Polymarket
// Statuses:
// - "matched"   → Immediately filled
// - "live"      → Resting on order book
// - "delayed"   → Marketable but delayed
// - "unmatched" → Couldn't be matched

// Get active orders
const orders = await clobClient.getUserOrders(address);
```

### **7. Cancel Order** (Optional)
```typescript
const result = await clobClient.cancelOrder(orderID);

if (result.success) {
    console.log('Order canceled');
}
```

## 🔐 Security Implementation

### **API Key Management**
```
Server-Side Only (.env.local):
POLYMARKET_PRIVATE_KEY=0x...

lib/polymarket/api-keys.ts:
- Derives API credentials from private key
- Caches credentials in memory
- Never exposed to client
```

### **Authentication Flow**
```
1. User signs order client-side (MetaMask)
2. Signed order sent to /api/trade/place-order
3. Server adds L2 authentication headers:
   - POLY-API-KEY
   - POLY-PASSPHRASE
   - POLY-SIGNATURE
   - POLY-TIMESTAMP
   - POLY-NONCE
4. Server submits to Polymarket CLOB
5. Response returned to client
```

### **EIP-712 Signing**
```typescript
// Order is structured according to Polymarket's EIP-712 schema
const domain = {
    name: 'Polymarket CTF Exchange',
    version: '1',
    chainId: 137,
    verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
};

// User signs with MetaMask
const signature = await signer._signTypedData(domain, types, order);
```

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─ Connect Wallet → MetaMask
       │                   ↓
       │            ┌──────────────┐
       │            │   Polygon    │
       │            │  (Chain 137) │
       │            └──────────────┘
       │
       ├─ Fetch Markets → /api/events
       │                  ↓
       │           Polymarket Gamma API
       │                  ↓
       │          (1049 markets cached)
       │
       ├─ View Order Book → WebSocket
       │                    ↓
       │       wss://ws-subscriptions-clob.polymarket.com
       │                    ↓
       │           (Real-time bids/asks)
       │
       └─ Place Order → /api/trade/place-order
                       ↓
              ┌────────────────┐
              │  Next.js API   │
              │  (Server-Side) │
              └───────┬────────┘
                      │
                      ├─ Add API Keys
                      ├─ Add L2 Headers
                      └─ Submit to CLOB
                         ↓
                Polymarket CLOB API
                         ↓
                  Order Matched/Live
```

## 🎨 UI Components

### **Market Card** (Compact Design)
- Glassmorphism background
- Faded grid pattern
- Large outcome percentages (YES/NO)
- Hover effects with iridescent border
- Click to navigate to detail page

### **Market Detail Page**
- Full market information
- Live order book (WebSocket)
- Trade panel (single orders)
- Real-time price updates

### **Trade Panel**
- BUY/SELL toggle
- Outcome selection
- Price input (0-1 range)
- Size input (shares)
- Allowance display
- Total cost calculator
- Error handling & validation

## 🐛 Error Handling

### **Polymarket Error Codes**
| Code | Meaning | User Action |
|------|---------|-------------|
| `INVALID_ORDER_NOT_ENOUGH_BALANCE` | Insufficient funds | Add more USDC |
| `INVALID_ORDER_MIN_SIZE` | Order too small | Increase size |
| `INVALID_ORDER_MIN_TICK_SIZE` | Price precision too high | Round price |
| `INVALID_ORDER_DUPLICATED` | Order already exists | Wait or modify |
| `FOK_ORDER_NOT_FILLED_ERROR` | FOK couldn't fill | Try GTC instead |
| `MARKET_NOT_READY` | Market not open yet | Wait |

### **Client-Side Validation**
```typescript
// Before submitting:
✓ Price must be 0 < price < 1
✓ Size must be > 0
✓ User must have sufficient balance
✓ USDC must be approved (for BUY orders)
✓ All fields must be filled
```

## 📚 Key Resources

### **Documentation Read**
✅ [Polymarket Orders Overview](https://docs.polymarket.com/developers/CLOB/orders/orders)  
✅ [Place Single Order](https://docs.polymarket.com/developers/CLOB/orders/create-order)  
✅ [Batch Orders](https://docs.polymarket.com/developers/CLOB/orders/create-order-batch)  
✅ [Cancel Orders](https://docs.polymarket.com/developers/CLOB/orders/cancel-orders)  
✅ [Trades Overview](https://docs.polymarket.com/developers/CLOB/trades/trades-overview)  
✅ [Conditional Token Framework](https://docs.polymarket.com/developers/CTF/overview)  
✅ [Proxy Wallets](https://docs.polymarket.com/developers/proxy-wallet)  

### **Files Created/Modified**
#### API Routes
- `app/api/trade/place-order/route.ts` ✅ NEW
- `app/api/trade/place-orders-batch/route.ts` ✅ NEW
- `app/api/trade/cancel-order/route.ts` ✅ NEW
- `app/api/trade/check-allowances/route.ts` ✅ NEW
- `app/api/events/route.ts` ✅ Modified
- `app/api/markets/[conditionId]/route.ts` ✅ Modified

#### Core Libraries
- `lib/polymarket/clob-client.ts` ✅ Enhanced
- `lib/polymarket/gamma-client.ts` ✅ Enhanced
- `lib/polymarket/websocket-client.ts` ✅ Enhanced
- `lib/polymarket/types.ts` ✅ Updated
- `lib/hooks/useWallet.ts` ✅ Fixed (ethers v5)
- `lib/hooks/useMarkets.ts` ✅ Optimized (caching)

#### Components
- `components/TradePanel.tsx` ✅ Enhanced (allowances, validation)
- `components/MarketCard.tsx` ✅ Redesigned (compact, glassmorphism)
- `app/market/[id]/page.tsx` ✅ NEW (detail view)

#### Documentation
- `TRADING_GUIDE.md` ✅ NEW
- `TRADING_IMPLEMENTATION.md` ✅ NEW (this file)
- `COMPACT_CARD_DESIGN.md` ✅ Existing
- `MARKET_FETCHING_IMPROVEMENTS.md` ✅ Existing

## ✅ Production Readiness Checklist

- [x] **MetaMask Integration** - Explicit MetaMask detection, no Phantom
- [x] **Network Management** - Auto-switch to Polygon without reload
- [x] **Real Market Data** - 1049+ live markets from Polymarket
- [x] **Order Book** - WebSocket streaming with fallback polling
- [x] **Order Signing** - EIP-712 signing via MetaMask
- [x] **API Authentication** - Secure server-side L2 headers
- [x] **Error Handling** - Comprehensive error messages
- [x] **Allowance Checking** - USDC balance & approval status
- [x] **Input Validation** - Price/size validation client-side
- [x] **Batch Orders** - Multiple orders in single transaction
- [x] **Order Cancellation** - Single & batch cancellation
- [x] **Loading States** - Proper UX during async operations
- [x] **Type Safety** - Full TypeScript coverage
- [x] **Documentation** - Complete implementation guide

## 🚀 Next Steps

**To enable trading, users need to:**
1. Connect MetaMask wallet
2. Ensure they're on Polygon network (auto-switched)
3. Have USDC in their wallet
4. Approve USDC spending for Exchange contract (first time only)
5. Place orders via Trade Panel

**Development server is running on:**
- http://localhost:3001

**Try it out:**
1. Navigate to http://localhost:3001/trade
2. Click "Connect MetaMask"
3. Browse markets
4. Click on a market card
5. Use the Trade Panel to place an order!

---

**Built with:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- ethers.js v5
- @polymarket/clob-client
- Polymarket CLOB API v2

