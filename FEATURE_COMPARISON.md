# Feature Comparison: WagerFi vs onyx.market

## 📋 Feature Matrix

| Feature Category | WagerFi (Source) | onyx.market (Current) | onyx.market (After Migration) |
|-----------------|------------------|----------------------|------------------------------|
| **Core Functionality** |
| Prediction Markets | ✅ Crypto + Sports | ✅ Polymarket | ✅ Crypto + Sports |
| Market Creation | ✅ User-created | ❌ External | ✅ User-created |
| P2P Wagering | ✅ Direct wagers | ❌ Order book | ✅ Direct wagers |
| On-chain Escrow | ✅ Solana | ❌ Polygon orders | ✅ Solana |
| **Blockchain** |
| Network | ✅ Solana | ✅ Polygon | ✅ Solana |
| Native Token | SOL | USDC | SOL |
| Smart Contracts | ✅ WagerFi Program | ❌ Polymarket CLOB | ✅ WagerFi Program |
| **Authentication** |
| Wallet Type | ✅ Privy (Solana) | ✅ MetaMask | ✅ Privy (Solana) |
| Supported Wallets | Phantom, Solflare, etc. | MetaMask, WalletConnect | Phantom, Solflare, etc. |
| Email Login | ❌ No | ❌ No | ❌ No |
| **User Features** |
| User Profiles | ✅ Full profiles | ❌ No profiles | ✅ Full profiles |
| User Stats | ✅ Win rate, streak, etc. | ❌ No stats | ✅ Win rate, streak, etc. |
| User Dashboard | ✅ Comprehensive | ❌ No dashboard | ✅ Comprehensive |
| Settings Page | ✅ Full settings | ❌ No settings | ✅ Full settings |
| **Wagering Types** |
| Crypto Wagers | ✅ Price predictions | ❌ No | ✅ Price predictions |
| Sports Wagers | ✅ NFL, NBA, MLB, NHL | ❌ No | ✅ NFL, NBA, MLB, NHL |
| Custom Wagers | ❌ No | ❌ No | 🔮 Future |
| **Social Features** |
| Global Chat | ✅ Real-time | ❌ No | ✅ Real-time |
| Direct Messages | ✅ 1-on-1 DMs | ❌ No | ✅ 1-on-1 DMs |
| Friends System | ✅ Add friends | ❌ No | ✅ Add friends |
| Friend Requests | ✅ Yes | ❌ No | ✅ Yes |
| **Notifications** |
| In-App Notifications | ✅ Real-time | ❌ No | ✅ Real-time |
| Notification Panel | ✅ Full panel | ❌ No | ✅ Full panel |
| Notification Preferences | ✅ Customizable | ❌ No | ✅ Customizable |
| Push Notifications | ❌ No | ❌ No | 🔮 Future |
| **Gamification** |
| Achievements | ✅ Milestone badges | ❌ No | ✅ Milestone badges |
| Leaderboard | ✅ Global rankings | ❌ No | ✅ Global rankings |
| Rewards System | ✅ Daily rewards | ❌ No | ✅ Daily rewards |
| Referral System | ✅ Earn from referrals | ❌ No | ✅ Earn from referrals |
| Streaks | ✅ Win streaks | ❌ No | ✅ Win streaks |
| **Data Visualization** |
| Price Charts | ✅ Live crypto prices | ❌ No | ✅ Live crypto prices |
| Order Book | ❌ No | ✅ Polymarket order book | ❌ No (not needed) |
| User Stats Charts | ✅ Performance charts | ❌ No | ✅ Performance charts |
| **Real-time Features** |
| Live Updates | ✅ Supabase Realtime | ✅ WebSocket | ✅ Supabase Realtime |
| Live Sports Scores | ✅ Yes | ❌ No | ✅ Yes |
| Live Price Updates | ✅ CoinGecko WS | ❌ No | ✅ CoinGecko WS |
| **UI/UX** |
| Design System | Basic Tailwind | ✅ Glassmorphism | ✅ Glassmorphism |
| Typography | Default fonts | ✅ Surgena + JetBrains | ✅ Surgena + JetBrains |
| Animations | Basic Framer Motion | ✅ Advanced animations | ✅ Advanced animations |
| Responsive Design | ✅ Mobile-friendly | ✅ Mobile-friendly | ✅ Mobile-friendly |
| Dark Mode | ✅ Yes | ✅ Yes (only) | ✅ Yes (only) |
| **Backend** |
| Database | ✅ Supabase | ❌ No database | ✅ Supabase |
| Background Worker | ✅ Node.js/Express | ❌ No worker | ✅ Node.js/Express |
| API Routes | ❌ No (Vite) | ✅ Next.js API | ✅ Next.js API |
| Edge Functions | ✅ Supabase | ❌ No | ✅ Supabase |
| **Integrations** |
| CoinGecko | ✅ Price data | ❌ No | ✅ Price data |
| Sports APIs | ✅ Live scores | ❌ No | ✅ Live scores |
| Twitter | ✅ Auto-tweets | ❌ No | ✅ Auto-tweets |
| Polymarket | ❌ No | ✅ Full integration | ❌ Remove |

---

## 🎯 Key Differences

### What onyx.market GAINS
1. **Full wagering platform** - Create custom wagers instead of just trading Polymarket markets
2. **User profiles & social** - Complete social features with chat, friends, DMs
3. **Achievements & rewards** - Gamification to increase engagement
4. **Referral system** - Viral growth mechanism
5. **Sports betting** - Expand beyond just crypto predictions
6. **Solana blockchain** - Lower fees, faster transactions
7. **P2P wagering** - Direct peer-to-peer bets instead of order book

