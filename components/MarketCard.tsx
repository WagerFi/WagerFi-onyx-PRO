'use client';

import { motion } from 'framer-motion';
import { useState, memo } from 'react';
import type { Market } from '@/lib/polymarket/types';

interface MarketCardProps {
  market: Market;
  onClick: () => void;
  onTrade?: (outcome: string) => void;
  index: number;
}

function MarketCardComponent({ market, onClick, onTrade, index }: MarketCardProps) {
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
        className="relative p-3 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
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
            borderRadius: '8px',
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
            <div className="mb-1.5">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase"
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
            className="text-white font-medium text-xs mb-2 line-clamp-2 leading-tight cursor-pointer hover:text-gray-200" 
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
          <div className="grid grid-cols-2 gap-1.5 mb-2 pointer-events-none">
            {outcomes.slice(0, 2).map((outcome, idx) => {
              const price = prices[idx] || 0.5;
              const percentage = (price * 100).toFixed(1);
              const potentialWin = ((1 / price) * 100 - 100).toFixed(0); // Profit % on $1
              
              return (
                <div key={`${market.condition_id}-${outcome}-${idx}`} 
                  className="relative p-1.5 rounded-lg"
                  style={{
                    background: idx === 0 
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.08), rgba(58, 134, 255, 0.08))'
                      : 'linear-gradient(135deg, rgba(255, 0, 110, 0.08), rgba(251, 86, 7, 0.08))',
                    border: `1px solid ${idx === 0 ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)'}`,
                  }}
                >
                  <div className="text-[8px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">
                    {outcome}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold"
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
                    <div className="text-[9px] text-emerald-400 font-bold">
                      +{potentialWin}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Row - More Compact */}
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-800/50 pointer-events-none">
            <div className="flex-1">
              <div className="text-[8px] text-gray-500 mb-0.5 uppercase tracking-wide">Vol 24h</div>
              <div className="text-sm text-white font-bold font-mono">{formatVolume(volume24h)}</div>
            </div>
            <div className="flex-1">
              <div className="text-[8px] text-gray-500 mb-0.5 uppercase tracking-wide">Total</div>
              <div className="text-sm text-white font-bold font-mono">{formatVolume(totalVolume)}</div>
            </div>
            {liquidity > 0 && (
              <div className="flex-1">
                <div className="text-[8px] text-gray-500 mb-0.5 uppercase tracking-wide">Liq</div>
                <div className="text-sm text-emerald-400 font-bold font-mono">{formatVolume(liquidity)}</div>
              </div>
            )}
          </div>

          {/* YES/NO Action Buttons - Smaller */}
          <div className="grid grid-cols-2 gap-1.5 pointer-events-auto">
            {outcomes.slice(0, 2).map((outcome, idx) => {
              const isYes = idx === 0;
              const hovered = isYes ? isYesHovered : isNoHovered;
              const setHovered = isYes ? setIsYesHovered : setIsNoHovered;
              
              return (
                <motion.button
                  key={`btn-${outcome}-${idx}`}
                  className="relative py-1.5 px-2 rounded-md font-bold text-[10px] overflow-hidden z-10"
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
                      borderRadius: '6px',
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

// Memoize the component to prevent unnecessary re-renders
// Only re-render if relevant market data changes (prices, volume, etc.)
export const MarketCard = memo(MarketCardComponent, (prevProps, nextProps) => {
  // If index changed, don't skip render (for animations)
  if (prevProps.index !== nextProps.index) return false;
  
  // Compare market ID (if market changed completely)
  const prevId = prevProps.market.conditionId || prevProps.market.condition_id || prevProps.market.id;
  const nextId = nextProps.market.conditionId || nextProps.market.condition_id || nextProps.market.id;
  if (prevId !== nextId) return false;
  
  // Compare relevant data that would change the display
  const prevMarket = prevProps.market;
  const nextMarket = nextProps.market;
  
  // Check if prices changed
  const prevPrices = JSON.stringify(prevMarket.outcome_prices || prevMarket.outcomePrices || prevMarket.tokens?.map(t => t.price));
  const nextPrices = JSON.stringify(nextMarket.outcome_prices || nextMarket.outcomePrices || nextMarket.tokens?.map(t => t.price));
  if (prevPrices !== nextPrices) return false;
  
  // Check if volume changed significantly (more than 0.1% to avoid tiny fluctuations)
  const prevVolume = parseFloat(prevMarket.volume_24hr || prevMarket.volume24hr || '0');
  const nextVolume = parseFloat(nextMarket.volume_24hr || nextMarket.volume24hr || '0');
  if (Math.abs(prevVolume - nextVolume) / (prevVolume || 1) > 0.001) return false;
  
  // If we got here, props are essentially the same - skip render
  return true;
});

