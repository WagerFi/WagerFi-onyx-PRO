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
import { UpcomingGamesPanelModal } from '@/components/wagering/UpcomingGamesPanelModal';
import { TopCryptoTokensPanelModal } from '@/components/wagering/TopCryptoTokensPanelModal';
import { SportsWagerModal } from '@/components/wagering/SportsWagerModal';
import { CryptoWagerModal } from '@/components/wagering/CryptoWagerModal';
import { supabase } from '@/lib/supabase/client';
import type { Market } from '@/lib/polymarket/types';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';
import { Zap } from 'lucide-react';

export default function TradePage() {
  const router = useRouter();
  const [isDocsHovered, setIsDocsHovered] = useState(false);
  const [isXHovered, setIsXHovered] = useState(false);
  const [isTelegramHovered, setIsTelegramHovered] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [viewMode, setViewMode] = useState<'trending' | 'profitable' | 'all' | 'crypto' | 'sports'>('trending');
  const [tradeMode, setTradeMode] = useState<'single' | 'batch'>('single');
  
  const { walletAddress, connected, connecting, connect, disconnect } = useWallet();
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Wager creation modals
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [isTokensModalOpen, setIsTokensModalOpen] = useState(false);
  const [isSportsWagerModalOpen, setIsSportsWagerModalOpen] = useState(false);
  const [isCryptoWagerModalOpen, setIsCryptoWagerModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<any>(null);

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
      // Fetch user profiles for all wager participants (same as WagerFi)
      const allAddresses: string[] = [];
      data.forEach((wager: any) => {
        if (wager.creator_address) allAddresses.push(wager.creator_address);
        if (wager.acceptor_address) allAddresses.push(wager.acceptor_address);
      });
      
      // Remove duplicates
      const uniqueAddresses = [...new Set(allAddresses.filter(addr => addr))];
      
      // Fetch profiles
      const profilesMap: Record<string, { username: string; profile_image_url: string } | null> = {};
      if (uniqueAddresses.length > 0) {
        const { data: profiles } = await supabase
          .from('users')
          .select('wallet_address, username, profile_image_url')
          .in('wallet_address', uniqueAddresses);
        
        if (profiles) {
          profiles.forEach((profile: any) => {
            profilesMap[profile.wallet_address] = profile;
          });
        }
      }
      
      // Attach profiles to wagers
      const wagersWithProfiles = data.map((wager: any) => ({
        ...wager,
        creator_profile: profilesMap[wager.creator_address] || null,
        acceptor_profile: profilesMap[wager.acceptor_address] || null,
      }));
      
      if (viewMode === 'crypto') {
        setCryptoWagers(wagersWithProfiles as CryptoWager[]);
      } else {
        setSportsWagers(wagersWithProfiles as SportsWager[]);
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

  // Handlers for wager creation modals
  const openCreateWagerModal = () => {
    if (!connected) {
      alert('Please connect your wallet to create a wager');
      return;
    }
    
    if (viewMode === 'crypto') {
      setIsTokensModalOpen(true);
    } else if (viewMode === 'sports') {
      setIsGamesModalOpen(true);
    }
  };

  const closeGamesModal = () => {
    setIsGamesModalOpen(false);
  };

  const closeTokensModal = () => {
    setIsTokensModalOpen(false);
  };

  const handleGameSelected = (game: any) => {
    setSelectedGame(game);
    setIsGamesModalOpen(false);
    setIsSportsWagerModalOpen(true);
  };

  const handleTokenSelected = (token: any) => {
    setSelectedToken(token);
    setIsTokensModalOpen(false);
    setIsCryptoWagerModalOpen(true);
  };

  const handleWagerCreated = () => {
    // Refresh wagers after creation
    fetchWagers();
    setIsSportsWagerModalOpen(false);
    setIsCryptoWagerModalOpen(false);
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
        className="absolute top-0 left-0 right-0 z-50 p-2 md:p-3"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div 
              className="relative inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg cursor-pointer"
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
            onClick={() => {
              if (connected) {
                console.log('🔌 Disconnect button clicked!');
                disconnect();
              } else {
                console.log('🔘 Connect button clicked!', { connecting, connected });
                connect();
              }
            }}
            disabled={connecting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium flex items-center gap-1 md:gap-2"
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
            {connected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
            <span className="hidden sm:inline">
              {connecting ? 'Connecting...' : connected ? formatAddress(walletAddress!) : 'Connect Wallet'}
            </span>
            <span className="sm:hidden">
              {connecting ? 'Connecting...' : connected ? formatAddress(walletAddress!) : 'Connect'}
            </span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 pt-20 md:pt-20 max-w-[1800px] mx-auto px-2 md:px-4">
        {/* Header & View Mode Tabs */}
        <div className="mb-2 md:mb-2">
          {/* Combined Row: Title, Count, View Mode Tabs & Wager Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
            {/* Left: Title, Counter & View Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
              {/* Title and Counter */}
              <div className="flex items-baseline gap-2 md:gap-3 min-w-fit">
                <h2 className="text-base md:text-xl font-bold text-[#2d2d2d] whitespace-nowrap" style={{ fontFamily: 'Varien, sans-serif' }}>
                  {viewMode === 'trending' ? 'Trending Markets' : 
                   viewMode === 'profitable' ? 'Most Profitable' : 
                   viewMode === 'all' ? 'All Markets' :
                   viewMode === 'crypto' ? 'Crypto Wagers' :
                   'Sports Wagers'}
                </h2>
                <p className="text-gray-500 text-[10px] md:text-xs whitespace-nowrap">
                  {isWagerMode 
                    ? `${displayWagers.length} of ${totalItems}`
                    : `${displayMarkets.length} of ${totalItems}`
                  }
                </p>
              </div>

              {/* View Mode Tabs */}
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                <motion.button
                onClick={() => setViewMode('trending')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  viewMode === 'trending'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                🔥 TRENDING
              </motion.button>
              <motion.button
                onClick={() => setViewMode('profitable')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  viewMode === 'profitable'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                💰 PROFITABLE
              </motion.button>
              <motion.button
                onClick={() => setViewMode('all')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  viewMode === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
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
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  viewMode === 'crypto'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
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
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  viewMode === 'sports'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                🏆 SPORTS
              </motion.button>
              </div>
            </div>

            {/* Right: Wager Filters & Search - Only show when viewing wagers */}
            {isWagerMode && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Bar */}
                <div className="relative w-full sm:w-40">
                  <div className="relative">
                    {/* Animated border */}
                    {isSearchFocused && (
                      <div className="absolute pointer-events-none" style={{ inset: '-2px', borderRadius: '10px', overflow: 'hidden' }}>
                        <style jsx>{`
                          @keyframes border-spin {
                            0% {
                              background-position: 0% 0%;
                            }
                            100% {
                              background-position: 200% 0%;
                            }
                          }
                          .animated-border {
                            animation: border-spin 2s linear infinite;
                            background: linear-gradient(
                              90deg,
                              #ff006e 0%,
                              #fb5607 12.5%,
                              #ffbe0b 25%,
                              #8338ec 37.5%,
                              #3a86ff 50%,
                              #06ffa5 62.5%,
                              #ff006e 75%,
                              #fb5607 87.5%,
                              #ffbe0b 100%
                            );
                            background-size: 200% 100%;
                          }
                        `}</style>
                        <div className="animated-border absolute inset-0" />
                        <div style={{ position: 'absolute', inset: '2px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.8)' }} />
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder={viewMode === 'crypto' ? 'Search token...' : 'Search team...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="relative w-full px-3 md:px-4 py-1.5 md:py-2 pl-8 md:pl-9 rounded-lg text-[10px] md:text-xs text-black placeholder:text-gray-400 bg-white/80 border border-gray-300 focus:border-transparent outline-none transition-all"
                    />
                    <svg 
                      className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 md:w-3.5 h-3 md:h-3.5 text-gray-400 pointer-events-none z-10"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-1.5 md:gap-2 overflow-x-auto">
                  {(['all', 'open', 'live', 'settled'] as const).map((filter) => (
                    <motion.button
                      key={filter}
                      onClick={() => setWagerFilter(filter)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase transition-all whitespace-nowrap ${
                        wagerFilter === filter
                          ? 'bg-[#2d2d2d] text-white shadow-md'
                          : 'bg-white/60 text-gray-600 hover:bg-white'
                      }`}
                    >
                      {filter}
                    </motion.button>
                  ))}
                  
                  {/* Create Wager Button - Desktop */}
                  <motion.button
                    onClick={openCreateWagerModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden sm:flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap text-white shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
                      fontFamily: 'Varien, sans-serif'
                    }}
                  >
                    <Zap size={14} className="md:w-4 md:h-4" />
                    <span>Create Wager</span>
                  </motion.button>
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
            height: 'calc(100vh - 180px)',
            minHeight: '400px'
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
            @media (min-width: 768px) {
              .custom-scrollbar-hidden {
                height: calc(100vh - 240px);
                min-height: 500px;
              }
            }
          `}</style>
          {/* Markets/Wagers Grid - Tighter spacing for compact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-3 px-2 md:px-4 py-2">
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
              >
                Scroll for more...
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Docs Button - Bottom Left */}
      <motion.div
        className="absolute bottom-3 md:bottom-6 left-3 md:left-6 z-10"
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
          className="relative px-3 md:px-4 py-0.5 md:py-1 text-white font-light text-[10px] md:text-xs tracking-wide cursor-pointer select-none"
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
      <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 flex gap-2 md:gap-3 z-10">
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
            className="relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-white text-xs md:text-sm cursor-pointer select-none"
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
            className="relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-white cursor-pointer select-none"
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
            <svg className="relative z-10 w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </motion.button>
        </motion.div>
      </div>

      {/* Create Wager Button - Mobile Only */}
      {isWagerMode && (
        <div className="sm:hidden fixed bottom-4 left-0 right-0 z-50 p-3 bg-gradient-to-t from-gray-100 via-gray-50/95 to-transparent">
          <motion.button
            onClick={openCreateWagerModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
              fontFamily: 'Varien, sans-serif',
              boxShadow: '0 4px 20px rgba(6, 255, 165, 0.3)'
            }}
          >
            <Zap size={20} />
            <span>Create Wager</span>
          </motion.button>
        </div>
      )}

      {/* Wager Creation Modals */}
      <UpcomingGamesPanelModal
        isOpen={isGamesModalOpen}
        onClose={closeGamesModal}
        onCreateWager={handleGameSelected}
        onWagerCreated={handleWagerCreated}
      />
      
      <TopCryptoTokensPanelModal
        isOpen={isTokensModalOpen}
        onClose={closeTokensModal}
        onCreateWager={handleTokenSelected}
        onWagerCreated={handleWagerCreated}
      />
      
      <SportsWagerModal 
        isOpen={isSportsWagerModalOpen}
        onClose={() => setIsSportsWagerModalOpen(false)}
        game={selectedGame}
        onWagerCreated={handleWagerCreated}
      />
      
      <CryptoWagerModal 
        isOpen={isCryptoWagerModalOpen}
        onClose={() => setIsCryptoWagerModalOpen(false)}
        token={selectedToken}
        onWagerCreated={handleWagerCreated}
      />
    </div>
  );
}
