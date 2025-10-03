'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { useOrderBook } from '@/lib/hooks/useOrderBook';
import { MarketCard } from '@/components/MarketCard';
import { WagerMarketCard } from '@/components/wagering/WagerMarketCard';
import { OrderBook } from '@/components/OrderBook';
import { TradePanel } from '@/components/TradePanel';
import { BatchOrderPanel } from '@/components/BatchOrderPanel';
import { supabase } from '@/lib/supabase/client';
import type { Market } from '@/lib/polymarket/types';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';

export default function TradePage() {
  const router = useRouter();
  const [isDocsHovered, setIsDocsHovered] = useState(false);
  const [isXHovered, setIsXHovered] = useState(false);
  const [isTelegramHovered, setIsTelegramHovered] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [viewMode, setViewMode] = useState<'trending' | 'profitable' | 'all' | 'crypto' | 'sports'>('trending');
  const [tradeMode, setTradeMode] = useState<'single' | 'batch'>('single');
  
  const { walletAddress, connected, connecting, connect } = useWallet();
  const { markets, trending, profitable, loading: marketsLoading } = useMarkets();
  const { orderBook, loading: orderBookLoading } = useOrderBook(
    selectedMarket?.tokens?.[0]?.token_id || null
  );

  // Wagers state
  const [cryptoWagers, setCryptoWagers] = useState<CryptoWager[]>([]);
  const [sportsWagers, setSportsWagers] = useState<SportsWager[]>([]);
  const [wagersLoading, setWagersLoading] = useState(false);
  
  // Wager filters
  const [wagerFilter, setWagerFilter] = useState<'all' | 'open' | 'live' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const ITEMS_PER_LOAD = 50;

  // Reset displayed count when view mode changes
  useEffect(() => {
    setDisplayedCount(50);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [viewMode, wagerFilter, debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch wagers
  useEffect(() => {
    if (viewMode === 'crypto' || viewMode === 'sports') {
      fetchWagers();
    }
  }, [viewMode, wagerFilter, debouncedSearchQuery]);

  // Infinite scroll handler with throttle
  const handleScroll = () => {
    if (!scrollContainerRef.current || loadingMoreRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollBottom = scrollTop + clientHeight;
    const scrollPercentage = scrollBottom / scrollHeight;

    console.log(`🔍 Scroll: ${Math.round(scrollPercentage * 100)}% | ScrollTop: ${scrollTop}, ClientHeight: ${clientHeight}, ScrollHeight: ${scrollHeight}`);

    // Load more when scrolled 70% down
    if (scrollPercentage > 0.7) {
      const totalItems = isWagerMode ? fullWagers.length : fullMarkets.length;
      if (displayedCount < totalItems) {
        loadingMoreRef.current = true;
        console.log(`📜 Loading more... Current: ${displayedCount}, Total: ${totalItems}`);
        
        setDisplayedCount((prev) => {
          const newCount = Math.min(prev + ITEMS_PER_LOAD, totalItems);
          // Reset loading flag after state update
          setTimeout(() => {
            loadingMoreRef.current = false;
          }, 100);
          return newCount;
        });
      }
    }
  };

  async function fetchWagers() {
    setWagersLoading(true);
    
    const tableName = viewMode === 'crypto' ? 'crypto_wagers' : 'sports_wagers';
    let query = supabase
      .from(tableName)
      .select('*');

    // Apply status filter
    if (wagerFilter === 'open') {
      query = query.eq('status', 'open');
    } else if (wagerFilter === 'live') {
      query = query.in('status', ['live', 'active', 'matched']);
    } else if (wagerFilter === 'settled') {
      query = query.in('status', ['resolved', 'settled']);
    }
    // 'all' = no status filter

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      if (viewMode === 'crypto') {
        query = query.ilike('token_symbol', `%${debouncedSearchQuery}%`);
      } else {
        query = query.or(`team1.ilike.%${debouncedSearchQuery}%,team2.ilike.%${debouncedSearchQuery}%`);
      }
    }

    // Exclude cancelled wagers
    query = query.neq('status', 'cancelled');

    // Order and fetch all (for infinite scroll)
    query = query
      .order('created_at', { ascending: false })
      .limit(500); // Increased limit for infinite scroll

    const { data } = await query;
    
    if (data) {
      if (viewMode === 'crypto') {
        setCryptoWagers(data as CryptoWager[]);
      } else {
        setSportsWagers(data as SportsWager[]);
      }
    }
    
    setWagersLoading(false);
  }

  // Get full list based on view mode
  const fullMarkets = 
    viewMode === 'trending' ? trending :
    viewMode === 'profitable' ? profitable :
    markets;
  
  const fullWagers = viewMode === 'crypto' ? cryptoWagers : sportsWagers;
  const isWagerMode = viewMode === 'crypto' || viewMode === 'sports';
  const loading = isWagerMode ? wagersLoading : marketsLoading;

  // Slice to displayed count for infinite scroll
  const displayMarkets = fullMarkets.slice(0, displayedCount);
  const displayWagers = fullWagers.slice(0, displayedCount);
  const totalItems = isWagerMode ? fullWagers.length : fullMarkets.length;
  const hasMore = displayedCount < totalItems;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden p-4">
      {/* Base gradient background */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 50%, #d8d8f8 100%)'
        }}
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)'
        }}
      />

      {/* Navbar */}
      <motion.nav
        className="absolute top-0 left-0 right-0 z-50 p-6"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div 
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(30, 30, 30, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                fontFamily: 'JetBrains Mono, monospace'
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

              <span className="relative z-10 text-xl tracking-tight select-none uppercase mt-0.5 flex items-center gap-2" style={{ fontFamily: 'Surgena, sans-serif' }}>
                <span className="font-light text-white">WAGERFI</span>
                <span className="w-0.5 h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
                <span 
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  ONYX
                </span>
              </span>
              <span 
                className="relative z-10 bg-white text-[#2a2a2a] text-sm font-extrabold px-2 py-0.5 rounded-md"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                PRO
              </span>
            </motion.div>
          </Link>

          {/* Wallet Connection - MetaMask */}
          <motion.button
            onClick={connect}
            disabled={connecting || connected}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{
              background: connected 
                ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.2), rgba(58, 134, 255, 0.2))'
                : 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            {!connected && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.6 5.4L14.4 1.2C13.2 0.4 11.8 0.4 10.6 1.2L4.4 5.4C3.2 6.2 2.4 7.6 2.4 9.2V14.8C2.4 16.4 3.2 17.8 4.4 18.6L10.6 22.8C11.2 23.2 11.6 23.2 12.2 23.2C12.8 23.2 13.2 23.2 13.8 22.8L20 18.6C21.2 17.8 22 16.4 22 14.8V9.2C22 7.6 21.2 6.2 20.6 5.4Z" fill="#F6851B"/>
                <path d="M8.2 13.8L11 16.6L15.8 11.8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span>
              {connecting ? 'Connecting...' : connected ? formatAddress(walletAddress!) : 'Connect MetaMask'}
            </span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 pt-20 pb-4 max-w-[1800px] mx-auto px-4">
        {/* Header & View Mode Tabs */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-[#2d2d2d] mb-1" style={{ fontFamily: 'Surgena, sans-serif' }}>
                {viewMode === 'trending' ? '🔥 Trending Markets' : 
                 viewMode === 'profitable' ? '💰 Most Profitable' : 
                 viewMode === 'all' ? '📊 All Markets' :
                 viewMode === 'crypto' ? '₿ Crypto Wagers' :
                 '🏆 Sports Wagers'}
              </h2>
              <p className="text-gray-600 text-xs">
                {isWagerMode 
                  ? `Showing ${displayWagers.length} of ${totalItems} wagers`
                  : `Showing ${displayMarkets.length} of ${totalItems} markets`
                }
              </p>
            </div>
          </div>

          {/* View Mode Tabs & Wager Filters Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: View Mode Tabs */}
            <div className="flex gap-2 flex-wrap">
              <motion.button
                onClick={() => setViewMode('trending')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'trending'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                🔥 TRENDING
              </motion.button>
              <motion.button
                onClick={() => setViewMode('profitable')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'profitable'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                💰 PROFITABLE
              </motion.button>
              <motion.button
                onClick={() => setViewMode('all')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                📊 ALL MARKETS
              </motion.button>
              <motion.button
                onClick={() => {
                  setViewMode('crypto');
                  setWagerFilter('all');
                  setSearchQuery('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'crypto'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                ₿ CRYPTO
              </motion.button>
              <motion.button
                onClick={() => {
                  setViewMode('sports');
                  setWagerFilter('all');
                  setSearchQuery('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'sports'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                🏆 SPORTS
              </motion.button>
            </div>

            {/* Right: Wager Filters & Search - Only show when viewing wagers */}
            {isWagerMode && (
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={viewMode === 'crypto' ? 'Search token...' : 'Search team...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 px-4 py-2 pl-9 rounded-lg text-xs bg-white/80 border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  {(['all', 'open', 'live', 'settled'] as const).map((filter) => (
                    <motion.button
                      key={filter}
                      onClick={() => setWagerFilter(filter)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        wagerFilter === filter
                          ? 'bg-[#2d2d2d] text-white shadow-md'
                          : 'bg-white/60 text-gray-600 hover:bg-white'
                      }`}
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Markets/Wagers Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto overflow-x-hidden custom-scrollbar-hidden"
          style={{ 
            height: 'calc(100vh - 280px)',
            minHeight: '500px'
          }}
        >
          <style jsx>{`
            .custom-scrollbar-hidden {
              scrollbar-width: none; /* Firefox */
              -ms-overflow-style: none; /* IE and Edge */
            }
            .custom-scrollbar-hidden::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
          {/* Markets/Wagers Grid - Tighter spacing for compact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {loading ? (
              <div className="col-span-full py-24 text-center text-gray-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"
                />
                <p className="mt-4">Loading {isWagerMode ? 'wagers' : 'markets'}...</p>
              </div>
            ) : isWagerMode ? (
              // Display wagers
              displayWagers.length === 0 ? (
                <div className="col-span-full py-24 text-center text-gray-500">
                  <p className="text-2xl mb-2">No {viewMode} wagers available</p>
                  <p className="text-sm">Check back soon for new wagers!</p>
                </div>
              ) : (
                displayWagers.map((wager, index) => (
                  <WagerMarketCard
                    key={wager.id}
                    wager={wager}
                    index={index}
                  />
                ))
              )
            ) : (
              // Display markets
              displayMarkets.length === 0 ? (
                <div className="col-span-full py-24 text-center text-gray-500">
                  No markets available
                </div>
              ) : (
                displayMarkets.map((market, index) => {
                  // Try multiple possible ID fields (API uses different naming conventions)
                  const marketId = market.conditionId || market.condition_id || market.id || market.slug;
                  
                  return (
                    <MarketCard
                      key={marketId || `market-${index}`}
                      market={market}
                      onClick={() => {
                        // Navigate to detailed market page
                        console.log('🔍 Navigating to market:', marketId, market);
                        if (marketId) {
                          router.push(`/market/${marketId}`);
                        } else {
                          console.error('❌ No market ID found:', market);
                        }
                      }}
                      onTrade={(outcome) => {
                        // Quick trade - navigate to market page
                        console.log('💰 Trading on market:', marketId, 'outcome:', outcome);
                        if (marketId) {
                          router.push(`/market/${marketId}`);
                        }
                      }}
                      index={index}
                    />
                  );
                })
              )
            )}
          </div>

          {/* Load More Indicator */}
          {!loading && hasMore && (
            <div className="col-span-full py-8 text-center text-gray-500">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm font-medium"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Scroll for more...
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Docs Button - Bottom Left */}
      <motion.div
        className="absolute bottom-6 left-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
        }}
        onMouseEnter={() => setIsDocsHovered(true)}
        onMouseLeave={() => setIsDocsHovered(false)}
      >
        <motion.button
          className="relative px-4 py-1 text-white font-light text-xs tracking-wide cursor-pointer select-none"
          style={{ 
            borderRadius: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              borderRadius: '12px',
              padding: '2px',
              background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude'
            }}
            animate={{ opacity: isDocsHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
          <span className="relative z-10">Docs</span>
        </motion.button>
      </motion.div>

      {/* Social Buttons - Bottom Right */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-10">
        {/* X Button */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
          }}
          onMouseEnter={() => setIsXHovered(true)}
          onMouseLeave={() => setIsXHovered(false)}
        >
          <motion.button
            className="relative w-8 h-8 flex items-center justify-center text-white text-sm cursor-pointer select-none"
            style={{ 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://twitter.com', '_blank')}
          >
            <motion.div
              className="absolute pointer-events-none"
              style={{
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                borderRadius: '10px',
                padding: '2px',
                background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude'
              }}
              animate={{ opacity: isXHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            <span className="relative z-10">𝕏</span>
          </motion.button>
        </motion.div>

        {/* Telegram Button */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
          }}
          onMouseEnter={() => setIsTelegramHovered(true)}
          onMouseLeave={() => setIsTelegramHovered(false)}
        >
          <motion.button
            className="relative w-8 h-8 flex items-center justify-center text-white cursor-pointer select-none"
            style={{ 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://t.me', '_blank')}
          >
            <motion.div
              className="absolute pointer-events-none"
              style={{
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                borderRadius: '10px',
                padding: '2px',
                background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude'
              }}
              animate={{ opacity: isTelegramHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            <svg className="relative z-10 w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
