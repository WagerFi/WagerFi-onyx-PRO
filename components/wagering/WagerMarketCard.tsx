'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { MiniPriceChart } from './MiniPriceChart';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

interface WagerMarketCardProps {
  wager: CryptoWager | SportsWager;
  index: number;
}

function isCryptoWager(wager: CryptoWager | SportsWager): wager is CryptoWager {
  return 'token_symbol' in wager;
}

function getTimeLeft(expiryTime: string): string {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff < 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return 'Soon';
}

function WagerMarketCardComponent({ wager, index }: WagerMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number; timestamp: number }>>([]);

  // Fetch chart data and subscribe to real-time updates (same as WagerFi)
  useEffect(() => {
    if (isCryptoWager(wager) && wager.id) {
      // Initial fetch
      const fetchChartData = async () => {
        const { data } = await supabase
          .from('crypto_wagers')
          .select('chart_data, resolved_price')
          .eq('id', wager.id)
          .single();
        
        if (data) {
          const result = data as { chart_data?: Array<{ price: number; timestamp: number }> | null; resolved_price?: number | null };
          const chartData = result.chart_data;
          
          if (chartData && chartData.length > 0) {
            setPriceHistory(chartData);
            setCurrentPrice(chartData[chartData.length - 1].price);
          } else if (result.resolved_price) {
            setCurrentPrice(result.resolved_price);
          }
        }
      };
      
      fetchChartData();
      
      // Subscribe to real-time updates (same as WagerFi)
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
            const newData = payload.new as { chart_data?: Array<{ price: number; timestamp: number }> | null; resolved_price?: number | null };
            if (newData.chart_data && Array.isArray(newData.chart_data)) {
              setPriceHistory(newData.chart_data);
              const lastPrice = newData.chart_data[newData.chart_data.length - 1];
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
    }
  }, [wager]);

  const handleClick = () => {
    // TODO: Navigate to dedicated wager detail page when built
    console.log('View wager details:', wager.id);
  };

  if (isCryptoWager(wager)) {
    const isWinning = (wager.prediction_type === 'above' && currentPrice > wager.target_price) ||
                      (wager.prediction_type === 'below' && currentPrice < wager.target_price);
    
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
          onClick={handleClick}
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
            <div className="mb-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                CRYPTO WAGER • {wager.token_symbol}
              </span>
            </div>

            {/* Question */}
            <h3 
              className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight" 
              style={{ fontFamily: 'Surgena, sans-serif' }}
            >
              {wager.token_symbol} {wager.prediction_type === 'above' ? 'above' : 'below'} ${wager.target_price.toLocaleString()}
            </h3>

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

            {/* Outcomes with percentages */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: wager.prediction_type === 'above' ? 'ABOVE' : 'BELOW', percentage: 50, isYes: true },
                { label: wager.prediction_type === 'above' ? 'BELOW' : 'ABOVE', percentage: 50, isYes: false }
              ].map((outcome, idx) => (
                <div key={idx} 
                  className="relative p-2 rounded-lg"
                  style={{
                    background: outcome.isYes 
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.08), rgba(58, 134, 255, 0.08))'
                      : 'linear-gradient(135deg, rgba(255, 0, 110, 0.08), rgba(251, 86, 7, 0.08))',
                    border: `1px solid ${outcome.isYes ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)'}`,
                  }}
                >
                  <div className="text-[9px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">
                    {outcome.label}
                  </div>
                  <div className="text-xl font-bold"
                    style={{
                      backgroundImage: outcome.isYes 
                        ? 'linear-gradient(135deg, #06ffa5, #3a86ff)'
                        : 'linear-gradient(135deg, #ff006e, #fb5607)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    {outcome.percentage}%
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-800/50">
              <div className="flex-1">
                <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Wager</div>
                <div className="text-xs text-white font-bold font-mono">{wager.amount} SOL</div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Target</div>
                <div className="text-xs text-white font-bold font-mono">${wager.target_price.toLocaleString()}</div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Expires</div>
                <div className="text-xs text-emerald-400 font-bold font-mono">{getTimeLeft(wager.expiry_time)}</div>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              className="w-full relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              style={{
                background: isWinning
                  ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.15), rgba(58, 134, 255, 0.15))'
                  : 'linear-gradient(135deg, rgba(255, 0, 110, 0.15), rgba(251, 86, 7, 0.15))',
                border: `1.5px solid ${isWinning ? 'rgba(6, 255, 165, 0.3)' : 'rgba(255, 0, 110, 0.3)'}`,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10"
                style={{
                  backgroundImage: isWinning
                    ? 'linear-gradient(135deg, #06ffa5, #3a86ff)'
                    : 'linear-gradient(135deg, #ff006e, #fb5607)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                VIEW WAGER
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Sports Wager
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
        onClick={handleClick}
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
          <div className="mb-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              {wager.sport} • {wager.league}
            </span>
          </div>

          {/* Question */}
          <h3 
            className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight" 
            style={{ fontFamily: 'Surgena, sans-serif' }}
          >
            {wager.team1} vs {wager.team2}
          </h3>

          {/* Prediction Display */}
          <div className="mb-3 p-2 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 255, 165, 0.12))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div className="text-[9px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">
              Prediction
            </div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {wager.prediction}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-800/50">
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Wager</div>
              <div className="text-xs text-white font-bold font-mono">{wager.amount} SOL</div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Game</div>
              <div className="text-xs text-white font-bold font-mono">
                {new Date(wager.game_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Expires</div>
              <div className="text-xs text-emerald-400 font-bold font-mono">{getTimeLeft(wager.expiry_time)}</div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            className="w-full relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(251, 86, 7, 0.15))',
              border: '1.5px solid rgba(139, 92, 246, 0.3)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10"
              style={{
                backgroundImage: 'linear-gradient(135deg, #8b5cf6, #fb5607)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VIEW WAGER
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render if wager data actually changes
export const WagerMarketCard = memo(WagerMarketCardComponent, (prevProps, nextProps) => {
  // If index changed, don't skip render
  if (prevProps.index !== nextProps.index) return false;
  
  // Compare wager ID
  if (prevProps.wager.id !== nextProps.wager.id) return false;
  
  // Compare status (most important field that changes)
  if (prevProps.wager.status !== nextProps.wager.status) return false;
  
  // For crypto wagers, compare resolution_price
  if (isCryptoWager(prevProps.wager) && isCryptoWager(nextProps.wager)) {
    if (prevProps.wager.resolution_price !== nextProps.wager.resolution_price) return false;
  }
  
  // If we got here, props are essentially the same - skip render
  return true;
});

