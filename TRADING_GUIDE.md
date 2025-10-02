# Polymarket Trading Integration Guide

## Overview

This document explains how the trading system works in onyx.market, based on [Polymarket's CLOB API documentation](https://docs.polymarket.com/developers/CLOB/orders/orders).

## Architecture

### 1. **Client-Side Components**
- **TradePanel**: UI for placing single orders
- **BatchOrderPanel**: UI for placing multiple orders at once
- **OrderBook**: Displays live bid/ask spreads

### 2. **API Layer** (Server-Side)
- **`/api/trade/place-order`**: Places a single order
- **`/api/trade/place-orders-batch`**: Places multiple orders
- **`/api/trade/cancel-order`**: Cancels an order
- **`/api/trade/check-allowances`**: Checks USDC/token allowances

### 3. **CLOB Client** (`lib/polymarket/clob-client.ts`)
Handles order creation, signing, and submission to Polymarket's Central Limit Order Book.

## Trading Flow

### Step 1: Connect Wallet
```typescript
// User connects MetaMask
await connect();  // From useWallet hook
```

### Step 2: Check Allowances
Before trading, users must approve the Exchange contract to spend their USDC or conditional tokens.

```typescript
const allowances = await clobClient.checkAllowances(address);

if (!allowances.usdc.hasAllowance) {
    // User needs to approve USDC spending
    // Show approval UI
}
```

**Required Contracts:**
- **Exchange**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- **USDC (Polygon)**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

### Step 3: Create & Sign Order
```typescript
import { clobClient } from '@/lib/polymarket/clob-client';

// Set signer (from wallet connection)
await clobClient.setSigner(signer);

// Create and sign order
const signedOrder = await clobClient.createOrder({
    tokenID: '1234567890...', // Token ID from market
    price: 0.65,              // Price in decimal (0.65 = 65¢)
    size: 100,                // Size in USDC
    side: 'BUY',              // or 'SELL'
});
```

**Order Structure:**
```typescript
{
    salt: string;              // Random salt for uniqueness
    maker: string;             // Your wallet address
    signer: string;            // Same as maker (for EOA)
    taker: string;             // Zero address (anyone can take)
    tokenId: string;           // Token ID
    makerAmount: string;       // Amount you're offering (wei)
    takerAmount: string;       // Amount you want (wei)
    side: '0' | '1';          // 0 = BUY, 1 = SELL
    expiration: string;        // Unix timestamp
    nonce: string;             // Same as salt
    feeRateBps: string;        // Fee (0 for now)
    signatureType: 0;          // 0 = EOA, 1 = Proxy, 2 = Gnosis
    signature: string;         // EIP-712 signature
}
```

### Step 4: Submit Order
```typescript
const result = await clobClient.postOrder(signedOrder, 'GTC');

if (result.success) {
    console.log('Order ID:', result.orderID);
    console.log('Status:', result.status); // matched, live, delayed, unmatched
}
```

**Order Types:**
- **GTC** (Good Till Cancelled): Stays on book until filled or cancelled
- **FOK** (Fill or Kill): Execute immediately or cancel
- **GTD** (Good Till Date): Expires at specified time

### Step 5: Monitor Order
Orders can be in different states:
- **matched**: Immediately matched with existing order
- **live**: Resting on the order book
- **delayed**: Marketable but delayed due to market conditions
- **unmatched**: Marketable but couldn't be matched

## Batch Orders

Place multiple orders at once:

```typescript
const order1 = await clobClient.createOrder({ ... });
const order2 = await clobClient.createOrder({ ... });

const result = await clobClient.postOrders([order1, order2], 'GTC');

console.log(`${result.orderIDs.length} orders placed`);
if (result.errors) {
    console.log('Errors:', result.errors);
}
```

## Error Handling

Polymarket provides specific [error codes](https://docs.polymarket.com/developers/CLOB/orders/create-order#insert-error-messages):

| Error | Meaning |
|-------|---------|
| `INVALID_ORDER_MIN_TICK_SIZE` | Price doesn't meet tick size requirements |
| `INVALID_ORDER_MIN_SIZE` | Order size below minimum |
| `INVALID_ORDER_DUPLICATED` | Same order already placed |
| `INVALID_ORDER_NOT_ENOUGH_BALANCE` | Insufficient balance or allowance |
| `INVALID_ORDER_EXPIRATION` | Expiration time is in the past |
| `FOK_ORDER_NOT_FILLED_ERROR` | FOK order couldn't be fully filled |
| `MARKET_NOT_READY` | Market not accepting orders yet |

## Security

### API Authentication
- API keys are stored server-side only (never exposed to client)
- Derived from private key using `@polymarket/clob-client`
- Used in L2 headers for authenticated requests

### Private Key Management
1. Store in `.env.local`:
   ```
   POLYMARKET_PRIVATE_KEY=0x...
   ```
2. Never commit to git (`.gitignore` includes `.env.local`)
3. Use same key that was used to initialize Polymarket account

### Order Signing
- Orders are signed client-side using EIP-712
- User's MetaMask wallet signs the order
- Signature proves order authenticity

## Additional Resources

- [Polymarket Orders Overview](https://docs.polymarket.com/developers/CLOB/orders/orders)
- [Place Single Order](https://docs.polymarket.com/developers/CLOB/orders/create-order)
- [Batch Orders](https://docs.polymarket.com/developers/CLOB/orders/create-order-batch)
- [Conditional Token Framework](https://docs.polymarket.com/developers/CTF/overview)
- [Proxy Wallets](https://docs.polymarket.com/developers/proxy-wallet)

## Example: Complete Trading Flow

```typescript
import { useWallet } from '@/lib/hooks/useWallet';
import { clobClient } from '@/lib/polymarket/clob-client';

function TradingComponent() {
    const { connect, signer, address, isConnected } = useWallet();
    
    const placeTrade = async (tokenID: string, price: number, size: number) => {
        // 1. Ensure wallet is connected
        if (!isConnected) {
            await connect();
        }
        
        // 2. Set signer
        await clobClient.setSigner(signer);
        
        // 3. Check allowances
        const allowances = await clobClient.checkAllowances(address);
        if (!allowances.usdc.hasAllowance) {
            alert('Please approve USDC spending first');
            return;
        }
        
        // 4. Create and sign order
        const signedOrder = await clobClient.createOrder({
            tokenID,
            price,
            size,
            side: 'BUY',
        });
        
        // 5. Submit order
        const result = await clobClient.postOrder(signedOrder, 'GTC');
        
        if (result.success) {
            console.log('✅ Order placed!', result.orderID);
        } else {
            console.error('❌ Order failed:', result.errorMsg);
        }
    };
    
    return (
        <button onClick={() => placeTrade('token123', 0.65, 100)}>
            Place Trade
        </button>
    );
}
```

## Notes

- All prices are in decimal format (0.65 = 65¢)
- All amounts are in USDC (6 decimals)
- Orders are always limit orders (market orders are just marketable limit orders)
- Maximum order size = balance - sum of unfilled orders

