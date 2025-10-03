'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Game } from '@/types/sports';

interface SportsWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onWagerCreated?: () => void;
}

export function SportsWagerModal({ isOpen, onClose, game, onWagerCreated }: SportsWagerModalProps) {
  const [wagerAmount, setWagerAmount] = useState<string>('0.1');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !game) return null;

  const handleCreateWager = async () => {
    if (!selectedTeam || !wagerAmount) return;

    setIsCreating(true);
    try {
      // TODO: Implement actual wager creation via API
      // Expiry is automatically set to game start time (no user input needed)
      console.log('Creating sports wager:', {
        game_id: game.id,
        team: selectedTeam,
        wager_amount: parseFloat(wagerAmount),
        // Expiry is game start time (calculated server-side)
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
                Create Sports Wager
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
              {/* Game Info */}
              <div className="p-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-500">
                    {typeof game.league === 'object' ? game.league.name : game.league}
                  </span>
                  <span className="text-gray-500">{game.date} {game.time}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-800">
                  <span>{game.homeTeam.name}</span>
                  <span className="text-gray-400">VS</span>
                  <span>{game.awayTeam.name}</span>
                </div>
              </div>

              {/* Team Selection - EXACTLY like WagerFi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Select Team
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedTeam('home')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTeam === 'home'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={{ fontFamily: 'Varien, sans-serif' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="w-8 h-8 object-contain" />}
                      <span className="text-sm font-medium text-gray-800 text-center">{game.homeTeam.name}</span>
                      <span className="text-xs text-gray-500">(Home)</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTeam('away')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTeam === 'away'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={{ fontFamily: 'Varien, sans-serif' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="w-8 h-8 object-contain" />}
                      <span className="text-sm font-medium text-gray-800 text-center">{game.awayTeam.name}</span>
                      <span className="text-xs text-gray-500">(Away)</span>
                    </div>
                  </button>
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
                <p className="text-xs text-gray-500 mt-2">
                  Wager expires when game starts
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateWager}
                disabled={!selectedTeam || !wagerAmount || isCreating}
                className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: selectedTeam && wagerAmount && !isCreating
                    ? 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)'
                    : '#cccccc',
                  fontFamily: 'Varien, sans-serif'
                }}
              >
                {isCreating ? 'Creating Wager...' : 'Create Wager'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SportsWagerModal;