### What onyx.market KEEPS
1. **Premium design system** - Glassmorphism, iridescent effects, beautiful UI
2. **Surgena font family** - Professional typography
3. **Next.js 14 framework** - Modern React framework with App Router
4. **Framer Motion** - Advanced animations
5. **Performance optimizations** - Fast loading, smooth interactions

### What onyx.market LOSES
1. **Polymarket integration** - Focus shifts from trading markets to creating wagers
2. **Order book** - No longer needed with P2P model
3. **Polygon network** - Switches to Solana
4. **MetaMask** - Replaced with Privy (Solana wallets)

---

## 📊 User Journey Comparison

### Current onyx.market User Journey
```
1. Visit landing page
2. Click "Connect Wallet"
3. Connect MetaMask (Polygon)
4. Browse Polymarket markets
5. View order book
6. Place order (buy YES/NO)
7. Wait for order to fill
8. View positions
```

### New onyx.market User Journey
```
1. Visit landing page
2. Click "Connect Wallet"
3. Connect Phantom/Solflare (Solana)
4. Create profile (username)
5. Browse wagers OR create new wager
6. Create wager:
   - Choose type (crypto/sports)
   - Set parameters (amount, prediction, etc.)
   - Confirm on-chain escrow
7. Accept wager (from another user)
8. Wait for resolution
9. Auto-payout on resolution
10. View updated stats & achievements
```

---

## 🎨 UI/UX Comparison

### Design Elements

| Element | WagerFi | onyx.market (Current) | onyx.market (New) |
|---------|---------|----------------------|-------------------|
| **Cards** | Basic rounded cards | Glassmorphism cards | ✅ Keep glassmorphism |
| **Buttons** | Gradient buttons | Iridescent hover | ✅ Keep iridescent |
| **Typography** | Default sans-serif | Surgena + JetBrains | ✅ Keep Surgena |
| **Colors** | Purple/blue palette | Purple/cyan palette | ✅ Keep purple/cyan |
| **Backgrounds** | Solid gradients | Grid patterns | ✅ Keep grid patterns |
| **Hover Effects** | Simple scale | Cursor-following glow | ✅ Keep cursor glow |
| **Transitions** | Basic | Smooth with easing | ✅ Keep smooth easing |

### Example: Wager Card Redesign

**Before (WagerFi style)**:
```tsx
<div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
  <h3 className="text-xl font-bold">BTC above $50,000</h3>
  <p className="text-gray-400">0.5 SOL</p>
</div>
```

**After (onyx.market style)**:
```tsx
<motion.div
  className="glass-box relative rounded-xl p-6 backdrop-blur-md"
  style={{
    background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
  }}
  whileHover={{ scale: 1.02 }}
  onMouseMove={handleMouseMove}
>
  <h3 className="font-surgena text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
    BTC above $50,000
  </h3>
  <p className="font-jetbrains text-gray-400 mt-2">0.5 SOL</p>
  
  {/* Iridescent border on hover */}
  <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
    <div className="absolute inset-0 bg-gradient-radial from-purple-500 via-cyan-500 to-transparent blur-md" />
  </div>
</motion.div>
```

---

## 💰 Business Model Comparison

### Current onyx.market (Polymarket Trading)
- **Revenue**: None (aggregator)
- **Value Prop**: Better UI for Polymarket
- **User Acquisition**: SEO, Polymarket users
- **Retention**: Limited (no accounts)

### New onyx.market (Wagering Platform)
- **Revenue**: 
  - 5% platform fee on all wagers
  - Premium features (future)
  - Sponsored wagers (future)
- **Value Prop**: 
  - Create custom wagers
  - Social wagering experience
  - Achievements & rewards
- **User Acquisition**: 
  - Referral system (viral)
  - Social sharing
  - Sports/crypto communities
  - Twitter integration
- **Retention**: 
  - User profiles & stats
  - Achievement hunting
  - Daily rewards
  - Friend system
  - Leaderboards

---

## 🔮 Future Roadmap

### Phase 1 (MVP) - Weeks 1-10
- [x] Core wagering (crypto + sports)
- [x] User profiles
- [x] Basic notifications
- [x] Glassmorphism UI

### Phase 2 (Social) - Weeks 11-15
- [ ] Global chat
- [ ] Direct messages
- [ ] Friends system
- [ ] Enhanced notifications

### Phase 3 (Gamification) - Weeks 16-20
- [ ] Achievement system
- [ ] Leaderboard
- [ ] Reward system
- [ ] Referral system

### Phase 4 (Advanced) - Weeks 21-25
- [ ] Advanced analytics
- [ ] Tournament mode
- [ ] Custom wager types
- [ ] NFT rewards

### Phase 5 (Scale) - Weeks 26+
- [ ] Mobile app
- [ ] Multi-chain support
- [ ] Institutional features
- [ ] White-label solution

---

## ✅ Success Metrics

### User Engagement
- **Current**: Average session: ~3 minutes
- **Target**: Average session: ~15 minutes
- **Improvement**: 5x increase

### User Retention
- **Current**: Day 7 retention: ~10%
- **Target**: Day 7 retention: ~40%
- **Improvement**: 4x increase

### Transaction Volume
- **Current**: Read-only (no transactions)
- **Target**: $1M+ monthly volume
- **Improvement**: Infinite (new revenue stream)

### User Growth
- **Current**: Organic SEO traffic
- **Target**: Viral referral growth
- **Improvement**: Exponential vs linear

---

*Last Updated: 2025-01-24*

