'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Token } from '../wagering/TopCryptoTokensPanel';
import globalWebSocketManager from '@/lib/hooks/useGlobalWebSocket';

interface CryptoWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  onWagerCreated?: () => void;
}

export function CryptoWagerModal({ isOpen, onClose, token, onWagerCreated }: CryptoWagerModalProps) {
  const [wagerAmount, setWagerAmount] = useState<string>('0.1');
  const [prediction, setPrediction] = useState<'above' | 'below' | null>(null);
  const [timeOption, setTimeOption] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceAnimation, setPriceAnimation] = useState<{isAnimating: boolean; isUp: boolean}>({ isAnimating: false, isUp: false });

  // Subscribe to real-time price updates via WebSocket
  useEffect(() => {
    if (!isOpen || !token) return;

    // Set initial price
    setCurrentPrice(token.quote.USD.price);

    // Subscribe to WebSocket for real-time updates
    const tokenId = token.coingecko_id || token.slug || String(token.id);
    const unsubscribe = globalWebSocketManager.subscribe(tokenId, (update) => {
      const oldPrice = currentPrice;
      const newPrice = update.price;
      
      // Animate price change
      if (oldPrice > 0 && newPrice !== oldPrice) {
        setPriceAnimation({
          isAnimating: true,
          isUp: newPrice > oldPrice
        });
        
        setTimeout(() => {
          setPriceAnimation({ isAnimating: false, isUp: false });
        }, 500);
      }
      
      setCurrentPrice(newPrice);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, token, currentPrice]);

  if (!isOpen || !token) return null;
  
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const handlePredictionSelect = (pred: 'above' | 'below') => {
    setPrediction(prediction === pred ? null : pred);
  };

  const handleTimeSelect = (time: string) => {
    setTimeOption(time);
  };

  const handleCreateWager = async () => {
    if (!prediction || !wagerAmount || !timeOption) return;

    setIsCreating(true);
    try {
      // TODO: Implement actual wager creation via API
      // Use the CURRENT LIVE PRICE as the target price
      console.log('Creating crypto wager:', {
        token_symbol: token.symbol,
        token_name: token.name,
        current_price: currentPrice, // This is the live price at creation time
        prediction,
        wager_amount: parseFloat(wagerAmount),
        time_option: timeOption
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onWagerCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create wager:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-[70] p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={onClose}
        >
          <motion.div 
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(250, 250, 250, 0.98), rgba(245, 245, 245, 0.98))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Varien, sans-serif' }}>
                Create Crypto Wager
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Token Info */}
              <div className="p-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center gap-3">
                  {token.logo && (
                    <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{token.symbol}</span>
                      <span className="text-sm text-gray-500">{token.name}</span>
                    </div>
                    <div className={`text-sm font-bold mt-0.5 transition-all duration-500 ${
                      priceAnimation.isAnimating
                        ? priceAnimation.isUp
                          ? 'text-green-600 scale-110'
                          : 'text-red-600 scale-110'
                        : 'text-gray-900'
                    }`}>
                      {formatPrice(currentPrice)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Live Price (Updates in real-time)</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    token.quote.USD.percent_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {token.quote.USD.percent_change_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(token.quote.USD.percent_change_24h).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Prediction Selection - EXACTLY like WagerFi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Price Prediction
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePredictionSelect('above')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      prediction === 'above'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={{ fontFamily: 'Varien, sans-serif' }}
                  >
                    <TrendingUp className={`w-5 h-5 ${prediction === 'above' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${prediction === 'above' ? 'text-green-700' : 'text-gray-700'}`}>
                      Above
                    </span>
                  </button>
                  <button
                    onClick={() => handlePredictionSelect('below')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      prediction === 'below'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={{ fontFamily: 'Varien, sans-serif' }}
                  >
                    <TrendingDown className={`w-5 h-5 ${prediction === 'below' ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${prediction === 'below' ? 'text-red-700' : 'text-gray-700'}`}>
                      Below
                    </span>
                  </button>
                </div>
              </div>

              {/* Time Options - EXACTLY like WagerFi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Timeframe
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '5M', value: '5m' },
                    { label: '15M', value: '15m' },
                    { label: '30M', value: '30m' },
                    { label: '1H', value: '1h' },
                    { label: '4H', value: '4h' },
                    { label: '8H', value: '8h' },
                    { label: '12H', value: '12h' },
                    { label: '24H', value: '24h' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeSelect(option.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeOption === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      style={{ fontFamily: 'Varien, sans-serif' }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wager Amount - EXACTLY like WagerFi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Wager Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">SOL</span>
                  <input
                    type="number"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    min="0.01"
                    className="w-full pl-14 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-800 font-medium"
                    style={{ fontFamily: 'Varien, sans-serif' }}
                  />
                </div>
                {wagerAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Potential Win: {(parseFloat(wagerAmount) * 2).toFixed(2)} SOL
                  </p>
                )}
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateWager}
                disabled={!prediction || !wagerAmount || !timeOption || isCreating}
                className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: prediction && wagerAmount && timeOption && !isCreating
                    ? 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)'
                    : '#cccccc',
                  fontFamily: 'Varien, sans-serif'
                }}
              >
                {isCreating ? 'Creating Wager...' : `Create Wager at ${formatPrice(currentPrice)}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CryptoWagerModal;

