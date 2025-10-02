# 📊 Price Chart Integration - WagerFi Style

## ✅ Complete Integration

The crypto wagers on the `/trade` page now display **live price charts** with the **exact same setup as WagerFi**.

---

## 🎨 Implementation Details

### **Component: `WagerMarketCard.tsx`**

#### **1. Real-time Chart Data (Same as WagerFi)**
```typescript
// Fetches chart_data from Supabase crypto_wagers table
useEffect(() => {
  if (isCryptoWager(wager) && wager.id) {
    const fetchChartData = async () => {
      const { data } = await supabase
        .from('crypto_wagers')
        .select('chart_data, resolved_price')
        .eq('id', wager.id)
        .single();
      
      if (data?.chart_data && data.chart_data.length > 0) {
        setPriceHistory(data.chart_data);
        setCurrentPrice(data.chart_data[data.chart_data.length - 1].price);
      }
    };
    
    fetchChartData();
  }
}, [wager]);
```

#### **2. Live Subscription (Same as WagerFi)**
```typescript
// Subscribes to real-time updates on chart_data column
const channel = supabase
  .channel(`wager_market_${wager.id}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'crypto_wagers',
      filter: `id=eq.${wager.id}`,
    },
    (payload) => {
      if (payload.new.chart_data && Array.isArray(payload.new.chart_data)) {
        setPriceHistory(payload.new.chart_data);
        const lastPrice = payload.new.chart_data[payload.new.chart_data.length - 1];
        if (lastPrice) {
          setCurrentPrice(lastPrice.price);
        }
      }
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
```

#### **3. Chart Display**
```tsx
{/* Price Chart (same as WagerFi with live updates) */}
{currentPrice > 0 && priceHistory.length > 0 && (
  <div className="mb-3 h-20 rounded-lg overflow-hidden relative"
    style={{
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}
  >
    <div className="relative z-10 p-1 h-full">
      <MiniPriceChart
        currentPrice={currentPrice}
        targetPrice={wager.target_price}
        predictionType={wager.prediction_type}
        tokenSymbol={wager.token_symbol}
        priceHistory={priceHistory}
      />
    </div>
  </div>
)}
```

---

## 🔄 Data Flow (Same as WagerFi)

1. **Server.js Background Worker** → Updates `chart_data` column in Supabase
2. **Supabase Real-time** → Pushes updates to subscribed clients
3. **WagerMarketCard** → Receives updates, re-renders chart
4. **MiniPriceChart** → Draws canvas with live price data

---

## 📍 Chart Position

The price chart appears:
- **After** the wager title/question
- **Before** the outcome percentages (ABOVE/BELOW)
- **Height**: 80px (h-20)
- **Styling**: Dark background with subtle border

---

## 🎯 Features

✅ **Live updates** - Chart updates in real-time as prices change  
✅ **Historical data** - Shows full price history from `chart_data`  
✅ **Target price line** - Displays the prediction target  
✅ **Win/Loss colors** - Green for winning, red for losing  
✅ **Smooth animations** - Canvas-based rendering  
✅ **Auto-cleanup** - Unsubscribes when component unmounts  

---

## 🧪 Testing

To test live updates:
1. Create a crypto wager in WagerFi
2. Navigate to `/trade` in onyx.market
3. Click **₿ CRYPTO** tab
4. Watch the chart update as the background worker fetches new prices

---

## 📦 Dependencies

- **MiniPriceChart** - Canvas-based chart component
- **Supabase Client** - Real-time subscriptions
- **WagerFi Background Worker** - Populates `chart_data` column

---

**Status**: ✅ **Production Ready**  
**Last Updated**: October 2, 2025

