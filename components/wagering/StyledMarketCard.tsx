'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Market } from '@/lib/polymarket/types';

interface StyledMarketCardProps {
  market: Market;
  index: number;
  onClick?: () => void;
}

export function StyledMarketCard({ market, index, onClick }: StyledMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<{ index: number; side: 'yes' | 'no' } | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  // Get outcomes (these are strings like "Yes", "No" or candidate names)
  let rawOutcomes: string[] = [];
  if (Array.isArray(market.outcomes)) {
    rawOutcomes = market.outcomes;
  } else if (typeof market.outcomes === 'string') {
    try {
      rawOutcomes = JSON.parse(market.outcomes);
    } catch {
      rawOutcomes = ['Yes', 'No'];
    }
  } else if (market.tokens && Array.isArray(market.tokens)) {
    rawOutcomes = market.tokens.map(t => t.outcome);
  } else {
    rawOutcomes = ['Yes', 'No'];
  }
  
  // Get prices - try multiple field names from Polymarket API
  let rawPrices: number[] = [0.5, 0.5];
  
  if (Array.isArray(market.outcome_prices) && market.outcome_prices.length > 0) {
    rawPrices = market.outcome_prices.map(p => parseFloat(String(p)));
  } else if (Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0) {
    rawPrices = market.outcomePrices.map(p => parseFloat(String(p)));
  } else if (market.tokens && Array.isArray(market.tokens) && market.tokens.length > 0) {
    rawPrices = market.tokens.map(t => {
      const price = parseFloat(String(t.price || '0.5'));
      return isNaN(price) ? 0.5 : price;
    });
  }
  
  // Validate and normalize prices (Polymarket uses 0-1 range)
  rawPrices = rawPrices.map(p => {
    if (isNaN(p) || p < 0 || p > 1) return 0.5;
    return p;
  });

  // Create pairs of {outcome, price} and sort by price descending (highest first)
  const pairs = rawOutcomes.map((outcome, idx) => ({
    outcome,
    price: rawPrices[idx] || 0.5
  }));
  pairs.sort((a, b) => b.price - a.price);

  // Extract sorted outcomes and prices
  const outcomes = pairs.map(p => p.outcome);
  const prices = pairs.map(p => p.price);
  
  const hasMultipleOutcomes = outcomes.length > 1;
  
  const outcome1Price = prices[0] || 0.5;
  const outcome2Price = prices[1] || (1 - outcome1Price);
  
  const outcome1Percentage = (outcome1Price * 100).toFixed(2);
  const outcome2Percentage = (outcome2Price * 100).toFixed(2);

  // Get change in last 24h (if available) - from tokens array
  const priceChange24h = market.tokens?.[0]?.change_24h || 0;
  const isPositiveChange = priceChange24h > 0;

  // Get images - from tokens or market
  const outcome1Image = market.tokens?.[0]?.image || market.image;
  const outcome2Image = market.tokens?.[1]?.image;

  // Get volume - both total and 24hr
  const totalVolume = parseFloat(market.volume || '0');
  const volume24hr = parseFloat(market.volume24hr || market.volume_24hr || '0');
  const formattedVolume = totalVolume ? `$${(totalVolume / 1000000).toFixed(1)}M` : '$0';
  const formattedVolume24hr = volume24hr ? `$${(volume24hr / 1000000).toFixed(1)}M` : '$0';

  // Get dates
  const endDate = market.end_date_iso || market.game_start_time;
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }) : null;

  // Get liquidity
  const liquidity = parseFloat(market.liquidity || '0');
  const formattedLiquidity = liquidity ? `$${(liquidity / 1000000).toFixed(1)}M` : null;

  // Determine if this is a simple Yes/No market or multi-outcome
  const isYesNo = outcomes.length === 2 && 
    (outcomes[0]?.toLowerCase() === 'yes' || outcomes[0]?.toLowerCase() === 'no');
  const isMultiOutcome = outcomes.length > 2;

  // Log ALL market data for the first market to see everything Polymarket sends
  if (typeof window !== 'undefined' && index === 0) {
    console.log('📦 COMPLETE RAW MARKET DATA (first market):', {
      ...market,
      parsedOutcomes: outcomes,
      parsedPrices: prices,
      calculatedFields: {
        totalVolume: formattedVolume,
        volume24hr: formattedVolume24hr,
        liquidity: formattedLiquidity,
        endDate: formattedEndDate,
        isMultiOutcome,
        outcomeCount: outcomes.length
      }
    });
  }

  // Calculate potential payout
  const calculatePayout = (amount: number, probability: number) => {
    if (probability === 0 || probability === 1) return amount;
    return (amount / probability).toFixed(2);
  };

  // Handle bet amount changes
  const incrementAmount = (delta: number) => {
    setBetAmount(prev => Math.max(1, prev + delta));
  };

  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }}
    >
      {/* Iridescent hover border */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '-1px',
          left: '-1px',
          right: '-1px',
          bottom: '-1px',
          borderRadius: '12px',
          padding: '1.5px',
          background: `radial-gradient(180px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
        animate={{ opacity: isHovered ? 0.8 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div
        className="relative rounded-xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          minHeight: '200px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        {/* Background image - Fades out when trade panel is open */}
        {outcome1Image && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundImage: `url(${outcome1Image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: selectedOutcome !== null ? 0.05 : 0.8,
              zIndex: 1, // Behind everything
            }}
          />
        )}
        
        {/* Dark gradient overlay for text readability - Adjusted for better UI visibility */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background: selectedOutcome !== null 
              ? 'linear-gradient(180deg, rgba(20, 20, 25, 0.85) 0%, rgba(15, 15, 20, 0.90) 50%, rgba(10, 10, 15, 0.92) 100%)'
              : 'linear-gradient(180deg, rgba(10, 10, 15, 0.70) 0%, rgba(5, 5, 10, 0.80) 40%, rgba(0, 0, 0, 0.85) 100%)',
            zIndex: 2, // Above background image
          }}
        />
        
        {/* Glass pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            zIndex: 3, // Above gradient overlay
          }}
        />
        {/* HEADER: Icon + Title - Hidden when trade panel is open */}
        {selectedOutcome === null && (
          <div 
            className="p-3 flex items-start gap-2.5 cursor-pointer flex-shrink-0 relative z-10"
            onClick={onClick}
          >
          {/* Market Icon/Image */}
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm border border-white/5">
            {outcome1Image ? (
              <img
                src={outcome1Image}
                alt={market.question}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">
                {market.category === 'Politics' ? '🗳️' : 
                 market.category === 'Sports' ? '⚽' :
                 market.category === 'Crypto' ? '₿' : '📊'}
              </div>
            )}
          </div>

          {/* Title and Category */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">
              {market.category || 'Politics'}
            </div>
            <h3 className="text-xs font-medium text-white leading-tight" style={{ 
              height: '2.4em', // Exactly 2 lines height
              lineHeight: '1.2em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {market.question || market.title}
            </h3>
          </div>

          {/* 24h Change Indicator */}
            {priceChange24h !== 0 && (
              <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap flex-shrink-0 backdrop-blur-sm"
                style={{
                  background: isPositiveChange 
                  ? 'rgba(34, 197, 94, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isPositiveChange ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  color: isPositiveChange ? '#22c55e' : '#ef4444',
                }}
              >
                <span>{isPositiveChange ? '▲' : '▼'}</span>
              <span>{Math.abs(priceChange24h).toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}

        {/* MIDDLE: Scrollable Outcomes or Trade Panel */}
        <div className="overflow-hidden flex flex-col relative z-10">
          {selectedOutcome !== null ? (
            /* TRADE PANEL */
            <div className="flex flex-col py-2 px-4 space-y-1.5 relative z-10">
              {/* Selected Outcome Header - Single Line */}
              <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                {market.tokens?.[selectedOutcome.index]?.image && (
                  <img
                    src={market.tokens[selectedOutcome.index].image}
                    alt={outcomes[selectedOutcome.index]}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                )}
                <div className="flex-1 flex items-baseline gap-1.5">
                  <div className="text-sm font-bold text-white">
                    {outcomes[selectedOutcome.index]}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {((prices[selectedOutcome.index] || 0) * 100).toFixed(1)}% chance • {selectedOutcome.side === 'yes' ? 'Buy Yes' : 'Buy No'}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOutcome(null);
                    setBetAmount(10);
                  }}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Amount Input - Horizontal Layout */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 flex-shrink-0">Amount</span>
                <div className="text-2xl font-bold text-white flex-shrink-0">
                  ${betAmount}
                </div>
                <div className="flex gap-1.5 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      incrementAmount(1);
                    }}
                    className="px-2.5 py-1 rounded text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      incrementAmount(10);
                    }}
                    className="px-2.5 py-1 rounded text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    +10
                  </button>
                </div>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="1"
                max="100"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((betAmount - 1) / 99) * 100}%, rgba(255,255,255,0.1) ${((betAmount - 1) / 99) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />

              {/* Buy Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle trade execution
                  console.log('Execute trade:', {
                    outcome: outcomes[selectedOutcome.index],
                    side: selectedOutcome.side,
                    amount: betAmount,
                  });
                }}
                className="w-full py-2.5 rounded-lg font-bold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: selectedOutcome.side === 'yes' 
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: selectedOutcome.side === 'yes'
                    ? '0 4px 20px rgba(34, 197, 94, 0.4)'
                    : '0 4px 20px rgba(239, 68, 68, 0.4)',
                }}
              >
                <div className="text-base">
                  Buy {selectedOutcome.side === 'yes' ? 'Yes' : 'No'}
                </div>
                <div className="text-[10px] opacity-90">
                  To win ${calculatePayout(betAmount, prices[selectedOutcome.index] || 0.5)}
                </div>
              </button>
            </div>
          ) : (
            /* OUTCOMES LIST - Scrollable container */
            <div 
              className="overflow-y-auto outcomes-scroll px-3 relative z-10"
              style={{ 
                maxHeight: '120px', // Max height for scrolling if needed
                scrollbarGutter: 'stable'
              }}
            >
              {outcomes.map((outcome, idx) => {
                const percentage = ((prices[idx] || 0) * 100).toFixed(0);
                const outcomeImage = market.tokens?.[idx]?.image;
                
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-1 hover:bg-white/5 transition-all px-2 -mx-2 border-b border-white/5 last:border-0"
                    style={{ minHeight: '46px' }}
                  >
                    {/* Outcome Name */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    {outcomeImage && (
                      <img
                        src={outcomeImage}
                        alt={outcome}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/10"
                      />
                    )}
                      <span className="text-xs text-white font-medium truncate">
                        {outcome}
                      </span>
                      </div>

                    {/* Percentage */}
                    <div className="text-sm font-bold text-white whitespace-nowrap">
                      {percentage}%
                    </div>

                    {/* Yes/No Buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcome({ index: idx, side: 'yes' });
                        }}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.15))',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcome({ index: idx, side: 'no' });
                        }}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.15))',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
                  </div>
                )}
              </div>

        {/* BOTTOM: Volume & Actions */}
        <div className="flex-shrink-0 p-2.5 bg-black/20 backdrop-blur-md border-t border-white/5 flex items-center justify-between relative z-10">
          {/* Volume Info */}
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-gray-400">24h</span>
              <span className="text-white font-semibold">{formattedVolume24hr}</span>
                  </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-gray-400">Vol</span>
              <span className="text-white font-semibold">{formattedVolume}</span>
                  </div>
            {formattedLiquidity && (
              <div className="flex items-center gap-0.5">
                <span className="text-gray-400">Liq</span>
                <span className="text-white font-semibold">{formattedLiquidity}</span>
                  </div>
          )}
        </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="p-1 rounded backdrop-blur-sm hover:bg-white/10 transition-all"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
              title="Trade"
            >
              <svg className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle bookmark
              }}
              className="p-1 rounded backdrop-blur-sm hover:bg-white/10 transition-all"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
              title="Bookmark"
            >
              <svg className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
          </div>
          </div>

      <style jsx>{`
        /* Outcomes scrollbar styling */
        .outcomes-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .outcomes-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .outcomes-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .outcomes-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Custom Slider Styling */
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
        }

        .slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </motion.div>
  );
}

