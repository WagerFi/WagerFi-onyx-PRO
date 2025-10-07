'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMarket } from '@/lib/hooks/useMarkets';
import { useWallet } from '@/lib/hooks/useWallet';
import { TradePanel } from '@/components/TradePanel';
import { MultiOutcomeChart, type ChartDataPoint, type OutcomeData, type EventMarker } from '@/components/wagering/MultiOutcomeChart';
import type { Market } from '@/lib/polymarket/types';

export default function MarketPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  
  console.log('📄 Market page loaded, ID:', marketId);
  
  const { market, loading: marketLoading } = useMarket(marketId);
  const { walletAddress, connected, connecting, connect, disconnect } = useWallet();

  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [eventMarkers, setEventMarkers] = useState<EventMarker[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'comments' | 'holders' | 'activity'>('comments');
  const [comments, setComments] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]); // Store all comments for count
  const [topHolders, setTopHolders] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  
  // Comment filters and sorting
  const [holdersOnly, setHoldersOnly] = useState(true); // Default to holders only like Polymarket
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}k`;
    return `$${vol.toFixed(0)}`;
  };

  // Get market data - memoized to prevent infinite re-renders
  // Sort outcomes by price (highest to lowest)
  const { outcomes, prices, images } = useMemo(() => {
    const rawOutcomes = Array.isArray(market?.outcomes) 
      ? market.outcomes 
      : (market?.tokens?.map(t => t.outcome) || ['Yes', 'No']);
    
    const rawPrices = market?.tokens?.map(t => parseFloat(t.price || '0.5')) || [0.5, 0.5];
    const rawImages = market?.tokens?.map(t => t.image) || [];
    
    // Create array of {outcome, price, image} pairs
    const pairs = rawOutcomes.map((outcome, idx) => ({
      outcome,
      price: rawPrices[idx] || 0.5,
      image: rawImages[idx]
    }));
    
    // Sort by price descending (highest first)
    pairs.sort((a, b) => b.price - a.price);
    
    // Extract sorted outcomes, prices, and images
    return {
      outcomes: pairs.map(p => p.outcome),
      prices: pairs.map(p => p.price),
      images: pairs.map(p => p.image)
    };
  }, [market?.outcomes, market?.tokens]);
  
  const volume24h = useMemo(() => 
    parseFloat(market?.volume_24hr || market?.volume24hr || '0'),
    [market?.volume_24hr, market?.volume24hr]
  );
  
  const totalVolume = useMemo(() => 
    parseFloat(market?.volume || '0'),
    [market?.volume]
  );
  
  const liquidity = useMemo(() => 
    parseFloat(market?.liquidity || '0'),
    [market?.liquidity]
  );

  // Fetch historical price data from Polymarket
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!market?.tokens || market.tokens.length === 0) {
        console.log('⚠️ No market tokens available for chart');
        return;
      }

      if (outcomes.length === 0) {
        console.log('⚠️ No outcomes available for chart');
        return;
      }

      console.log('📊 Fetching real historical data for', outcomes.length, 'outcomes');

      try {
        // Fetch real price history from Polymarket Subgraph for each token
        const historyPromises = market.tokens?.map(async (token) => {
          try {
            console.log('📊 Fetching subgraph data for token:', token.token_id);
            const response = await fetch(`/api/market-history?token_id=${token.token_id}`);
            if (response.ok) {
              const data = await response.json();
              console.log('📊 Got', data.history?.length || 0, 'data points for', token.outcome);
              return { outcome: token.outcome, history: data.history || [] };
            }
            return { outcome: token.outcome, history: [] };
          } catch (err) {
            console.error('📊 Error fetching history for', token.outcome, err);
            return { outcome: token.outcome, history: [] };
          }
        });

        const histories = await Promise.all(historyPromises || []);
        console.log('📊 All histories fetched:', histories.map(h => `${h.outcome}: ${h.history.length} points`));
        
        // Check if we got any real data
        const hasRealData = histories.some(h => h.history.length > 0);
        
        if (hasRealData) {
          console.log('📊 Got real price history data');
          
          // Find the longest history to use as the base timeline
          const longestHistory = histories.reduce((longest, current) => 
            current.history.length > longest.history.length ? current : longest
          , histories[0]);
          
          // Transform to our format
          const data: ChartDataPoint[] = longestHistory.history.map((point: any) => {
            const outcomeData: { [key: string]: number } = {};
            
            // For each outcome, find the corresponding price at this timestamp
            outcomes.forEach((outcome, idx) => {
              const outcomeHistory = histories.find(h => h.outcome === outcome);
              if (outcomeHistory && outcomeHistory.history.length > 0) {
                // Find closest price point by timestamp
                const historyPoint = outcomeHistory.history.find((hp: any) => hp.t === point.t) ||
                                   outcomeHistory.history[outcomeHistory.history.length - 1];
                outcomeData[outcome] = parseFloat(historyPoint.p) || prices[idx] || 0.5;
              } else {
                outcomeData[outcome] = prices[idx] || 0.5;
              }
            });
            
            return {
              timestamp: point.t,
              outcomes: outcomeData
            };
          });
          
          console.log('📊 Transformed', data.length, 'historical data points');
          setChartData(data);
        } else {
          // Fallback: generate simulated data with more realistic history (120 days = ~4 months)
          console.log('📊 No real data available, generating simulated data');
          const now = Math.floor(Date.now() / 1000);
          const data: ChartDataPoint[] = [];
          const numDays = 120; // 4 months like Polymarket
          
          // Create random walk for each outcome starting from initial values
          const historicalPrices = outcomes.map((_, idx) => {
            const currentPrice = prices[idx] || 0.5;
            // Start from a different value and walk to current
            return currentPrice * 0.5; // Start at 50% of current price
          });
          
          for (let i = 0; i < numDays; i++) {
            const timestamp = now - (numDays - i) * 24 * 3600;
            const outcomeData: { [key: string]: number } = {};
            
            outcomes.forEach((outcome, idx) => {
              const currentPrice = prices[idx] || 0.5;
              
              // Random walk with drift toward current price
              if (i === numDays - 1) {
                // Last point = current price
                outcomeData[outcome] = currentPrice;
              } else {
                // Random walk
                const drift = (currentPrice - historicalPrices[idx]) / (numDays - i);
                const randomChange = (Math.random() - 0.5) * 0.03; // ±3% random movement
                historicalPrices[idx] = Math.max(0.001, Math.min(0.999, historicalPrices[idx] + drift + randomChange));
                outcomeData[outcome] = historicalPrices[idx];
              }
            });
            
            data.push({ timestamp, outcomes: outcomeData });
          }
          
          setChartData(data);
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
      }
    };

    if (outcomes.length > 0 && prices.length > 0 && market) {
      fetchPriceHistory();
    }
  }, [market, outcomes, prices]);

  // Fetch tab data when market loads or tab changes
  useEffect(() => {
    if (!market?.condition_id && !market?.conditionId && !market?.id) {
      console.log('📭 No market ID available yet');
      return;
    }
    
    const marketIdentifier = market.condition_id || market.conditionId || market.id;
    const tokenId = market.tokens?.[0]?.token_id;
    
    console.log('🔍 Available market IDs:', {
      conditionId: market.condition_id || market.conditionId || market.id,
      tokenId: tokenId,
      slug: market.slug,
      eventSlug: market.event_slug,
      allKeys: Object.keys(market)
    });
    
    console.log(`📡 Fetching ${activeTab} data for market:`, marketIdentifier);
    
    const fetchTabData = async () => {
      setTabLoading(true);
      
      try {
        if (activeTab === 'comments') {
          // Build URL with filters
          const params = new URLSearchParams({
            market: marketIdentifier,
            limit: '2000',
            holders_only: holdersOnly.toString(),
            order: sortBy === 'newest' ? 'createdAt' : 'reactionCount',
            ascending: 'false' // Newest first / Most likes first
          });
          const url = `/api/comments?${params}`;
          console.log('🔍 Fetching comments from:', url);
          const response = await fetch(url);
          console.log('📥 Comments response:', response.status, response.ok);
          if (response.ok) {
            const data = await response.json();
            console.log('💬 Comments data:', data);
            
            // Store all comments for count
            setAllComments(Array.isArray(data) ? data : []);
            
            // Organize comments into a tree structure
            const commentMap = new Map();
            const topLevelComments: any[] = [];
            
            // First pass: create a map of all comments
            (Array.isArray(data) ? data : []).forEach((comment: any) => {
              commentMap.set(comment.id, { ...comment, replies: [] });
            });
            
            // Second pass: organize into tree
            commentMap.forEach((comment: any) => {
              if (comment.parentCommentID) {
                // This is a reply
                const parent = commentMap.get(comment.parentCommentID);
                if (parent) {
                  parent.replies.push(comment);
                } else {
                  // Parent not found, treat as top-level
                  topLevelComments.push(comment);
                }
              } else {
                // Top-level comment
                topLevelComments.push(comment);
              }
            });
            
            console.log('🌳 Organized comments:', { total: data.length, topLevel: topLevelComments.length });
            setComments(topLevelComments);
          }
        } else if (activeTab === 'holders') {
          const url = `/api/top-holders?market=${marketIdentifier}`;
          console.log('🔍 Fetching top holders from:', url);
          const response = await fetch(url);
          console.log('📥 Top holders response:', response.status, response.ok);
          if (response.ok) {
            const data = await response.json();
            console.log('👥 Top holders data:', data);
            setTopHolders(Array.isArray(data) ? data : []);
          }
        } else if (activeTab === 'activity') {
          // Pass token_id if available, otherwise market
          const activityUrl = tokenId 
            ? `/api/activity?token_id=${tokenId}&limit=20`
            : `/api/activity?market=${marketIdentifier}&limit=20`;
          console.log('🔍 Fetching activity from:', activityUrl);
          const response = await fetch(activityUrl);
          console.log('📥 Activity response:', response.status, response.ok);
          if (response.ok) {
            const data = await response.json();
            console.log('📊 Activity data:', data);
            setActivity(Array.isArray(data) ? data : []);
          } else {
            setActivity([]);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching tab data:', error);
      } finally {
        setTabLoading(false);
      }
    };
    
    fetchTabData();
  }, [market, activeTab, holdersOnly, sortBy]);

  if (marketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
        />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Market Not Found</h1>
          <Link href="/trade" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - Coal Theme */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0f0f0f 50%, #0a0a0a 100%)'
        }}
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)'
        }}
      />

      {/* Navbar - Same as Trade Page */}
      <motion.nav
        className="relative z-50 p-4 md:p-6"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <Link href="/trade">
            <motion.div 
              className="relative inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(30, 30, 30, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseEnter={() => setIsNavHovered(true)}
              onMouseLeave={() => setIsNavHovered(false)}
            >
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  inset: 0,
                  borderRadius: '12px',
                  padding: '2px',
                  background: `radial-gradient(100px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude'
                }}
                animate={{ opacity: isNavHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />

              <span className="relative z-10 text-sm md:text-base tracking-tight select-none uppercase flex items-center gap-1 md:gap-1.5" style={{ fontFamily: 'Varien, sans-serif' }}>
                <span className="font-light text-white">WAGERFI</span>
                <span className="w-0.5 h-3 md:h-4 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
                <span 
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'Varien Outline, sans-serif'
                  }}
                >
                  ONYX
                </span>
              </span>
              <span 
                className="relative z-10 bg-white text-[#2a2a2a] text-[10px] md:text-xs font-extrabold px-1 md:px-1.5 py-0.5 rounded"
              >
                PRO
              </span>
            </motion.div>
          </Link>

          {/* Wallet Connection */}
          <motion.button
            onClick={() => connected ? disconnect() : connect()}
            disabled={connecting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium flex items-center gap-1 md:gap-2"
            style={{
              background: 'rgba(30, 30, 30, 1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            {connected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
            <span className="hidden sm:inline">
              {connecting ? 'Connecting...' : connected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Connect Wallet'}
            </span>
            <span className="sm:hidden">
              {connecting ? 'Connecting...' : connected ? `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}` : 'Connect'}
            </span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 pb-12">
        {/* Back Button */}
        <Link href="/trade">
          <motion.button
            className="mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
            whileHover={{ scale: 1.02, x: -4 }}
          >
            ← Back
          </motion.button>
        </Link>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Market Info & Stats */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            {/* Compact Market Header */}
            <motion.div
              className="p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Glass pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative z-10">
                {/* Header Row - Icon, Title, Volume */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Market Icon */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                    {(market.image || market.icon || market.tokens?.[0]?.image) ? (
                      <img 
                        src={market.image || market.icon || market.tokens?.[0]?.image} 
                        alt={market.question} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-2xl">{market.category === 'Politics' ? '🗳️' : '📊'}</span>
                    )}
                  </div>

                  {/* Title and Category */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
              {market.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    {market.category}
                  </span>
                      )}
                </div>
                    <h1 className="text-lg font-bold text-white leading-tight line-clamp-2" 
                style={{ fontFamily: 'Varien, sans-serif' }}
              >
                {market.question}
              </h1>
                  </div>

                  {/* Volume Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span>{formatVolume(totalVolume)} Vol</span>
                    </div>
                  </div>
                </div>

              {/* Historical Chart */}
              {chartData.length > 0 ? (() => {
                console.log('📈 Rendering chart with', chartData.length, 'data points');

                // Prepare outcome data with colors for the chart
                const OUTCOME_COLORS = [
                  '#f97316', // orange
                  '#06b6d4', // cyan
                  '#eab308', // yellow
                  '#a855f7', // purple
                  '#ec4899', // pink
                  '#22c55e', // green
                  '#ef4444', // red
                  '#3b82f6', // blue
                ];

                const outcomeData: OutcomeData[] = outcomes.map((outcome, idx) => ({
                  name: outcome,
                  color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
                  prices: chartData.map(d => d.outcomes[outcome] || 0),
                }));

                console.log('📈 Outcome data prepared:', outcomeData.map(o => `${o.name}: ${o.prices.length} prices`));

                return (
                  <div className="mb-3">
                    <div className="rounded-lg overflow-hidden border border-white/5" 
                         style={{ background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%)' }}>
                      <MultiOutcomeChart
                        data={chartData}
                        outcomes={outcomeData}
                        events={eventMarkers}
                        height={220}
                        showLabels={true}
                      />
                    </div>
                    {/* Chart Legend - Top 4 outcomes only */}
                    <div className="flex flex-wrap gap-3 mt-3 px-1">
                      {outcomeData.slice(0, 4).map((outcome, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ 
                              backgroundColor: outcome.color,
                              boxShadow: `0 0 8px ${outcome.color}60`
                            }}
                          />
                          <span className="text-[11px] font-medium truncate max-w-[140px]"
                                style={{ color: outcome.color }}>
                            {outcome.name}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {(prices[outcomes.indexOf(outcome.name)] * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <div className="mb-3 rounded-lg p-6 text-center text-gray-500 text-sm border border-white/5" 
                     style={{ background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%)' }}>
                  Loading chart data...
                </div>
              )}

                {/* Compact Stats Row */}
                <div className="flex items-center gap-4 text-xs border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1 text-gray-400">
                    <span>24h:</span>
                    <span className="text-white font-medium">{formatVolume(volume24h)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span>Liquidity:</span>
                    <span className="text-emerald-400 font-medium">{formatVolume(liquidity)}</span>
                  </div>
                  {market.end_date_iso && (
                    <div className="flex items-center gap-1 text-gray-400 ml-auto">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">
                        {new Date(market.end_date_iso).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Outcome Cards */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
                {outcomes.map((outcome, idx) => {
                  const price = prices[idx] || 0.5;
                  const percentage = (price * 100).toFixed(0);
                  const buyPrice = (price * 100).toFixed(1);
                  const sellPrice = ((1 - price) * 100).toFixed(1);
                  
                  // Calculate outcome volume (distribute total volume proportionally)
                  const outcomeVolume = totalVolume * price;
                  const formattedVolume = formatVolume(outcomeVolume);
                  
                  // Calculate 24h change (placeholder - would need historical data)
                  const change = idx === 0 ? '+2%' : idx === 1 ? '▼3%' : '';
                  const changeColor = change.startsWith('+') ? '#22c55e' : change.startsWith('▼') ? '#ef4444' : '#9ca3af';
                  
                  return (
                    <div
                      key={idx}
                      className="relative p-3 rounded-xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.37)',
                      }}
                    >
                      {/* Glass pattern overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-40"
                        style={{
                          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                          backgroundSize: '16px 16px',
                        }}
                      />
                      <div className="relative z-10 flex items-center gap-4">
                        {/* Left: Avatar, Name, Volume */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center border-2 border-white/10">
                            {images[idx] ? (
                              <img 
                                src={images[idx]} 
                                alt={outcome} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-lg font-bold">
                                {outcome.charAt(0).toUpperCase()}
                              </span>
                            )}
              </div>

                          {/* Name and Volume */}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-bold text-white truncate">
                              {outcome}
                </div>
                            <div className="text-xs text-gray-400">
                              {formattedVolume} Vol.
                </div>
                </div>
              </div>

                        {/* Middle: Percentage and Change */}
                        <div className="flex flex-col items-center px-4">
                          <div className="text-3xl font-black text-white">
                            {percentage}%
                    </div>
                          {change && (
                            <div className="text-xs font-medium" style={{ color: changeColor }}>
                              {change}
                  </div>
                )}
              </div>

                        {/* Right: Buy Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <motion.button
                            onClick={() => setSelectedOutcome(idx)}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Buy Yes {buyPrice}¢
                          </motion.button>
                          <motion.button
                            onClick={() => setSelectedOutcome(idx)}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Buy No {sellPrice}¢
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </motion.div>

            {/* Tabs Section - Comments / Top Holders / Activity */}
            <motion.div
              className="p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Glass pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative z-10">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-2 mb-4">
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                      activeTab === 'comments' 
                        ? 'text-white border-white' 
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    Comments {allComments.length > 0 && `(${allComments.length})`}
                  </button>
                  <button 
                    onClick={() => setActiveTab('holders')}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                      activeTab === 'holders' 
                        ? 'text-white border-white' 
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    Top Holders
                  </button>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                      activeTab === 'activity' 
                        ? 'text-white border-white' 
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    Activity
                  </button>
                </div>

                {/* Comment Filters - Only show when on comments tab */}
                {activeTab === 'comments' && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    {/* Holders Only Toggle */}
                    <button
                      onClick={() => setHoldersOnly(!holdersOnly)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        holdersOnly
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {holdersOnly ? '✓ ' : ''}Holders Only
                    </button>
                    
                    <div className="h-4 w-px bg-white/10" />
                    
                    {/* Sort By Buttons */}
                    <span className="text-xs text-gray-500">Sort by:</span>
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === 'newest'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      Newest
                    </button>
                    <button
                      onClick={() => setSortBy('likes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === 'likes'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      Most Likes
                    </button>
                  </div>
                )}

                {/* Tab Content */}
                {tabLoading ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full mx-auto"
                    />
                  </div>
                ) : (
                  <>
                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                      <div className="space-y-3">
                        {comments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No comments yet
                          </div>
                        ) : (
                          comments.map((comment: any, idx: number) => {
                            // Recursive function to render a comment and its replies
                            const renderComment = (comment: any, depth: number = 0): any => (
                              <div key={comment.id || idx} className={depth > 0 ? 'ml-8 mt-2' : ''}>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                  <div className="flex items-start gap-3">
                                    {/* Profile Image */}
                                    {comment.profile?.profileImage ? (
                                      <img 
                                        src={comment.profile.profileImage} 
                                        alt={comment.profile?.name || 'User'} 
                                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">
                                          {comment.profile?.name || comment.profile?.pseudonym || 'Anonymous'}
                                        </span>
                                        {comment.replyAddress && (
                                          <span className="text-xs text-purple-400">
                                            → replying
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-300">{comment.body}</p>
                                      {/* Reaction count */}
                                      {comment.reactionCount > 0 && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          {comment.reactionCount} reaction{comment.reactionCount !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Render replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-2">
                                    {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
                                  </div>
                                )}
                              </div>
                            );
                            
                            return renderComment(comment, 0);
                          })
                        )}
                      </div>
                    )}

                    {/* Top Holders Tab */}
                    {activeTab === 'holders' && (
                      <div className="space-y-2">
                        {topHolders.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No holder data available
                          </div>
                        ) : (
                          topHolders.map((holder: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-6">#{idx + 1}</span>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                                <span className="text-sm text-white font-mono">
                                  {holder.user_address?.slice(0, 6)}...{holder.user_address?.slice(-4)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">
                                  {holder.shares ? `${parseFloat(holder.shares).toLocaleString()} shares` : 'N/A'}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {holder.total_value ? `$${parseFloat(holder.total_value).toFixed(2)}` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                      <div className="space-y-2">
                        {activity.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No recent activity
                          </div>
                        ) : (
                          activity.map((trade: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white font-mono">
                                      {trade.user_address?.slice(0, 6)}...{trade.user_address?.slice(-4)}
                                    </span>
                                    <span className={`text-xs font-bold ${
                                      trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {trade.side}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {trade.outcome || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-white">
                                  {trade.size ? `${parseFloat(trade.size).toFixed(2)} @ ${parseFloat(trade.price).toFixed(2)}¢` : 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {trade.timestamp ? new Date(trade.timestamp * 1000).toLocaleTimeString() : ''}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              className="sticky top-4 p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Glass pattern overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative z-10">
              <TradePanel
                market={market}
                isConnected={connected}
                onConnect={connect}
              />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

