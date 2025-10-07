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

function getTimeLeft(expiryTime: string, wager?: CryptoWager | SportsWager): string {
  const now = new Date();
  
  // For sports wagers, use game_time instead of expiry_time for more accurate countdown
  let targetTime: Date;
  if (wager && !isCryptoWager(wager)) {
    // Sports wager - use game_time
    targetTime = new Date(wager.game_time);
  } else {
    // Crypto wager - use expiry_time
    targetTime = new Date(expiryTime);
  }
  
  const diff = targetTime.getTime() - now.getTime();
  
  if (diff < 0) {
    // For sports, show "live" if game has started, otherwise "ended"
    if (wager && !isCryptoWager(wager)) {
      return wager.status === 'live' ? 'live' : 'ended';
    }
    return 'expired';
  }
  
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

  const timeLeft = getTimeLeft(wager.expiry_time, wager);

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
        className="relative cursor-pointer"
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
          className="relative p-6 rounded-xl overflow-hidden cursor-pointer flex flex-col"
          onClick={() => onView?.(wager.id)}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            minHeight: '200px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          }}
        >
          {/* Dark gradient overlay for text readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.70) 0%, rgba(5, 5, 10, 0.80) 40%, rgba(0, 0, 0, 0.85) 100%)',
              zIndex: 2,
            }}
          />
          
          {/* Token Background Image for Crypto Wagers */}
          {isCryptoWager(wager) && wager.metadata && typeof wager.metadata === 'object' && 'token_snapshot' in wager.metadata && (wager.metadata as any).token_snapshot?.logo && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                backgroundImage: `url(${(wager.metadata as any).token_snapshot.logo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.8,
                zIndex: 1,
              }}
            />
          )}
          
          {/* Glass pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
              zIndex: 3,
            }}
          />

          <div className="relative z-10">
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                  wager.status === 'open' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  wager.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  wager.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                }`} >
                  {wager.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide" >
                  {timeLeft}
                </p>
              </div>
            </div>

            {/* Header with Token Icon */}
            <div className="flex items-start gap-2.5 mb-3">
              {/* Token Icon */}
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm border border-white/5">
                {wager.metadata && typeof wager.metadata === 'object' && 'token_snapshot' in wager.metadata && (wager.metadata as any).token_snapshot?.logo ? (
                  <img
                    src={(wager.metadata as any).token_snapshot.logo}
                    alt={wager.token_symbol}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    ₿
                  </div>
                )}
              </div>

              {/* Title and Category */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">
                  CRYPTO
                </div>
                <h3 className="text-xs font-medium text-white leading-tight" style={{ 
                  height: '2.4em',
                  lineHeight: '1.2em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {wager.token_symbol.toUpperCase()}
                  <span className={wager.prediction_type === 'above' ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                    {wager.prediction_type === 'above' ? ' ↑ ' : ' ↓ '}
                  </span>
                  ${wager.target_price.toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Price Chart */}
            <div className="mb-3 h-20 rounded-lg overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 255, 165, 0.15))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Background mask to hide token image behind chart */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
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
                { label: 'Current', value: currentPrice > 0 ? `$${currentPrice.toLocaleString()}` : '---', color: 'text-white' },
                { label: 'Target', value: `$${wager.target_price.toLocaleString()}`, color: 'text-purple-400' }
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg relative overflow-hidden"
                  style={{
                    background: idx === 0 
                      ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.15), rgba(58, 134, 255, 0.15))'
                      : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(251, 86, 7, 0.15))',
                    border: `1px solid ${idx === 0 ? 'rgba(6, 255, 165, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Background mask to hide token image behind price boxes */}
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                  <div className="relative z-10">
                    <div className="text-[9px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">
                      {item.label}
                    </div>
                    <div className={`text-base font-bold ${item.color}`}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/10">
              <div className="flex-1">
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">Amount</div>
                <div className="text-xs text-white font-bold flex items-center gap-1" >
                  {wager.amount}
                  <img src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" alt="SOL" className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">Win</div>
                <div className="text-xs text-green-400 font-bold flex items-center gap-1" >
                  {(wager.amount * 1.95).toFixed(2)}
                  <img src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" alt="SOL" className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {canAccept && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(wager.id);
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.15))',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
                  }}
                >
                  ACCEPT
                </button>
              )}
              {onView && (
                <button
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg ${!canAccept ? 'col-span-2' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(wager.id);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.15))',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                  }}
                >
                  VIEW
                </button>
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
      className="relative cursor-pointer"
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
        className="relative p-6 rounded-xl overflow-hidden cursor-pointer flex flex-col"
        onClick={() => onView?.(wager.id)}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          minHeight: '200px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        {/* Dark gradient overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.70) 0%, rgba(5, 5, 10, 0.80) 40%, rgba(0, 0, 0, 0.85) 100%)',
            zIndex: 2,
          }}
        />
        
        {/* Team Background Images for Sports Wagers */}
        {!isCryptoWager(wager) && (
          <div className="absolute inset-0 opacity-80">
            {/* Team 1 Background (Left Half) */}
            {wager.metadata?.creator_team_snapshot?.logo && (
              <div 
                className="absolute top-0 left-0 w-2/5 h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${wager.metadata.creator_team_snapshot.logo})`,
                  maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                  zIndex: 1,
                }}
              />
            )}
            {/* Team 2 Background (Right Half) */}
            {wager.metadata?.opponent_team_snapshot?.logo && (
              <div 
                className="absolute top-0 right-0 w-2/5 h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${wager.metadata.opponent_team_snapshot.logo})`,
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                  zIndex: 1,
                }}
              />
            )}
          </div>
        )}
        
        {/* Glass pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            zIndex: 3,
          }}
        />

        <div className="relative z-10">
          {/* Status Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                wager.status === 'open' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                wager.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                wager.status === 'live' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                wager.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-gray-400/20 text-gray-400 border border-gray-400/30'
              }`} >
                {wager.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30"
>
                {wager.sport} • {wager.league}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide" >
                {timeLeft}
              </p>
            </div>
          </div>

          {/* Header with Team Icons */}
          <div className="flex items-start gap-2.5 mb-3">
            {/* Team Icons */}
            <div className="flex items-center gap-1">
              {/* Team 1 Icon */}
              {wager.metadata?.creator_team_snapshot?.logo ? (
                <img
                  src={wager.metadata.creator_team_snapshot.logo}
                  alt={wager.team1}
                  className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
                  🏆
                </div>
              )}
              <span className="text-gray-400 text-xs">vs</span>
              {/* Team 2 Icon */}
              {wager.metadata?.opponent_team_snapshot?.logo ? (
                <img
                  src={wager.metadata.opponent_team_snapshot.logo}
                  alt={wager.team2}
                  className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">
                  🏆
                </div>
              )}
            </div>

            {/* Title and Category */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">
                SPORTS
              </div>
              <h3 className="text-xs font-medium text-white leading-tight" style={{ 
                height: '2.4em',
                lineHeight: '1.2em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {wager.team1} vs {wager.team2}
              </h3>
            </div>
          </div>

          <p className="text-xs text-gray-300 mb-3" >
            Prediction: <span className="text-white font-bold">{wager.prediction}</span>
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/10">
            <div className="flex-1">
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">Amount</div>
              <div className="text-xs text-white font-bold flex items-center gap-1" >
                {wager.amount}
                <img src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" alt="SOL" className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">Game</div>
              <div className="text-xs text-white font-bold" >
                {new Date(wager.game_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {canAccept && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(wager.id);
                }}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.15))',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
                }}
              >
                ACCEPT
              </button>
            )}
            {onView && (
              <button
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg ${!canAccept ? 'col-span-2' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(wager.id);
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.15))',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                }}
              >
                VIEW
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
