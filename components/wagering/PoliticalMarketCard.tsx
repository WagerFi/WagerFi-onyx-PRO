'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { PredictionAreaChart } from './PredictionAreaChart';

interface Candidate {
  name: string;
  party: string;
  percentage: number;
  imageUrl?: string;
}

interface PoliticalMarketCardProps {
  location: string;
  title: string;
  candidate1: Candidate;
  candidate2: Candidate;
  matchedAmount: string;
  change24h: string;
  endDate?: string;
  index?: number;
  onClick?: () => void;
}

interface ChartDataPoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
}

export function PoliticalMarketCard({
  location,
  title,
  candidate1,
  candidate2,
  matchedAmount,
  change24h,
  endDate,
  index = 0,
  onClick,
}: PoliticalMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Generate historical chart data
  useEffect(() => {
    const points = 60;
    const now = Date.now();
    const data: ChartDataPoint[] = [];
    
    let yesPrice = candidate1.percentage / 100;
    
    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * 24 * 60 * 60 * 1000;
      
      const change = (Math.random() - 0.5) * 0.05;
      yesPrice = Math.max(0.1, Math.min(0.9, yesPrice + change));
      
      data.push({
        timestamp,
        yesPrice,
        noPrice: 1 - yesPrice,
      });
    }
    
    data[data.length - 1].yesPrice = candidate1.percentage / 100;
    data[data.length - 1].noPrice = candidate2.percentage / 100;
    
    setChartData(data);
  }, [candidate1.percentage, candidate2.percentage]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${location} | ${title}`,
        text: `${candidate1.name}: ${candidate1.percentage.toFixed(2)}% vs ${candidate2.name}: ${candidate2.percentage.toFixed(2)}%`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1625 0%, #241d31 50%, #1a1625 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2), transparent 70%)',
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  {location}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-xs font-semibold text-gray-400">
                  {title}
                </span>
              </div>
              {endDate && (
                <div className="text-[10px] text-gray-600 mt-1">
                  Ends: {new Date(endDate).toLocaleDateString()}
                </div>
              )}
            </div>
            <motion.button
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
              }}
              whileHover={{ 
                scale: 1.05,
                background: 'rgba(139, 92, 246, 0.25)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5 text-purple-300" />
            </motion.button>
          </div>

          {/* Candidates */}
          <div className="flex items-center justify-between gap-3 mb-5">
            {/* Candidate 1 */}
            <div className="flex-1 text-center">
              <div className="relative mx-auto w-16 h-16 mb-2">
                {candidate1.imageUrl ? (
                  <>
                    <img
                      src={candidate1.imageUrl}
                      alt={candidate1.name}
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        border: '3px solid rgba(236, 72, 153, 0.6)',
                        boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                      }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-avatar');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div
                      className="fallback-avatar absolute inset-0 w-full h-full rounded-full hidden items-center justify-center text-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #ec4899, #db2777)',
                        border: '3px solid rgba(236, 72, 153, 0.6)',
                        boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                      }}
                    >
                      👤
                    </div>
                  </>
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899, #db2777)',
                      border: '3px solid rgba(236, 72, 153, 0.6)',
                      boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-white mb-0.5 truncate px-1">
                {candidate1.name}
              </div>
              <div className="text-2xl font-black text-pink-400 mb-0.5" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {candidate1.percentage.toFixed(2)}%
              </div>
              <div className="text-[10px] font-semibold text-pink-500/70 uppercase tracking-wider">
                {candidate1.party}
              </div>
            </div>

            {/* Candidate 2 */}
            <div className="flex-1 text-center">
              <div className="relative mx-auto w-16 h-16 mb-2">
                {candidate2.imageUrl ? (
                  <>
                    <img
                      src={candidate2.imageUrl}
                      alt={candidate2.name}
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        border: '3px solid rgba(6, 182, 212, 0.6)',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                      }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-avatar');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div
                      className="fallback-avatar absolute inset-0 w-full h-full rounded-full hidden items-center justify-center text-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        border: '3px solid rgba(6, 182, 212, 0.6)',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                      }}
                    >
                      👤
                    </div>
                  </>
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      border: '3px solid rgba(6, 182, 212, 0.6)',
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-white mb-0.5 truncate px-1">
                {candidate2.name}
              </div>
              <div className="text-2xl font-black text-cyan-400 mb-0.5" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {candidate2.percentage.toFixed(2)}%
              </div>
              <div className="text-[10px] font-semibold text-cyan-500/70 uppercase tracking-wider">
                {candidate2.party}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-4 rounded-lg overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            <PredictionAreaChart data={chartData} height={100} showLabels={true} />
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Matched</div>
                <div className="text-xs font-bold text-white">{matchedAmount}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">24h</div>
                <div className={`text-xs font-bold ${parseFloat(change24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(change24h) >= 0 ? '+' : ''}{change24h}%
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <span className="text-[9px] text-gray-500">{candidate1.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-[9px] text-gray-500">{candidate2.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

