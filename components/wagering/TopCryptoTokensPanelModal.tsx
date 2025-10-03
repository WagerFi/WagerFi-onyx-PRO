'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopCryptoTokensPanel } from './TopCryptoTokensPanel';

interface Token {
  id: number | string;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
    };
  };
  coingecko_id?: string;
  slug?: string;
  logo?: string;
}

interface TopCryptoTokensPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWager?: (token: Token) => void;
  onWagerCreated?: () => void;
}

export function TopCryptoTokensPanelModal({
  isOpen,
  onClose,
  onCreateWager,
  onWagerCreated
}: TopCryptoTokensPanelModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-[60] p-2 sm:p-4"
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
            className="w-full max-w-[95vw] sm:max-w-md lg:max-w-lg rounded-xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(250, 250, 250, 0.98), rgba(245, 245, 245, 0.98))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800" style={{ fontFamily: 'Varien, sans-serif' }}>
                Create Crypto Wager
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-lg transition-colors text-gray-600 hover:text-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                style={{
                  background: 'rgba(0, 0, 0, 0.05)'
                }}
                whileHover={{ scale: 1.05, background: 'rgba(0, 0, 0, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Panel Content */}
            <div style={{ height: 'calc(90vh - 80px)' }}>
              <TopCryptoTokensPanel 
                onCreateWager={(token) => {
                  onCreateWager?.(token);
                  onClose();
                }}
                onWagerCreated={onWagerCreated}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TopCryptoTokensPanelModal;

