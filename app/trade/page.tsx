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
  FileText
} from 'lucide-react';

// Helper function to format wallet address
function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Sidebar Social Links Component
function SidebarSocialLinks() {
  const [isDocsHovered, setIsDocsHovered] = useState(false);
  const [isXHovered, setIsXHovered] = useState(false);
  const [isTelegramHovered, setIsTelegramHovered] = useState(false);

  return (
    <div className="flex items-center justify-center gap-1.5">
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
          className="relative h-7 px-2.5 flex items-center justify-center text-white font-light text-[10px] tracking-wide cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'Varien, sans-serif'
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
              borderRadius: '10px',
              padding: '2px',
              background: `radial-gradient(60px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
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

      {/* X (Twitter) Button */}
      <motion.div
        className="relative"
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
          className="relative w-7 h-7 flex items-center justify-center text-white cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open('https://x.com/wagerfi', '_blank')}
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
              background: `radial-gradient(60px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude'
            }}
            animate={{ opacity: isXHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
          <svg className="relative z-10 w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </motion.button>
      </motion.div>

      {/* Telegram Button */}
      <motion.div
        className="relative"
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
          className="relative w-7 h-7 flex items-center justify-center text-white cursor-pointer select-none"
          style={{ 
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open('https://t.me/wagerfi', '_blank')}
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
              background: `radial-gradient(60px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
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
  );
}

export default function TradePage() {
  const router = useRouter();
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [tradeMode, setTradeMode] = useState<'single' | 'batch'>('single');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { walletAddress, connected, connecting, connect, disconnect, solBalance, wagerBalance } = useWallet();
  const { markets, trending, profitable, searchResults, loading: marketsLoading, searching, searchMarkets } = useMarkets();
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

  // Predictions page state (for the simple predictions content)
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [marketType, setMarketType] = useState<'predictions' | 'sports' | 'crypto'>('predictions');
  const [mounted, setMounted] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const ITEMS_PER_LOAD = 50;

  // Computed values for predictions content
  const predictionsLoading = marketsLoading || wagersLoading || searching;
  const error = null; // We'll handle errors in individual components

  // Get unique categories from real market data
  const categories: string[] = [
    'All',
    ...Array.from(new Set(
      markets
        .map(m => m.category)
        .filter((cat): cat is string => typeof cat === 'string' && cat.length > 0)
    ))
  ];

  // Filter markets by selected category and search
  // If user is searching, use API search results; otherwise use category filtering
  const filteredMarkets = searchQuery.trim().length > 0
    ? searchResults // Use Polymarket API search results
    : (selectedCategory === 'All'
        ? trending.slice(0, 100)
        : markets.filter(m => m.category === selectedCategory).slice(0, 100));

  // Filter wagers by search
  const filteredCryptoWagers = cryptoWagers.filter(w =>
    searchQuery.length === 0 ||
    w.token_symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSportsWagers = sportsWagers.filter(w =>
    searchQuery.length === 0 ||
    w.team1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.team2?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug logging
  console.log(`🎯 Wager counts - Crypto: ${cryptoWagers.length}, Sports: ${sportsWagers.length}, Filtered Crypto: ${filteredCryptoWagers.length}, Filtered Sports: ${filteredSportsWagers.length}`);

  // Calculate if we have any content to display
  const hasContent =
    (marketType === 'predictions' ? filteredMarkets.length > 0 : false) ||
    (marketType === 'crypto' ? filteredCryptoWagers.length > 0 : false) ||
    (marketType === 'sports' ? filteredSportsWagers.length > 0 : false);

  // Mount effect for predictions content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset displayed count when view mode changes
  useEffect(() => {
    setDisplayedCount(50);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [marketType, wagerFilter, debouncedSearchQuery]);

  // Debounce search query and trigger Polymarket API search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Trigger Polymarket search for predictions
      if (searchQuery.trim().length > 0 && marketType === 'predictions') {
        searchMarkets(searchQuery.trim());
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, marketType, searchMarkets]);

  // Fetch wagers on mount and filter changes
  useEffect(() => {
    if (marketType === 'crypto' || marketType === 'sports') {
      fetchWagers();
    }
  }, [marketType, wagerFilter, debouncedSearchQuery]);

  // Initial fetch of all wagers on component mount
  useEffect(() => {
    const fetchAllWagers = async () => {
      console.log('🚀 Starting initial wager fetch...');
      
      // Fetch crypto wagers with proper filtering (like main WagerFi app)
      let cryptoQuery = supabase
        .from('crypto_wagers')
        .select('*')
        .neq('status', 'cancelled')
        .neq('status', 'expired')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data: cryptoData, error: cryptoError } = await cryptoQuery;
      console.log('📊 Crypto wagers fetched:', { data: cryptoData, error: cryptoError, count: cryptoData?.length || 0 });

      if (cryptoData) {
        setCryptoWagers(cryptoData as any[]);
      }

      // Fetch sports wagers with proper filtering (like main WagerFi app)
      let sportsQuery = supabase
        .from('sports_wagers')
        .select('*')
        .neq('status', 'cancelled')
        .neq('status', 'expired')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data: sportsData, error: sportsError } = await sportsQuery;
      console.log('📊 Sports wagers fetched:', { data: sportsData, error: sportsError, count: sportsData?.length || 0 });

      if (sportsData) {
        setSportsWagers(sportsData as any[]);
      }

      console.log(`🚀 Initial wager fetch complete - Crypto: ${cryptoData?.length || 0}, Sports: ${sportsData?.length || 0}`);
    };

    fetchAllWagers();
  }, []); // Run only once on mount

  // Real-time subscription for ALL wager updates (always active)
  useEffect(() => {
    // Set up real-time subscriptions for both crypto and sports wagers
    const cryptoSubscription = supabase
      .channel('crypto-wagers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_wagers'
        },
        async (payload) => {
          console.log('🔄 Crypto wager real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newWager = payload.new as any;
            setCryptoWagers(prev => [newWager, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedWager = payload.new as any;
            setCryptoWagers(prev => prev.map(w => 
              w.id === updatedWager.id ? updatedWager : w
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setCryptoWagers(prev => prev.filter(w => w.id !== deletedId));
          }
        }
      )
      .subscribe();

    const sportsSubscription = supabase
      .channel('sports-wagers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sports_wagers'
        },
        async (payload) => {
          console.log('🔄 Sports wager real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newWager = payload.new as any;
            setSportsWagers(prev => [newWager, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedWager = payload.new as any;
            setSportsWagers(prev => prev.map(w => 
              w.id === updatedWager.id ? updatedWager : w
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setSportsWagers(prev => prev.filter(w => w.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up wager real-time subscriptions');
      cryptoSubscription.unsubscribe();
      sportsSubscription.unsubscribe();
    };
  }, []); // Always active, no dependencies


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
    
    const tableName = marketType === 'crypto' ? 'crypto_wagers' : 'sports_wagers';
    console.log(`🔍 Fetching wagers from ${tableName} for marketType: ${marketType}`);
    
    let query = supabase
      .from(tableName)
      .select('*');

    // Apply status filter (matching main WagerFi app logic)
    if (wagerFilter === 'open') {
      query = query.eq('status', 'open');
    } else if (wagerFilter === 'live') {
      if (marketType === 'crypto') {
        query = query.eq('status', 'active'); // Crypto uses 'active' for live
      } else {
        query = query.eq('status', 'live'); // Sports uses 'live'
      }
    } else if (wagerFilter === 'settled') {
      query = query.in('status', ['resolved', 'settled', 'expired']);
    }
    // 'all' = no status filter but still exclude cancelled

    // Always exclude cancelled wagers (like main WagerFi app)
    query = query.neq('status', 'cancelled');

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      if (marketType === 'crypto') {
        // Search in token_symbol for crypto wagers
        query = query.ilike('token_symbol', `%${debouncedSearchQuery}%`);
      } else {
        // Search in team names for sports wagers (need to check actual field names)
        query = query.or(`team1.ilike.%${debouncedSearchQuery}%,team2.ilike.%${debouncedSearchQuery}%`);
      }
    }

    // Order and fetch
    query = query
      .order('created_at', { ascending: false })
      .limit(500);

    const { data, error } = await query;
    
    console.log(`📊 Query result for ${tableName}:`, { data, error, count: data?.length || 0 });
    
    if (data) {
      if (marketType === 'crypto') {
        setCryptoWagers(data as CryptoWager[]);
      } else {
        setSportsWagers(data as SportsWager[]);
      }
    }
    
    setWagersLoading(false);
  }

  // Get full list based on market type
  const fullMarkets = markets; // Always use all markets since we filter by marketType
  
  const fullWagers = marketType === 'crypto' ? cryptoWagers : sportsWagers;
  const isWagerMode = marketType === 'crypto' || marketType === 'sports';
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
    
    if (marketType === 'crypto') {
      setIsTokensModalOpen(true);
    } else if (marketType === 'sports') {
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

  // Sidebar menu items
  const menuItems = [
    { label: 'MARKETS', href: '/trade', badge: markets.length, active: true },
    { label: 'ANALYTICS', href: '#', badge: null },
    { label: 'PORTFOLIO', href: '#', badge: null },
    { label: 'LEADERBOARD', href: '#', badge: null },
    { label: 'ACTIVITY', href: '#', badge: 12 },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>
      {/* Grid pattern background */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-screen z-50 flex flex-col"
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(42, 42, 42, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* WagerFi Onyx Pro Logo Section - Fits Perfectly */}
          <Link href="/">
          <div className="p-4 border-b border-gray-800/50">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
            <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer w-full justify-center"
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
                      borderRadius: '8px',
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
                  <span className="relative z-10 text-sm tracking-tight select-none uppercase flex items-center gap-1.5" style={{ fontFamily: 'Varien, sans-serif' }}>
                <span className="font-light text-white">WAGERFI</span>
                    <span className="w-0.5 h-3 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
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
                    className="relative z-10 bg-white text-[#2a2a2a] text-[10px] font-extrabold px-1.5 py-0.5 rounded"
              >
                PRO
              </span>
            </motion.div>
              )}
              {sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  }}
                >
                  <Zap className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </Link>

        {/* Wallet Stats & Connect Button */}
        <div className="px-3 pt-4 pb-3 space-y-2">
          {/* $WAGER Balance */}
          {connected && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <span className="text-xs font-light text-gray-400">$WAGER</span>
                <span className="text-xs font-medium text-white">
                  {wagerBalance ? wagerBalance.toLocaleString() : '0'}
                </span>
              </div>
            </motion.div>
          )}

          {/* SOL Balance */}
          {connected && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <span className="text-xs font-light text-gray-400">SOL</span>
                <span className="text-xs font-medium text-white">
                  {solBalance !== null ? solBalance.toFixed(4) : '0.0000'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Connect Wallet Button */}
            <motion.div
              className="relative"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
          >
            {/* Iridescent hover border */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                top: '-1px',
                left: '-1px',
                right: '-1px',
                bottom: '-1px',
                borderRadius: '6px',
                    padding: '2px',
                background: `radial-gradient(150px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                  }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
            
            <motion.button
              onClick={() => {
                if (connected) {
                  disconnect();
                } else {
                  connect();
                }
              }}
              disabled={connecting}
              className="relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-all"
              style={{
                background: connected
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
                  : 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                border: connected
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {connected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
              <span className="text-xs font-light text-white">
                {connecting ? 'Connecting...' : connected ? formatAddress(walletAddress!) : 'Connect Wallet'}
              </span>
              {!connected && <Wallet className="w-3 h-3 text-gray-400" />}
            </motion.button>
          </motion.div>
          </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto border-t border-white/10">
          <div className="space-y-1">
            {menuItems.map((item) => (
        <motion.div 
                  key={item.label}
                  className="relative"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                  }}
                  onMouseEnter={() => setHoveredMenuItem(item.label)}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                >
                  {/* Iridescent hover border - only on hover */}
                  <motion.div
                    className="absolute pointer-events-none"
            style={{
                      top: '-1px',
                      left: '-1px',
                      right: '-1px',
                      bottom: '-1px',
                      borderRadius: '6px',
                      padding: '2px',
                      background: `radial-gradient(150px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                    }}
                    animate={{ opacity: hoveredMenuItem === item.label ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  
              <motion.button
                    onClick={() => item.href !== '#' && router.push(item.href)}
                    className="relative w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded transition-all group"
                style={{
                      background: item.active 
                        ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))' 
                        : 'linear-gradient(135deg, rgba(45, 45, 45, 0.5), rgba(30, 30, 30, 0.5))',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`text-xs font-light tracking-wide ${item.active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {item.badge && !sidebarCollapsed && (
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
              </motion.button>
                </motion.div>
              ))}
          </div>
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="m-3 p-2 rounded-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.5), rgba(30, 30, 30, 0.5))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.div>
        </button>

        {/* Social Links - Docs, X, Telegram - Below Collapse Button */}
        <div className="px-3 pb-3">
          <SidebarSocialLinks />
                      </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div
        className="flex-1 relative h-screen overflow-hidden"
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
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


      {/* Markets Content - Full Height */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Market Type Tabs - Fixed at top */}
        <div className="flex-shrink-0 px-4 pt-3 pb-0">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs on the left */}
            <div className="flex items-center gap-2">
              {[
                { value: 'predictions', label: 'Polymarket' },
                { value: 'sports', label: 'Sports Wagers' },
                { value: 'crypto', label: 'Crypto Wagers' },
              ].map((type) => (
                <motion.button
                  key={type.value}
                  onClick={() => setMarketType(type.value as any)}
                  className="relative px-4 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap"
                  style={{
                    background: marketType === type.value
                      ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))'
                      : 'transparent',
                    border: marketType === type.value
                      ? '1px solid rgba(255, 255, 255, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    color: marketType === type.value ? '#fff' : '#9ca3af',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>

            {/* Search box on the right */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="relative flex items-center">
                {/* Search Icon */}
                <svg
                  className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search markets..."
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

                {/* Loading spinner or Clear button */}
                {searching ? (
                  <motion.div
                    className="absolute right-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg
                      className="w-4 h-4 text-purple-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </motion.div>
                ) : searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* Category Filters - Only for predictions */}
          {marketType === 'predictions' && (
            <div className="mb-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-4 py-1 rounded-lg font-medium text-xs transition-all whitespace-nowrap"
                    style={{
                      background: selectedCategory === cat
                        ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))'
                        : 'transparent',
                      border: selectedCategory === cat
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      color: selectedCategory === cat ? '#fff' : '#9ca3af',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Content Grid */}
          <div className="relative">
          {(predictionsLoading || wagersLoading) ? (
            <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-red-400 mb-4">Failed to load markets</p>
              <p className="text-gray-500 text-sm">{error}</p>
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
                <WagerMarketCard
                  key={`crypto-${wager.id}`}
                  wager={wager}
                  index={filteredMarkets.length + index}
                />
              ))}

              {/* Render Sports Wagers */}
              {marketType === 'sports' && filteredSportsWagers.map((wager, index) => (
                <WagerMarketCard
                  key={`sports-${wager.id}`}
                  wager={wager}
                  index={filteredMarkets.length + filteredCryptoWagers.length + index}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
      </motion.div>

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
