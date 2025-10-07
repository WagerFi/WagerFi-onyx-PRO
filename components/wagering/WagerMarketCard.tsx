'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { MiniPriceChart } from './MiniPriceChart';
import { CountdownTimer } from '../CountdownTimer';
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

// Helper to get token logo
function getTokenLogo(wager: CryptoWager): string {
  // Check metadata for token snapshot
  if (wager.metadata && typeof wager.metadata === 'object') {
    const metadata = wager.metadata as any;
    if (metadata.token_snapshot?.logo) {
      return metadata.token_snapshot.logo;
    }
  }
  
  // Fallback to CoinMarketCap (you'll need the token_id in metadata)
  const metadata = wager.metadata as any;
  const tokenId = metadata?.token_id;
  if (tokenId) {
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${tokenId}.png`;
  }
  
  return 'https://wagerfi-sportsapi.b-cdn.net/default-token.png';
}

// Helper to get team logo
function getTeamLogo(wager: SportsWager, isCreator: boolean): string | null {
  if (wager.metadata && typeof wager.metadata === 'object') {
    const metadata = wager.metadata as any;
    
    // Check for team logos in snapshots
    if (isCreator && metadata.creator_team_snapshot?.logo) {
      return transformImageUrl(metadata.creator_team_snapshot.logo);
    }
    if (!isCreator && metadata.opponent_team_snapshot?.logo) {
      return transformImageUrl(metadata.opponent_team_snapshot.logo);
    }
    
    // Alternative metadata structure
    if (metadata.teams) {
      const logo = isCreator 
        ? (metadata.teams.home?.logo || metadata.teams.creator?.logo)
        : (metadata.teams.away?.logo || metadata.teams.opponent?.logo);
      if (logo) return transformImageUrl(logo);
    }
    
    // Direct fields
    const logo = isCreator 
      ? (metadata.creator_team_logo || metadata.home_team_logo)
      : (metadata.opponent_team_logo || metadata.away_team_logo);
    if (logo) return transformImageUrl(logo);
  }
  
  return null;
}

// Transform image URL to use WagerFi CDN
function transformImageUrl(url: string): string {
  if (url && url.includes('media.api-sports.io')) {
    return url.replace('media.api-sports.io', 'wagerfi-sportsapi.b-cdn.net');
  }
  return url;
}

// Get team name
function getTeamName(wager: SportsWager, isCreator: boolean): string {
  if (wager.metadata && typeof wager.metadata === 'object') {
    const metadata = wager.metadata as any;
    
    if (isCreator && metadata.creator_team_snapshot?.name) {
      return metadata.creator_team_snapshot.name;
    }
    if (!isCreator && metadata.opponent_team_snapshot?.name) {
      return metadata.opponent_team_snapshot.name;
    }
  }
  
  return isCreator ? wager.team1 : wager.team2;
}

function WagerMarketCardComponent({ wager, index }: WagerMarketCardProps) {
  const router = useRouter();
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
    router.push(`/wagers/${wager.id}`);
  };

  if (isCryptoWager(wager)) {
    const isWinning = (wager.prediction_type === 'above' && currentPrice > wager.target_price) ||
                      (wager.prediction_type === 'below' && currentPrice < wager.target_price);
    
    // Determine winner info
    let winnerAddress: string | undefined;
    let winnerUsername: string | undefined;
    let winnerAvatar: string | undefined;
    
    if (wager.status === 'resolved') {
      // Use the actual winner from winner_position (only if accepted)
      if (wager.acceptor_address) {
        if (wager.winner_position === 'creator') {
          winnerAddress = wager.creator_address;
          winnerUsername = wager.creator_profile?.username || 
            `${wager.creator_address?.slice(0, 4)}...${wager.creator_address?.slice(-4)}`;
          winnerAvatar = wager.creator_profile?.profile_image_url;
        } else if (wager.winner_position === 'acceptor') {
          winnerAddress = wager.acceptor_address;
          winnerUsername = wager.acceptor_profile?.username || 
            `${wager.acceptor_address?.slice(0, 4)}...${wager.acceptor_address?.slice(-4)}`;
          winnerAvatar = wager.acceptor_profile?.profile_image_url;
        }
      }
    } else if (wager.status === 'active' && wager.acceptor_address) {
      // Show who is currently winning (accepted wagers only)
      winnerAddress = isWinning ? wager.creator_address : wager.acceptor_address;
      if (isWinning) {
        winnerUsername = wager.creator_profile?.username || 
          `${wager.creator_address?.slice(0, 4)}...${wager.creator_address?.slice(-4)}`;
        winnerAvatar = wager.creator_profile?.profile_image_url;
      } else {
        winnerUsername = wager.acceptor_profile?.username || 
          `${wager.acceptor_address?.slice(0, 4)}...${wager.acceptor_address?.slice(-4)}`;
        winnerAvatar = wager.acceptor_profile?.profile_image_url;
      }
    } else if (wager.status === 'open') {
      // For open wagers, show creator as currently winning
      winnerAddress = wager.creator_address;
      winnerUsername = wager.creator_profile?.username || 
        `${wager.creator_address?.slice(0, 4)}...${wager.creator_address?.slice(-4)}`;
      winnerAvatar = wager.creator_profile?.profile_image_url;
    }
    
    console.log('Winner info:', { 
      status: wager.status, 
      acceptor: wager.acceptor_address, 
      winnerAddress, 
      winnerUsername,
      isWinning,
      winner_position: wager.winner_position 
    });
    
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
            {/* Token Image & Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-800/40 flex-shrink-0">
                <img
                  src={getTokenLogo(wager)}
                  alt={wager.token_symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://wagerfi-sportsapi.b-cdn.net/default-token.png';
                  }}
                />
              </div>
              <h3 
                className="text-white font-medium text-sm line-clamp-2 leading-tight flex-1"
              >
                {wager.token_symbol} {wager.prediction_type === 'above' ? 'above' : 'below'} ${wager.target_price.toLocaleString()}
              </h3>
            </div>

            {/* Price Chart (same as WagerFi with live updates) */}
            {currentPrice > 0 && priceHistory.length > 0 && (
              <div className="mb-4 h-20 rounded-lg overflow-visible relative"
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
                status={wager.status}
                winnerAddress={winnerAddress}
                winnerUsername={winnerUsername}
                winnerAvatar={winnerAvatar}
              />
                </div>
              </div>
            )}

            {/* Wager Info Box */}
            <div className="mb-3 p-3 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">Wager Amount</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-white">
                      {wager.amount}
                    </span>
                    <img 
                      src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" 
                      alt="SOL" 
                      className="w-5 h-5"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">
                    {wager.status === 'open' || wager.status === 'active' ? 'Expires' : 'Status'}
                  </div>
                  <CountdownTimer expiresAt={wager.expiry_time} />
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide">Potential Win</div>
                  <div className="flex items-center gap-1.5 relative">
                    <style jsx>{`
                      @keyframes shine-slide {
                        0% {
                          background-position: 200% 0;
                        }
                        100% {
                          background-position: -200% 0;
                        }
                      }
                      .shine-text-base {
                        color: rgba(255, 255, 255, 0.9);
                      }
                      .shine-text-overlay {
                        background: linear-gradient(
                          90deg,
                          transparent 0%,
                          rgba(255, 255, 255, 0.3) 40%,
                          rgba(255, 255, 255, 1) 50%,
                          rgba(255, 255, 255, 0.3) 60%,
                          transparent 100%
                        );
                        background-size: 200% 100%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        animation: shine-slide 3s ease-in-out infinite;
                        animation-delay: 2s;
                      }
                    `}</style>
                    <div className="relative">
                      <span className="shine-text-base text-base font-black"
                        style={{
                          fontFamily: 'Varien, sans-serif',
                          fontWeight: 400
                        }}
                      >
                        {(wager.amount * 2).toFixed(2)}
                      </span>
                      <span className="shine-text-overlay text-base font-black absolute inset-0 pointer-events-none"
                        style={{
                          fontFamily: 'Varien, sans-serif',
                          fontWeight: 400
                        }}
                      >
                        {(wager.amount * 2).toFixed(2)}
                      </span>
                    </div>
                    <img 
                      src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" 
                      alt="SOL" 
                      className="w-4 h-4"
                    />
                  </div>
                </div>
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
                border: `1.5px solid ${isWinning ? 'rgba(6, 255, 165, 0.3)' : 'rgba(255, 0, 110, 0.3)'}`
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
                color: 'rgba(255, 255, 255, 0.5)'
              }}
            >
              {wager.sport} • {wager.league}
            </span>
          </div>

          {/* Team Logos & Matchup */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {/* Team 1 Logo */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800/80 border-2 border-[#1e1e1e] flex items-center justify-center">
                {getTeamLogo(wager, true) ? (
                  <img
                    src={getTeamLogo(wager, true) || ''}
                    alt={getTeamName(wager, true)}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      // If CDN failed, try original URL
                      if (img.src.includes('wagerfi-sportsapi.b-cdn.net')) {
                        const originalUrl = img.src.replace('wagerfi-sportsapi.b-cdn.net', 'media.api-sports.io');
                        img.src = originalUrl;
                      } else {
                        img.style.display = 'none';
                        img.parentElement!.innerHTML = `<div class="w-7 h-7 flex items-center justify-center text-blue-400 text-xs font-bold">${getTeamName(wager, true).charAt(0)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center text-blue-400 text-xs font-bold">
                    {getTeamName(wager, true).charAt(0)}
                  </div>
                )}
              </div>
              {/* Team 2 Logo */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800/80 border-2 border-[#1e1e1e] flex items-center justify-center">
                {getTeamLogo(wager, false) ? (
                  <img
                    src={getTeamLogo(wager, false) || ''}
                    alt={getTeamName(wager, false)}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes('wagerfi-sportsapi.b-cdn.net')) {
                        const originalUrl = img.src.replace('wagerfi-sportsapi.b-cdn.net', 'media.api-sports.io');
                        img.src = originalUrl;
                      } else {
                        img.style.display = 'none';
                        img.parentElement!.innerHTML = `<div class="w-7 h-7 flex items-center justify-center text-red-400 text-xs font-bold">${getTeamName(wager, false).charAt(0)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center text-red-400 text-xs font-bold">
                    {getTeamName(wager, false).charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <h3 
              className="text-white font-medium text-sm line-clamp-2 leading-tight flex-1"
            >
              {wager.team1} vs {wager.team2}
            </h3>
          </div>

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
            <div className="text-sm font-bold text-white">
              {wager.prediction}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-800/50">
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Wager</div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white font-bold">{wager.amount}</span>
                <img 
                  src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" 
                  alt="SOL" 
                  className="w-3 h-3"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Game</div>
              <div className="text-xs text-white font-bold">
                {new Date(wager.game_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">Expires</div>
              <div className="text-xs text-emerald-400 font-bold">{getTimeLeft(wager.expiry_time)}</div>
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
              border: '1.5px solid rgba(139, 92, 246, 0.3)'
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
  
  // Compare acceptor (changes when wager is accepted)
  if (prevProps.wager.acceptor_address !== nextProps.wager.acceptor_address) return false;
  
  // Compare winner fields
  if (prevProps.wager.winner_id !== nextProps.wager.winner_id) return false;
  if (prevProps.wager.winner_position !== nextProps.wager.winner_position) return false;
  
  // For crypto wagers, compare resolution_price
  if (isCryptoWager(prevProps.wager) && isCryptoWager(nextProps.wager)) {
    if (prevProps.wager.resolution_price !== nextProps.wager.resolution_price) return false;
  }
  
  // Compare updated_at to catch any other changes
  if (prevProps.wager.updated_at !== nextProps.wager.updated_at) return false;
  
  // If we got here, props are essentially the same - skip render
  return true;
});


