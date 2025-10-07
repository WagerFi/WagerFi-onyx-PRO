'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { clobClient } from '@/lib/polymarket/clob-client';
import type { Market, Token } from '@/lib/polymarket/types';
import { useWallet } from '@/lib/hooks/useWallet';

interface TradePanelProps {
  market: Market | null;
  isConnected: boolean;
  onConnect: () => void;
}

export function TradePanel({ market, isConnected, onConnect }: TradePanelProps) {
  const { walletAddress } = useWallet();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [checkingAllowance, setCheckingAllowance] = useState(false);
  const [allowanceInfo, setAllowanceInfo] = useState<any>(null);

  // Check allowances when connected AND have wallet address
  useEffect(() => {
    if (isConnected && walletAddress) {
      checkAllowances();
    }
  }, [isConnected, walletAddress]);

  const checkAllowances = async () => {
    // Don't check if no wallet address
    if (!walletAddress) return;
    
    setCheckingAllowance(true);
    try {
      const info = await clobClient.checkAllowances();
      setAllowanceInfo(info);
      console.log('💰 Allowance info:', info);
    } catch (err: any) {
      // Silently fail if it's the expected "no address" error
      if (err?.message !== 'No address provided and no signer set') {
        console.error('Error checking allowances:', err);
      }
    } finally {
      setCheckingAllowance(false);
    }
  };

  const handleSubmit = async () => {
    if (!market || !selectedToken || !price || !size) {
      setError('Please fill all fields');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    const priceNum = parseFloat(price);
    const sizeNum = parseFloat(size);

    // Validation
    if (priceNum <= 0 || priceNum >= 1) {
      setError('Price must be between 0 and 1');
      return;
    }

    if (sizeNum <= 0) {
      setError('Size must be greater than 0');
      return;
    }

    // Check allowances for BUY orders
    if (side === 'BUY' && allowanceInfo) {
      const requiredAmount = priceNum * sizeNum;
      const balance = parseFloat(allowanceInfo.usdc.balance);
      
      if (balance < requiredAmount) {
        setError(`Insufficient balance. Need $${requiredAmount.toFixed(2)}, have $${balance.toFixed(2)}`);
        return;
      }

      if (!allowanceInfo.usdc.hasAllowance) {
        setError('Please approve USDC spending first. Check the allowance section.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📝 Creating order:', { 
        tokenID: selectedToken.token_id, 
        price: priceNum, 
        size: sizeNum, 
        side 
      });

      // Create and sign order
      const signedOrder = await clobClient.createOrder({
        tokenID: selectedToken.token_id,
        price: priceNum,
        size: sizeNum,
        side,
      });

      console.log('✍️ Order signed, submitting...');

      // Submit order
      const result = await clobClient.postOrder(signedOrder, 'GTC');

      if (result.success) {
        setSuccess(
          `✅ Order placed! ID: ${result.orderID?.substring(0, 8)}... Status: ${result.status || 'pending'}`
        );
        setPrice('');
        setSize('');
        
        // Refresh allowances
        setTimeout(() => checkAllowances(), 2000);
      } else {
        setError(result.errorMsg || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('❌ Error placing order:', err);
      
      // Parse error message
      let errorMessage = err.message || 'Failed to place order';
      
      if (errorMessage.includes('INVALID_ORDER_NOT_ENOUGH_BALANCE')) {
        errorMessage = 'Insufficient balance or allowance';
      } else if (errorMessage.includes('INVALID_ORDER_MIN_SIZE')) {
        errorMessage = 'Order size too small';
      } else if (errorMessage.includes('INVALID_ORDER_MIN_TICK_SIZE')) {
        errorMessage = 'Price precision too high';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!market) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Select a market to trade</p>
      </div>
    );
  }

  const tokens = market.tokens || [];
  const currentToken = selectedToken || tokens[0];

  return (
    <div className="space-y-4">
      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-lg font-medium text-sm transition-all ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`py-2 rounded-lg font-medium text-sm transition-all ${
            side === 'SELL'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Outcome Selection */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Outcome</label>
        <select
          value={currentToken?.token_id || ''}
          onChange={(e) => {
            const token = tokens.find(t => t.token_id === e.target.value);
            setSelectedToken(token || null);
          }}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tokens.map((token) => (
            <option key={token.token_id} value={token.token_id}>
              {token.outcome} - ${parseFloat(token.price).toFixed(3)}
            </option>
          ))}
        </select>
      </div>

      {/* Price Input */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Price (USD)</label>
        <input
          type="number"
          step="0.001"
          min="0"
          max="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.500"
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Size Input */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Size (Shares)</label>
        <input
          type="number"
          step="1"
          min="0"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="100"
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cost Summary */}
      {price && size && (
        <div className="p-3 bg-gray-800 rounded-lg space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-white font-mono">
              ${(parseFloat(price) * parseFloat(size)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Max Profit</span>
            <span className="text-green-400 font-mono">
              ${((1 - parseFloat(price)) * parseFloat(size)).toFixed(2)}
            </span>
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
          disabled={isSubmitting || !price || !size}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
            isSubmitting || !price || !size
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : side === 'BUY'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
          }`}
        >
          {isSubmitting ? 'Placing Order...' : `Place ${side} Order`}
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

