'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { PredictionAreaChart } from './PredictionAreaChart';
import type { Market } from '@/lib/polymarket/types';

interface PredictionMarketCardProps {
  market: Market;
  index?: number;
  onClick?: () => void;
}

interface ChartDataPoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
}

export function PredictionMarketCard({ market, index = 0, onClick }: PredictionMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Parse outcomes and prices
  const outcomes = Array.isArray(market.outcomes) 
    ? market.outcomes 
    : typeof market.outcomes === 'string' 
      ? JSON.parse(market.outcomes) 
      : ['Yes', 'No'];
  
  const outcomePrices = market.outcomePrices || market.outcome_prices;
  const prices = Array.isArray(outcomePrices)
    ? outcomePrices
    : typeof outcomePrices === 'string'
      ? JSON.parse(outcomePrices)
      : ['0.5', '0.5'];

  const yesPercentage = parseFloat(prices[0]) * 100;
  const noPercentage = parseFloat(prices[1]) * 100;

  // Determine if this is a competitive market (vs style) or a Yes/No prediction
  const isCompetitive = outcomes.some((o: string) => 
    !o.toLowerCase().includes('yes') && 
    !o.toLowerCase().includes('no')
  ) && outcomes.length === 2;

  // Real volume data from Polymarket
  const volumeMatched = market.volume || market.volume_24hr || market.volume24hr || '0';
  const volumeNumber = parseFloat(volumeMatched);
  const formattedVolume = volumeNumber >= 1000000 
    ? `$${(volumeNumber / 1000000).toFixed(1)}M`
    : volumeNumber >= 1000
      ? `$${(volumeNumber / 1000).toFixed(0)}K`
      : `$${volumeNumber.toFixed(0)}`;

  // Calculate real 24h change from market data if available
  // If not available, don't show it (better than fake data)
  const volume24h = parseFloat(market.volume_24hr || market.volume24hr || '0');
  const totalVolume = parseFloat(market.volume || '0');
  const priceChange24h = volume24h > 0 && totalVolume > 0
    ? ((volume24h / totalVolume) * 100).toFixed(2)
    : null;

  // Chart data - only show if we have real historical data
  // For now, we'll show a simplified static view using current prices
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Create minimal chart data from current prices
    // This shows the current state without fake historical data
    const now = Date.now();
    const data: ChartDataPoint[] = [];
    
    // Create just 2 data points to show current state
    const currentYesPrice = yesPercentage / 100;
    const currentNoPrice = noPercentage / 100;
    
    data.push({
      timestamp: now - 24 * 60 * 60 * 1000,
      yesPrice: currentYesPrice,
      noPrice: currentNoPrice,
    });
    
    data.push({
      timestamp: now,
      yesPrice: currentYesPrice,
      noPrice: currentNoPrice,
    });
    
    setChartData(data);
  }, [yesPercentage, noPercentage]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: market.question,
        text: `${outcomes[0]}: ${yesPercentage.toFixed(2)}% vs ${outcomes[1]}: ${noPercentage.toFixed(2)}%`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  // Extract location/category from question (e.g., "USA | Texas Presidential Vote")
  const questionParts = market.question.split('|');
  const location = questionParts.length > 1 ? questionParts[0].trim() : market.category || 'USA';
  const eventTitle = questionParts.length > 1 ? questionParts[1].trim() : market.question;

  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }}
    >
      {/* Iridescent border */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '-1px',
          left: '-1px',
          right: '-1px',
          bottom: '-1px',
          borderRadius: '12px',
          padding: '2px',
          background: `radial-gradient(150px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />
      
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >

        <div className="relative p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wider">
                {location}
              </div>
              <h3 className="text-xs font-bold text-white leading-tight line-clamp-2">
                {eventTitle}
              </h3>
            </div>
            <motion.button
              className="p-1 rounded transition-colors ml-1.5 flex-shrink-0"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
            >
              <Share2 className="w-2.5 h-2.5 text-gray-400" />
            </motion.button>
          </div>

          {/* Candidates/Outcomes - Compact horizontal layout */}
          <div className="flex items-center justify-between mb-2">
            {/* Outcome 1 */}
            <div className="flex items-center gap-1.5 flex-1">
              <div className="relative w-7 h-7 flex-shrink-0">
                {market.image ? (
                  <>
                    <img
                      src={market.image}
                      alt={outcomes[0]}
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        border: '1.5px solid rgba(236, 72, 153, 0.5)',
                        boxShadow: '0 0 8px rgba(236, 72, 153, 0.3)',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-avatar');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div
                      className="fallback-avatar absolute inset-0 rounded-full hidden items-center justify-center text-xs"
                      style={{
                        background: 'linear-gradient(135deg, #ec4899, #db2777)',
                        border: '1.5px solid rgba(236, 72, 153, 0.5)',
                      }}
                    >
                      {outcomes[0].toLowerCase().includes('yes') ? '✓' : '👤'}
                    </div>
                  </>
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899, #db2777)',
                      border: '1.5px solid rgba(236, 72, 153, 0.5)',
                    }}
                  >
                    {outcomes[0].toLowerCase().includes('yes') ? '✓' : '👤'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-500 truncate">{outcomes[0]}</div>
                <div className="text-sm font-bold text-pink-400">{yesPercentage.toFixed(1)}%</div>
              </div>
            </div>

            {/* VS Divider */}
            {isCompetitive && (
              <div className="text-gray-600 font-bold text-[9px] px-1.5">VS</div>
            )}

            {/* Outcome 2 */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-[9px] text-gray-500 truncate">{outcomes[1]}</div>
                <div className="text-sm font-bold text-cyan-400">{noPercentage.toFixed(1)}%</div>
              </div>
              <div className="relative w-7 h-7 flex-shrink-0">
                {market.icon || market.image ? (
                  <>
                    <img
                      src={market.icon || market.image}
                      alt={outcomes[1]}
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        border: '1.5px solid rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-avatar');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div
                      className="fallback-avatar absolute inset-0 rounded-full hidden items-center justify-center text-xs"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        border: '1.5px solid rgba(6, 182, 212, 0.5)',
                      }}
                    >
                      {outcomes[1].toLowerCase().includes('no') ? '✗' : '👤'}
                    </div>
                  </>
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      border: '1.5px solid rgba(6, 182, 212, 0.5)',
                    }}
                  >
                    {outcomes[1].toLowerCase().includes('no') ? '✗' : '👤'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mini chart visualization */}
          {chartData.length > 0 && (
            <div className="mb-2 relative">
              <PredictionAreaChart data={chartData} height={40} showLabels={false} />
            </div>
          )}

          {/* Compact Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
            <div className="text-[9px] text-gray-500">
              Vol: <span className="text-white font-semibold">{formattedVolume}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                <span className="text-[9px] text-gray-500">{yesPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                <span className="text-[9px] text-gray-500">{noPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

