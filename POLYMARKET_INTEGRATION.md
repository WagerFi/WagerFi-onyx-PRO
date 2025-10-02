# Polymarket Integration - onyx.market

A production-ready integration with Polymarket's CLOB (Central Limit Order Book) API, enabling users to discover trending prediction markets and execute trades directly through onyx.market.

## Features

### ✅ Implemented

- **Real-time Market Data**: Live market updates via WebSocket connections
- **Trending Markets**: Discover the hottest prediction markets by 24h volume
- **Profitable Opportunities**: Find markets with high price spreads and volume
- **Order Book Visualization**: Real-time bid/ask depth with visual indicators
- **Single Order Placement**: Place individual buy/sell orders
- **Batch Order Execution**: Execute multiple orders atomically
- **Wallet Integration**: MetaMask/WalletConnect support with Polygon network
- **Order Signing**: EIP-712 compliant order signing
- **Responsive UI**: Beautiful, modern interface with glassmorphism design

## Architecture

### API Clients

#### Gamma Client (`lib/polymarket/gamma-client.ts`)
Handles market data retrieval from Polymarket's Gamma API:
- Fetch all active markets
- Get market details by condition ID
- Calculate trending markets based on 24hr volume
- Calculate profitable markets based on price spreads
- Search markets by keywords
- Get price history and recent trades

#### CLOB Client (`lib/polymarket/clob-client.ts`)
Manages order book operations and trade execution:
- Fetch real-time order books
- Create and sign orders using EIP-712
- Submit single orders
- Submit batch orders
- Cancel orders
- Get user orders
- Calculate market prices from order book

#### WebSocket Client (`lib/polymarket/websocket-client.ts`)
Provides real-time market updates:
- Subscribe to market updates
- Subscribe to order book changes
- Subscribe to last trade prices
- Automatic reconnection with exponential backoff
- Event-driven architecture

### React Hooks

#### `useWallet`
Manages wallet connection and authentication:
- Connect to MetaMask
- Switch to Polygon network
- Sign orders and transactions
- Handle account changes

#### `useMarkets`
Fetches and manages market data:
- Load all active markets
- Get trending markets
- Get profitable markets
- Auto-refresh every 30 seconds

#### `useOrderBook`
Manages order book data with real-time updates:
- Fetch order book for a token
- Subscribe to WebSocket updates
- Fallback polling if WebSocket fails
- Auto-refresh every 5 seconds

### Components

#### `MarketCard`
Displays market information in a card format:
- Market question
- Outcome probabilities with progress bars
- 24h volume
- Category tags
- Iridescent hover effects

#### `OrderBook`
Visualizes the order book:
- Top 10 bids and asks
- Size-weighted background bars
- Spread indicator
- Color-coded buy/sell sides

#### `TradePanel`
Single order placement interface:
- Buy/Sell toggle
- Outcome selection
- Price and size inputs
- Cost and profit calculation
- Order submission with wallet signing

#### `BatchOrderPanel`
Multiple order placement interface:
- Add/remove orders dynamically
- Per-order configuration
- Total cost calculation
- Atomic batch submission

## Usage

### Starting the Development Server

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000/trade` to access the trading interface.

### Connecting Your Wallet

1. Click "Connect Wallet" in the top right
2. Approve the connection in MetaMask
3. The app will automatically switch to Polygon network
4. Your address will be displayed once connected

### Viewing Markets

The left sidebar displays markets in three views:
- **🔥 Trending**: Markets with highest 24h volume relative to total
- **💰 Profitable**: Markets with best price spreads and volume
- **📊 All**: Complete list of active markets

### Placing a Single Order

1. Select a market from the left sidebar
2. Choose Buy or Sell
3. Select an outcome
4. Enter price (0-1 range)
5. Enter size (number of shares)
6. Review cost and potential profit
7. Click "Place BUY/SELL Order"
8. Sign the transaction in MetaMask

### Placing Batch Orders

1. Switch to "Batch Orders" tab
2. Click "+ Add Order" for each order
3. Configure each order:
   - Select market and outcome
   - Choose Buy or Sell
   - Set price and size
4. Review total cost
5. Click "Place N Orders"
6. Sign all transactions in MetaMask

## API Endpoints

### Gamma API (Market Data)
- Base URL: `https://gamma-api.polymarket.com`
- **GET /markets** - List all markets
- **GET /markets/:conditionId** - Get market details
- **GET /trades** - Get recent trades
- **GET /prices** - Get price history

### CLOB API (Trading)
- Base URL: `https://clob.polymarket.com`
- **GET /book** - Get order book
- **GET /orders** - Get user orders
- **POST /order** - Submit single order
- **POST /orders** - Submit batch orders
- **DELETE /order/:id** - Cancel order
- **DELETE /orders** - Cancel multiple orders

### WebSocket API (Real-time)
- URL: `wss://ws-subscriptions-clob.polymarket.com/ws`
- **Subscribe to market**: Real-time market updates
- **Subscribe to book**: Order book changes
- **Subscribe to last_trade_price**: Latest trade prices

## Order Signing (EIP-712)

Orders are signed using EIP-712 typed data signing:

```typescript
const domain = {
  name: 'Polymarket CTF Exchange',
  version: '1',
  chainId: 137, // Polygon
  verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
};

const types = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'signer', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'side', type: 'uint8' },
    { name: 'signatureType', type: 'uint8' },
  ],
};
```

## Security Considerations

- **No Private Keys Stored**: All signing happens in the user's wallet
- **Order Expiration**: Orders expire after 24 hours by default
- **Network Validation**: Automatically checks for Polygon network
- **Input Validation**: All inputs are validated before submission
- **Error Handling**: Comprehensive error handling with user feedback

## Performance Optimizations

- **Parallel API Calls**: Markets, trending, and profitable data fetched simultaneously
- **WebSocket Fallback**: Automatic polling if WebSocket connection fails
- **Debounced Updates**: Market data refreshed at optimal intervals
- **Lazy Loading**: Components render progressively with animations
- **Memoization**: React hooks prevent unnecessary re-renders

## Future Enhancements

- [ ] Portfolio tracking and P&L calculation
- [ ] Advanced charting with TradingView integration
- [ ] Limit order management (view and cancel)
- [ ] Historical trade analysis
- [ ] Market alerts and notifications
- [ ] Social features (share trades)
- [ ] Mobile app version
- [ ] Multi-market comparison
- [ ] API key authentication for advanced features

## Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed and unlocked
- Check that you're on the Polygon network
- Clear browser cache and try again

### Order Placement Fails
- Verify you have sufficient USDC balance
- Check gas balance (MATIC) for transactions
- Ensure price is within 0-1 range
- Verify market is still accepting orders

### WebSocket Disconnections
- The client automatically reconnects with exponential backoff
- Fallback polling ensures data is still updated
- Check your internet connection

### API Rate Limiting
- Gamma API has rate limits on public endpoints
- WebSocket is preferred for real-time data
- Consider implementing caching for production

## Contributing

This is a production-ready implementation. When adding features:
1. Follow existing code patterns
2. Add comprehensive error handling
3. Update types in `lib/polymarket/types.ts`
4. Test with real wallet and orders
5. Update this documentation

## Resources

- [Polymarket API Documentation](https://docs.polymarket.com)
- [Polymarket CLOB API](https://docs.polymarket.com/api/clob)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [ethers.js Documentation](https://docs.ethers.org/v6/)

---

Built with ❤️ for onyx.market

