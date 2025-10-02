'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { clobClient } from '@/lib/polymarket/clob-client';
import type { Market, CreateOrderOptions } from '@/lib/polymarket/types';

interface BatchOrderPanelProps {
  markets: Market[];
  isConnected: boolean;
  onConnect: () => void;
}

interface BatchOrderItem extends CreateOrderOptions {
  id: string;
  marketQuestion: string;
  outcome: string;
}

export function BatchOrderPanel({ markets, isConnected, onConnect }: BatchOrderPanelProps) {
  const [orders, setOrders] = useState<BatchOrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addOrder = () => {
    if (markets.length === 0) {
      setError('No markets available');
      return;
    }

    const firstMarket = markets[0];
    const firstToken = firstMarket.tokens?.[0];

    if (!firstToken) {
      setError('No tokens available');
      return;
    }

    const newOrder: BatchOrderItem = {
      id: `order_${Date.now()}_${Math.random()}`,
      tokenID: firstToken.token_id,
      price: parseFloat(firstToken.price) || 0.5,
      size: 100,
      side: 'BUY',
      marketQuestion: firstMarket.question,
      outcome: firstToken.outcome,
    };

    setOrders([...orders, newOrder]);
    setError(null);
  };

  const removeOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const updateOrder = (id: string, updates: Partial<BatchOrderItem>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleSubmit = async () => {
    if (orders.length === 0) {
      setError('Add at least one order');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create and sign all orders
      const signedOrders = await Promise.all(
        orders.map(order =>
          clobClient.createOrder({
            tokenID: order.tokenID,
            price: order.price,
            size: order.size,
            side: order.side,
          })
        )
      );

      // Submit batch
      const result = await clobClient.postOrders(signedOrders);

      if (result.success) {
        setSuccess(`Successfully placed ${result.orderIDs.length} orders!`);
        setOrders([]);
      } else {
        setError('Failed to place batch orders');
      }
    } catch (err: any) {
      console.error('Error placing batch orders:', err);
      setError(err.message || 'Failed to place batch orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = orders.reduce((sum, order) => sum + (order.price * order.size), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Batch Orders</h3>
        <motion.button
          onClick={addOrder}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium"
        >
          + Add Order
        </motion.button>
      </div>

      {/* Orders List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-3 bg-gray-800 rounded-lg space-y-2"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Order #{index + 1}</span>
                <button
                  onClick={() => removeOrder(order.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Remove
                </button>
              </div>

              {/* Market Selection */}
              <select
                value={order.tokenID}
                onChange={(e) => {
                  const selectedToken = markets
                    .flatMap(m => m.tokens || [])
                    .find(t => t.token_id === e.target.value);
                  
                  if (selectedToken) {
                    const market = markets.find(m => 
                      m.tokens?.some(t => t.token_id === selectedToken.token_id)
                    );
                    
                    if (market) {
                      updateOrder(order.id, {
                        tokenID: selectedToken.token_id,
                        marketQuestion: market.question,
                        outcome: selectedToken.outcome,
                        price: parseFloat(selectedToken.price),
                      });
                    }
                  }
                }}
                className="w-full px-2 py-1.5 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {markets.map(market =>
                  market.tokens?.map(token => (
                    <option key={token.token_id} value={token.token_id}>
                      {market.question.slice(0, 50)}... - {token.outcome}
                    </option>
                  ))
                )}
              </select>

              {/* Side Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateOrder(order.id, { side: 'BUY' })}
                  className={`py-1.5 rounded text-xs font-medium ${
                    order.side === 'BUY'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => updateOrder(order.id, { side: 'SELL' })}
                  className={`py-1.5 rounded text-xs font-medium ${
                    order.side === 'SELL'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Price and Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Price</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={order.price}
                    onChange={(e) => updateOrder(order.id, { price: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Size</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={order.size}
                    onChange={(e) => updateOrder(order.id, { size: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Order Cost */}
              <div className="text-right text-xs text-gray-400">
                Cost: <span className="text-white font-mono">${(order.price * order.size).toFixed(2)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="py-8 text-center text-gray-500 text-sm">
          No orders added. Click "Add Order" to start building your batch.
        </div>
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <div className="p-3 bg-gray-800 rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Orders</span>
            <span className="text-white font-bold">{orders.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-white font-mono">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs"
        >
          {success}
        </motion.div>
      )}

      {/* Submit Button */}
      {isConnected ? (
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || orders.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
            isSubmitting || orders.length === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {isSubmitting ? 'Placing Orders...' : `Place ${orders.length} Orders`}
        </motion.button>
      ) : (
        <motion.button
          onClick={onConnect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.6 5.4L14.4 1.2C13.2 0.4 11.8 0.4 10.6 1.2L4.4 5.4C3.2 6.2 2.4 7.6 2.4 9.2V14.8C2.4 16.4 3.2 17.8 4.4 18.6L10.6 22.8C11.2 23.2 11.6 23.2 12.2 23.2C12.8 23.2 13.2 23.2 13.8 22.8L20 18.6C21.2 17.8 22 16.4 22 14.8V9.2C22 7.6 21.2 6.2 20.6 5.4Z" fill="white"/>
            <path d="M8.2 13.8L11 16.6L15.8 11.8" stroke="#3259D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Connect MetaMask
        </motion.button>
      )}
    </div>
  );
}

