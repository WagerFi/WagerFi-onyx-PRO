'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Market } from '@/lib/polymarket/types';

interface MarketCardProps {
  market: Market;
  onClick: () => void;
  onTrade?: (outcome: string) => void;
  index: number;
}

export function MarketCard({ market, onClick, onTrade, index }: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isYesHovered, setIsYesHovered] = useState(false);
  const [isNoHovered, setIsNoHovered] = useState(false);

  // Extract volume data
  const volume24h = parseFloat(market.volume_24hr || market.volume24hr || '0');
  const totalVolume = parseFloat(market.volume || '0');
  const liquidity = parseFloat(market.liquidity || '0');
  
  // Format volume display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}k`;
    return `$${vol.toFixed(0)}`;
  };

  // Safely get outcomes and prices with fallbacks
  // Try multiple possible field names from Polymarket API
  const outcomes = Array.isArray(market.outcomes) 
    ? market.outcomes 
    : market.tokens?.map(t => t.outcome) || ['Yes', 'No'];
  
  // Try different price field names (API uses different formats)
  let prices: number[] = [0.5, 0.5];
  
  if (Array.isArray(market.outcome_prices) && market.outcome_prices.length > 0) {
    prices = market.outcome_prices.map(p => parseFloat(String(p)));
  } else if (Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0) {
    prices = market.outcomePrices.map(p => parseFloat(String(p)));
  } else if (market.tokens && Array.isArray(market.tokens) && market.tokens.length > 0) {
    prices = market.tokens.map(t => {
      const price = parseFloat(String(t.price || '0.5'));
      return isNaN(price) ? 0.5 : price;
    });
  }
  
  // Validate and normalize prices (Polymarket uses 0-1 range)
  prices = prices.map(p => {
    if (isNaN(p) || p < 0 || p > 1) return 0.5;
    return p;
  });

  // Log market data for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && index === 0) {
    console.log('📊 REAL Market Data from Polymarket:', {
      question: market.question?.slice(0, 80),
      outcomes,
      prices,
      volume24h,
      totalVolume,
      liquidity,
      endDate: market.end_date_iso,
      active: market.active,
      closed: market.closed,
    });
  }

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative p-4 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={(e) => {
          console.log('Card clicked!', market.question);
          onClick();
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(30, 30, 30, 0.98))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Faded grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Iridescent hover border */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            borderRadius: '12px',
            padding: '2px',
            background: `radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 12%, #ffbe0b 24%, #8338ec 36%, #3a86ff 48%, #06ffa5 60%, transparent 75%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10">
          {/* Category Badge */}
          {market.category && (
            <div className="mb-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                {market.category}
              </span>
            </div>
          )}

          {/* Question - Clickable area */}
          <h3 
            className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight cursor-pointer hover:text-gray-200" 
            style={{ fontFamily: 'Surgena, sans-serif' }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Title clicked!');
              onClick();
            }}
          >
            {market.question}
          </h3>

          {/* Outcomes with compact percentages */}
          <div className="grid grid-cols-2 gap-2 mb-3 pointer-events-none">
            {outcomes.slice(0, 2).map((outcome, idx) => {
              const price = prices[idx] || 0.5;
              const percentage = (price * 100).toFixed(1);
              
              return (
                <div key={`${market.condition_id}-${outcome}-${idx}`} 
                  className="relative p-2 rounded-lg"
                  style={{
                    background: idx === 0 
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.08), rgba(58, 134, 255, 0.08))'
                      : 'linear-gradient(135deg, rgba(255, 0, 110, 0.08), rgba(251, 86, 7, 0.08))',
                    border: `1px solid ${idx === 0 ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)'}`,
                  }}
                >
                  <div className="text-[9px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">
                    {outcome}
                  </div>
                  <div className="text-xl font-bold"
                    style={{
                      background: idx === 0 
                        ? 'linear-gradient(135deg, #06ffa5, #3a86ff)'
                        : 'linear-gradient(135deg, #ff006e, #fb5607)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Row - More Compact */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-800/50 pointer-events-none">
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Vol 24h</div>
              <div className="text-xs text-white font-bold font-mono">{formatVolume(volume24h)}</div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Total</div>
              <div className="text-xs text-white font-bold font-mono">{formatVolume(totalVolume)}</div>
            </div>
            {liquidity > 0 && (
              <div className="flex-1">
                <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Liq</div>
                <div className="text-xs text-emerald-400 font-bold font-mono">{formatVolume(liquidity)}</div>
              </div>
            )}
          </div>

          {/* YES/NO Action Buttons - Smaller */}
          <div className="grid grid-cols-2 gap-2 pointer-events-auto">
            {outcomes.slice(0, 2).map((outcome, idx) => {
              const isYes = idx === 0;
              const hovered = isYes ? isYesHovered : isNoHovered;
              const setHovered = isYes ? setIsYesHovered : setIsNoHovered;
              
              return (
                <motion.button
                  key={`btn-${outcome}-${idx}`}
                  className="relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Button clicked:', outcome);
                    onTrade?.(outcome);
                  }}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--btn-mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--btn-mouse-y', `${y}px`);
                  }}
                  style={{
                    background: isYes
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.15), rgba(58, 134, 255, 0.15))'
                      : 'linear-gradient(135deg, rgba(255, 0, 110, 0.15), rgba(251, 86, 7, 0.15))',
                    border: `1.5px solid ${isYes ? 'rgba(6, 255, 165, 0.3)' : 'rgba(255, 0, 110, 0.3)'}`,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Iridescent hover effect on button */}
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      inset: 0,
                      borderRadius: '8px',
                      background: isYes
                        ? `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(6, 255, 165, 0.3) 0%, transparent 50%)`
                        : `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(255, 0, 110, 0.3) 0%, transparent 50%)`,
                    }}
                    animate={{
                      opacity: hovered ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  
                  <span className="relative z-10"
                    style={{
                      background: isYes
                        ? 'linear-gradient(135deg, #06ffa5, #3a86ff)'
                        : 'linear-gradient(135deg, #ff006e, #fb5607)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {outcome.toUpperCase()}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

