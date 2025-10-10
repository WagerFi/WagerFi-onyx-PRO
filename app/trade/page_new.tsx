'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { useOrderBook } from '@/lib/hooks/useOrderBook';
import { MarketCard } from '@/components/MarketCard';
import { PredictionMarketCard } from '@/components/wagering/PredictionMarketCard';
import { PoliticalMarketCard } from '@/components/wagering/PoliticalMarketCard';
import { WagerMarketCard } from '@/components/wagering/WagerMarketCard';
import { StyledMarketCard } from '@/components/wagering/StyledMarketCard';
import { WagerCard } from '@/components/wagering/WagerCard';
import { OrderBook } from '@/components/OrderBook';
import { TradePanel } from '@/components/TradePanel';
import { BatchOrderPanel } from '@/components/BatchOrderPanel';
import { UpcomingGamesPanelModal } from '@/components/wagering/UpcomingGamesPanelModal';
import { TopCryptoTokensPanelModal } from '@/components/wagering/TopCryptoTokensPanelModal';
import { SportsWagerModal } from '@/components/wagering/SportsWagerModal';
import { CryptoWagerModal } from '@/components/wagering/CryptoWagerModal';
import { CompactUserStats } from '@/components/CompactUserStats';
import { supabase } from '@/lib/supabase/client';
import type { Market } from '@/lib/polymarket/types';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';
import { 
  Zap, 
  Home, 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  User, 
  Settings, 
  ChevronLeft,
  Activity,
  Trophy,
  FileText,
  Search
} from 'lucide-react';

