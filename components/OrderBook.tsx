'use client';

import { motion } from 'framer-motion';
import type { OrderBookSummary } from '@/lib/polymarket/types';

interface OrderBookProps {
  orderBook: OrderBookSummary | null;
  loading: boolean;
}

export function OrderBook({ orderBook, loading }: OrderBookProps) {
  if (loading || !orderBook) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading order book...</div>
      </div>
    );
  }

  const bids = orderBook.bids.slice(0, 10);
  const asks = orderBook.asks.slice(0, 10);

  const maxBidSize = Math.max(...bids.map(b => parseFloat(b.size)));
  const maxAskSize = Math.max(...asks.map(a => parseFloat(a.size)));

  return (
    <div className="space-y-4">
      {/* Asks (Sell orders) */}
      <div>
        <div className="text-xs text-gray-500 mb-2 flex justify-between px-2">
          <span>Price</span>
          <span>Size</span>
        </div>
        <div className="space-y-1">
          {asks.reverse().map((ask, idx) => {
            const sizePercentage = (parseFloat(ask.size) / maxAskSize) * 100;
            
            return (
              <motion.div
                key={idx}
                className="relative flex justify-between items-center px-2 py-1 text-xs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                {/* Background bar */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #ff006e)',
                    width: `${sizePercentage}%`,
                  }}
                />
                
                <span className="relative z-10 text-red-400 font-mono">
                  ${parseFloat(ask.price).toFixed(3)}
                </span>
                <span className="relative z-10 text-gray-300 font-mono">
                  {parseFloat(ask.size).toFixed(2)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Spread */}
      <div className="py-2 px-2 bg-gray-800 rounded-lg">
        <div className="text-center">
          {bids.length > 0 && asks.length > 0 && (
            <>
              <div className="text-xs text-gray-500">Spread</div>
              <div className="text-sm text-white font-mono">
                ${(parseFloat(asks[asks.length - 1].price) - parseFloat(bids[0].price)).toFixed(4)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bids (Buy orders) */}
      <div>
        <div className="space-y-1">
          {bids.map((bid, idx) => {
            const sizePercentage = (parseFloat(bid.size) / maxBidSize) * 100;
            
            return (
              <motion.div
                key={idx}
                className="relative flex justify-between items-center px-2 py-1 text-xs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (asks.length + idx) * 0.02 }}
              >
                {/* Background bar */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #06ffa5)',
                    width: `${sizePercentage}%`,
                  }}
                />
                
                <span className="relative z-10 text-green-400 font-mono">
                  ${parseFloat(bid.price).toFixed(3)}
                </span>
                <span className="relative z-10 text-gray-300 font-mono">
                  {parseFloat(bid.size).toFixed(2)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

