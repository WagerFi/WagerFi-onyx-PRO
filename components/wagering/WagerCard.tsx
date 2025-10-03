'use client';

import { motion } from 'framer-motion';
import { MiniPriceChart } from './MiniPriceChart';
import { supabase } from '@/lib/supabase/client';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';
import { useState, useEffect } from 'react';

interface WagerCardProps {
  wager: CryptoWager | SportsWager;
  onAccept?: (wagerId: string) => void;
  onView?: (wagerId: string) => void;
  userWalletAddress?: string;
  index?: number;
}

function isCryptoWager(wager: CryptoWager | SportsWager): wager is CryptoWager {
  return 'token_symbol' in wager;
}

function getTimeLeft(expiryTime: string): string {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff < 0) return 'expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `in ${days}d`;
  if (hours > 0) return `in ${hours}h`;
  if (minutes > 0) return `in ${minutes}m`;
  return 'soon';
}

export function WagerCard({ wager, onAccept, onView, userWalletAddress, index = 0 }: WagerCardProps) {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAcceptHovered, setIsAcceptHovered] = useState(false);
  const [isViewHovered, setIsViewHovered] = useState(false);

  const timeLeft = getTimeLeft(wager.expiry_time);

  const isCreator = userWalletAddress && wager.creator_address === userWalletAddress;
  const canAccept = wager.status === 'open' && !isCreator && onAccept;

  // Fetch chart_data from wager (same as WagerFi)
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number; timestamp: number }>>([]);
  
  useEffect(() => {
    if (isCryptoWager(wager) && wager.id) {
      // Fetch chart_data from the wager (same as WagerFi does)
      const fetchChartData = async () => {
        const { data, error } = await supabase
          .from('crypto_wagers')
          .select('chart_data, resolved_price')
          .eq('id', wager.id)
          .single();
        
        if (!error && data) {
          // Parse chart_data with proper typing
          const result = data as { chart_data?: Array<{ price: number; timestamp: number }> | null; resolved_price?: number | null };
          const chartData = result.chart_data;
          
          if (chartData && Array.isArray(chartData) && chartData.length > 0) {
            setPriceHistory(chartData);
            // Use the last price from chart_data
            const lastPrice = chartData[chartData.length - 1];
            setCurrentPrice(lastPrice.price);
          } else if (result.resolved_price) {
            // If no chart_data but has resolved_price, use that
            setCurrentPrice(result.resolved_price);
          }
        }
      };
      
      fetchChartData();
      
      // Subscribe to real-time updates for this wager's chart_data
      const channel = supabase
        .channel(`wager_${wager.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'crypto_wagers',
            filter: `id=eq.${wager.id}`,
          },
          (payload) => {
            if (payload.new.chart_data && Array.isArray(payload.new.chart_data)) {
              setPriceHistory(payload.new.chart_data);
              const lastPrice = payload.new.chart_data[payload.new.chart_data.length - 1];
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

  if (isCryptoWager(wager)) {
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
          className="relative p-6 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => onView?.(wager.id)}
          style={{
            background: 'linear-gradient(135deg, rgba(250, 250, 250, 0.98), rgba(245, 245, 245, 0.98))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Faded grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
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
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                  wager.status === 'open' ? 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/30' :
                  wager.status === 'active' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' :
                  wager.status === 'resolved' ? 'bg-green-500/20 text-green-700 border border-green-500/30' :
                  'bg-gray-400/20 text-gray-700 border border-gray-400/30'
                }`} >
                  {wager.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-600 uppercase tracking-wide" >
                  {timeLeft}
                </p>
              </div>
            </div>

            {/* Header */}
            <h3 className="text-black font-medium text-sm mb-3 leading-tight" style={{ fontFamily: 'Varien, sans-serif' }}>
              {wager.token_symbol.toUpperCase()}
              <span className={wager.prediction_type === 'above' ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                {wager.prediction_type === 'above' ? ' ↑ ' : ' ↓ '}
              </span>
              ${wager.target_price.toLocaleString()}
            </h3>

            {/* Price Chart */}
            <div className="mb-3 h-20 rounded-lg overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 255, 165, 0.08))',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="relative z-10 p-2 h-full">
                {currentPrice > 0 && (
                  <MiniPriceChart
                    currentPrice={currentPrice}
                    targetPrice={wager.target_price}
                    predictionType={wager.prediction_type}
                    tokenSymbol={wager.token_symbol}
                    priceHistory={priceHistory}
                  />
                )}
              </div>
            </div>

            {/* Current vs Target Prices */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Current', value: currentPrice > 0 ? `$${currentPrice.toLocaleString()}` : '---', color: 'text-black' },
                { label: 'Target', value: `$${wager.target_price.toLocaleString()}`, color: 'text-purple-600' }
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg"
                  style={{
                    background: idx === 0 
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.08), rgba(58, 134, 255, 0.08))'
                      : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(251, 86, 7, 0.08))',
                    border: `1px solid ${idx === 0 ? 'rgba(6, 255, 165, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`,
                  }}
                >
                  <div className="text-[9px] text-gray-600 mb-0.5 font-medium uppercase tracking-wide"
>
                    {item.label}
                  </div>
                  <div className={`text-base font-bold ${item.color}`}
>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-300/50">
              <div className="flex-1">
                <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Amount</div>
                <div className="text-xs text-black font-bold" >
                  {wager.amount} SOL
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Win</div>
                <div className="text-xs text-green-600 font-bold" >
                  {(wager.amount * 1.95).toFixed(2)} SOL
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {canAccept && (
                <motion.button
                  className="relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(wager.id);
                  }}
                  onMouseEnter={() => setIsAcceptHovered(true)}
                  onMouseLeave={() => setIsAcceptHovered(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--btn-mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--btn-mouse-y', `${y}px`);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 255, 165, 0.15), rgba(58, 134, 255, 0.15))',
                    border: '1.5px solid rgba(6, 255, 165, 0.3)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      inset: 0,
                      borderRadius: '8px',
                      background: `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(6, 255, 165, 0.3) 0%, transparent 50%)`,
                    }}
                    animate={{ opacity: isAcceptHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <span className="relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #06ffa5, #3a86ff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ACCEPT
                  </span>
                </motion.button>
              )}
              {onView && (
                <motion.button
                  className={`relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden ${!canAccept ? 'col-span-2' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(wager.id);
                  }}
                  onMouseEnter={() => setIsViewHovered(true)}
                  onMouseLeave={() => setIsViewHovered(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--btn-mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--btn-mouse-y', `${y}px`);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(251, 86, 7, 0.15))',
                    border: '1.5px solid rgba(139, 92, 246, 0.3)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      inset: 0,
                      borderRadius: '8px',
                      background: `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
                    }}
                    animate={{ opacity: isViewHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <span className="relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #fb5607)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    VIEW
                  </span>
                </motion.button>
              )}
            </div>
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
        className="relative p-6 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={() => onView?.(wager.id)}
        style={{
          background: 'linear-gradient(135deg, rgba(250, 250, 250, 0.98), rgba(245, 245, 245, 0.98))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Faded grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
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
          {/* Status Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                wager.status === 'open' ? 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/30' :
                wager.status === 'active' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' :
                wager.status === 'live' ? 'bg-orange-500/20 text-orange-700 border border-orange-500/30' :
                wager.status === 'resolved' ? 'bg-green-500/20 text-green-700 border border-green-500/30' :
                'bg-gray-400/20 text-gray-700 border border-gray-400/30'
              }`} >
                {wager.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-purple-500/20 text-purple-700 border border-purple-500/30"
>
                {wager.sport} • {wager.league}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase tracking-wide" >
                {timeLeft}
              </p>
            </div>
          </div>

          {/* Header */}
          <h3 className="text-black font-medium text-sm mb-3 leading-tight" style={{ fontFamily: 'Varien, sans-serif' }}>
            {wager.team1} vs {wager.team2}
          </h3>

          <p className="text-xs text-gray-700 mb-3" >
            Prediction: <span className="text-black font-bold">{wager.prediction}</span>
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-300/50">
            <div className="flex-1">
              <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Amount</div>
              <div className="text-xs text-black font-bold" >
                {wager.amount} SOL
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Game</div>
              <div className="text-xs text-black font-bold" >
                {new Date(wager.game_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {canAccept && (
              <motion.button
                className="relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(wager.id);
                }}
                onMouseEnter={() => setIsAcceptHovered(true)}
                onMouseLeave={() => setIsAcceptHovered(false)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--btn-mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--btn-mouse-y', `${y}px`);
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 255, 165, 0.15), rgba(58, 134, 255, 0.15))',
                  border: '1.5px solid rgba(6, 255, 165, 0.3)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    inset: 0,
                    borderRadius: '8px',
                    background: `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(6, 255, 165, 0.3) 0%, transparent 50%)`,
                  }}
                  animate={{ opacity: isAcceptHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                <span className="relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #06ffa5, #3a86ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ACCEPT
                </span>
              </motion.button>
            )}
            {onView && (
              <motion.button
                className={`relative py-2 px-3 rounded-lg font-bold text-xs overflow-hidden ${!canAccept ? 'col-span-2' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(wager.id);
                }}
                onMouseEnter={() => setIsViewHovered(true)}
                onMouseLeave={() => setIsViewHovered(false)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--btn-mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--btn-mouse-y', `${y}px`);
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(251, 86, 7, 0.15))',
                  border: '1.5px solid rgba(139, 92, 246, 0.3)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    inset: 0,
                    borderRadius: '8px',
                    background: `radial-gradient(80px circle at var(--btn-mouse-x, 50%) var(--btn-mouse-y, 50%), rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
                  }}
                  animate={{ opacity: isViewHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                <span className="relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #fb5607)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  VIEW
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