// Helper function to format wallet address
function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Navbar Social Links Component
function SidebarSocialLinks() {
  const [isDocsHovered, setIsDocsHovered] = useState(false);
  const [isXHovered, setIsXHovered] = useState(false);
  const [isTelegramHovered, setIsTelegramHovered] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Docs Button */}
      <motion.div
        className="relative"
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
          className="relative h-8 px-3 flex items-center justify-center text-white font-bold text-xs tracking-wide cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          DOCS
        </motion.button>
      </motion.div>

      {/* X Button */}
      <motion.div
        className="relative"
        onMouseEnter={() => setIsXHovered(true)}
        onMouseLeave={() => setIsXHovered(false)}
      >
        <motion.button
          className="relative h-8 w-8 flex items-center justify-center text-white cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('https://x.com/wagerfi', '_blank')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </motion.button>
      </motion.div>

      {/* Telegram Button */}
      <motion.div
        className="relative"
        onMouseEnter={() => setIsTelegramHovered(true)}
        onMouseLeave={() => setIsTelegramHovered(false)}
      >
        <motion.button
          className="relative h-8 w-8 flex items-center justify-center text-white cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('https://t.me/wagerfi', '_blank')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function TradePage() {
  const router = useRouter();
  const { connected, connecting, connect, disconnect, walletAddress, solBalance, wagerBalance } = useWallet();
  
  // State management
  const [marketType, setMarketType] = useState<'predictions' | 'crypto' | 'sports'>('predictions');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [wagerFilter, setWagerFilter] = useState<'all' | 'open' | 'live' | 'settled'>('all');
  
  // Wager state
  const [cryptoWagers, setCryptoWagers] = useState<CryptoWager[]>([]);
  const [sportsWagers, setSportsWagers] = useState<SportsWager[]>([]);
  const [wagersLoading, setWagersLoading] = useState(false);
  
  // Market state
  const { markets, loading: predictionsLoading, error, searchMarkets } = useMarkets();
  
  // Categories for predictions
  const categories = ['All', 'Politics', 'Sports', 'Crypto', 'Business', 'Science'];
  const wagerFilters = ['all', 'open', 'live', 'settled'];
  
  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, marketType, searchMarkets]);

  // Fetch wagers function
  const fetchWagers = async () => {
    if (marketType !== 'crypto' && marketType !== 'sports') return;
    
    setWagersLoading(true);
    try {
      const table = marketType === 'crypto' ? 'crypto_wagers' : 'sports_wagers';
      let query = supabase
        .from(table)
        .select('*')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply status filter
      if (wagerFilter === 'open') {
        query = query.eq('status', 'open');
      } else if (wagerFilter === 'live') {
        if (marketType === 'crypto') {
          query = query.eq('status', 'active');
        } else {
          query = query.eq('status', 'live');
        }
      } else if (wagerFilter === 'settled') {
        query = query.in('status', ['resolved', 'settled', 'expired']);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching ${marketType} wagers:`, error);
        return;
      }

      if (marketType === 'crypto') {
        setCryptoWagers(data || []);
      } else {
        setSportsWagers(data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${marketType} wagers:`, error);
    } finally {
      setWagersLoading(false);
    }
  };

  // Fetch wagers on mount and filter changes
  useEffect(() => {
    if (marketType === 'crypto' || marketType === 'sports') {
      fetchWagers();
    }
  }, [marketType, wagerFilter, debouncedSearchQuery]);

  // Initial fetch of all wagers on component mount
  useEffect(() => {
    const fetchAllWagers = async () => {
      try {
        // Fetch crypto wagers
        const { data: cryptoData, error: cryptoError } = await supabase
          .from('crypto_wagers')
          .select('*')
          .neq('status', 'cancelled')
          .neq('status', 'expired')
          .order('created_at', { ascending: false })
          .limit(500);

        if (cryptoError) {
          console.error('Error fetching crypto wagers:', cryptoError);
        } else {
          setCryptoWagers(cryptoData || []);
        }

        // Fetch sports wagers
        const { data: sportsData, error: sportsError } = await supabase
          .from('sports_wagers')
          .select('*')
          .neq('status', 'cancelled')
          .neq('status', 'expired')
          .order('created_at', { ascending: false })
          .limit(500);

        if (sportsError) {
          console.error('Error fetching sports wagers:', sportsError);
        } else {
          setSportsWagers(sportsData || []);
        }
      } catch (error) {
        console.error('Error in fetchAllWagers:', error);
      }
    };

    fetchAllWagers();

    // Set up real-time subscriptions
    const cryptoSubscription = supabase
      .channel('crypto_wagers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crypto_wagers' },
        (payload) => {
          console.log('🔄 Crypto wager real-time update:', payload);
          fetchWagers();
        }
      )
      .subscribe();

    const sportsSubscription = supabase
      .channel('sports_wagers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sports_wagers' },
        (payload) => {
          console.log('🔄 Sports wager real-time update:', payload);
          fetchWagers();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up wager real-time subscriptions');
      cryptoSubscription.unsubscribe();
      sportsSubscription.unsubscribe();
    };
  }, []);

  // Filter markets based on category and search
  const filteredMarkets = markets.filter(market => {
    const matchesCategory = selectedCategory === 'All' || 
      (market.tags && market.tags.some((tag: string) => 
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      ));
    
    const matchesSearch = !debouncedSearchQuery || 
      market.question?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Filter wagers based on search
  const filteredCryptoWagers = cryptoWagers.filter(wager => {
    if (!debouncedSearchQuery) return true;
    return wager.token_symbol?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
  });

  const filteredSportsWagers = sportsWagers.filter(wager => {
    if (!debouncedSearchQuery) return true;
    return wager.team1?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
           wager.team2?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
           wager.sport?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
  });

  // Check if we have content to show
  const hasContent = marketType === 'predictions' 
    ? filteredMarkets.length > 0
    : marketType === 'crypto' 
      ? filteredCryptoWagers.length > 0
      : filteredSportsWagers.length > 0;

  const loading = marketType === 'predictions' ? predictionsLoading : wagersLoading;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Grid pattern background */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(42, 42, 42, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left Side - Logo */}
        <Link href="/">
          <div className="flex items-center gap-2">
            <span className="text-lg tracking-tight select-none uppercase flex items-center gap-2" style={{ fontFamily: 'Varien, sans-serif' }}>
              <span className="font-light text-white">WAGERFI</span>
              <span className="w-0.5 h-5 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
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
              className="bg-white text-[#2a2a2a] text-xs font-extrabold px-1.5 py-0.5 rounded"
            >
              PRO
            </span>
          </div>
        </Link>

        {/* Center - Navigation Menu */}
        <div className="flex items-center gap-4">
          <motion.button
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all"
            style={{ 
              fontFamily: 'Geist, sans-serif',
              background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            TRADE
          </motion.button>
          <motion.button
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-lg transition-all"
            style={{ 
              fontFamily: 'Geist, sans-serif',
              background: 'rgba(45, 45, 45, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: 'rgba(45, 45, 45, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            PORTFOLIO
          </motion.button>
          <motion.button
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-lg transition-all"
            style={{ 
              fontFamily: 'Geist, sans-serif',
              background: 'rgba(45, 45, 45, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: 'rgba(45, 45, 45, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            LEADERBOARD
          </motion.button>
          <motion.button
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-lg transition-all"
            style={{ 
              fontFamily: 'Geist, sans-serif',
              background: 'rgba(45, 45, 45, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: 'rgba(45, 45, 45, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            ACTIVITY
          </motion.button>
        </div>

        {/* Right Side - Wallet & Social */}
        <div className="flex items-center gap-4">
          <SidebarSocialLinks />
          
          {/* Wallet Section */}
          <div className="flex items-center gap-3">
            {/* SOL Balance */}
            {connected && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <img src="https://wagerfi-sportsapi.b-cdn.net/solwhite.png" alt="SOL" className="w-3 h-3" />
                <span className="text-white font-medium">
                  {solBalance !== null ? solBalance.toFixed(4) : '0.0000'}
                </span>
              </div>
            )}
            
            {/* Connect Wallet Button */}
            <motion.button
              onClick={() => {
                if (connected) {
                  disconnect();
                } else {
                  connect();
                }
              }}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{
                background: connected
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
                  : 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                border: connected
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {connected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
              <span className="text-xs font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>
                {connecting ? 'Connecting...' : connected ? formatAddress(walletAddress!) : 'Connect Wallet'}
              </span>
              {!connected && <Wallet className="w-3 h-3 text-gray-400" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area - Full Width */}
      <div className="pt-20 min-h-screen">
        {/* Base gradient background */}
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

        {/* Content Container */}
        <div className="relative z-10 px-4 pb-2 pt-3">
          {/* Market Type Tabs */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {['predictions', 'crypto', 'sports'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMarketType(type as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
                    marketType === type ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  style={{
                    background: marketType === type
                      ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))'
                      : 'transparent',
                    border: marketType === type ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  }}
                >
                  {type === 'predictions' ? 'Polymarket' : type === 'crypto' ? 'Crypto Wagers' : 'Sports Wagers'}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search markets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-64 pl-8 pr-4 py-2 rounded-lg text-xs text-white placeholder-gray-500 outline-none transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  border: isSearchFocused 
                    ? '1px solid rgba(139, 92, 246, 0.5)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              />
            </div>
          </div>

          {/* Category Filters - Only for predictions */}
          {marketType === 'predictions' && (
            <div className="mb-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
                      selectedCategory === category ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      background: selectedCategory === category
                        ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))'
                        : 'transparent',
                      border: selectedCategory === category ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wager Filters - Only for crypto and sports */}
          {(marketType === 'crypto' || marketType === 'sports') && (
            <div className="mb-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {wagerFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setWagerFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
                      wagerFilter === filter ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      background: wagerFilter === filter
                        ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))'
                        : 'transparent',
                      border: wagerFilter === filter ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading markets...</p>
            </div>
          ) : !hasContent ? (
            <div className="text-center py-24">
              <p className="text-gray-400">No markets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
              {/* Render Prediction Markets */}
              {marketType === 'predictions' && filteredMarkets.map((market, index) => {
                const marketId = market.conditionId || market.condition_id || market.id || market.slug;
                return (
                  <StyledMarketCard
                    key={`market-${marketId || index}`}
                    market={market}
                    index={index}
                    onClick={() => {
                      if (marketId) {
                        router.push(`/market/${marketId}`);
                      }
                    }}
                  />
                );
              })}

              {/* Render Crypto Wagers */}
              {marketType === 'crypto' && filteredCryptoWagers.map((wager, index) => (
                <WagerCard
                  key={`crypto-${wager.id}`}
                  wager={wager}
                  index={index}
                  userWalletAddress={walletAddress || undefined}
                  onAccept={(wagerId) => console.log('Accept crypto wager:', wagerId)}
                  onView={(wagerId) => console.log('View crypto wager:', wagerId)}
                />
              ))}

              {/* Render Sports Wagers */}
              {marketType === 'sports' && filteredSportsWagers.map((wager, index) => (
                <WagerCard
                  key={`sports-${wager.id}`}
                  wager={wager}
                  index={index}
                  userWalletAddress={walletAddress || undefined}
                  onAccept={(wagerId) => console.log('Accept sports wager:', wagerId)}
                  onView={(wagerId) => console.log('View sports wager:', wagerId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
