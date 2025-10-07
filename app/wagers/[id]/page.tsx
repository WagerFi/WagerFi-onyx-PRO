'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useWallet } from '@/lib/hooks/useWallet';
import type { CryptoWager, SportsWager } from '@/lib/supabase/types';

export default function WagerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const wagerId = params.id as string;
  
  const { walletAddress, connected, connecting, connect, disconnect } = useWallet();
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [wager, setWager] = useState<CryptoWager | SportsWager | null>(null);
  const [loading, setLoading] = useState(true);

  // Format address helper
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Fetch wager details
  useEffect(() => {
    const fetchWager = async () => {
      setLoading(true);
      
      // Try crypto wagers first
      const { data: cryptoWager, error: cryptoError } = await supabase
        .from('crypto_wagers')
        .select('*')
        .eq('id', wagerId)
        .single();

      if (cryptoWager && !cryptoError) {
        setWager(cryptoWager as CryptoWager);
        setLoading(false);
        return;
      }

      // Try sports wagers
      const { data: sportsWager, error: sportsError } = await supabase
        .from('sports_wagers')
        .select('*')
        .eq('id', wagerId)
        .single();

      if (sportsWager && !sportsError) {
        setWager(sportsWager as SportsWager);
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    if (wagerId) {
      fetchWager();
    }
  }, [wagerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!wager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Wager Not Found</h1>
          <Link href="/trade" className="text-blue-600 hover:underline">
            ← Back to Trade
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
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 md:px-6 pb-16">
        {/* Back Button */}
        <Link href="/trade">
          <motion.button
            className="mb-6 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.37)',
              fontFamily: 'Varien, sans-serif'
            }}
            whileHover={{ scale: 1.02, x: -4 }}
          >
            ← Back to Trade
          </motion.button>
        </Link>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Wager Header */}
            <motion.div
              className="p-6 rounded-xl relative overflow-hidden"
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
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'Varien, sans-serif'
                    }}
                  >
                    {'token_symbol' in wager ? `CRYPTO WAGER • ${wager.token_symbol}` : 'SPORTS WAGER'}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-6 leading-tight" 
                  style={{ fontFamily: 'Varien, sans-serif' }}
                >
                  {'token_symbol' in wager 
                    ? `${wager.token_symbol} Price Prediction`
                    : 'home_team' in wager 
                      ? `${wager.home_team} vs ${'away_team' in wager ? wager.away_team : 'TBD'}`
                      : 'Sports Match'}
                </h1>

                {/* Wager Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Varien, sans-serif' }}>Status</div>
                  <div className="text-lg font-bold text-white" style={{ fontFamily: 'Varien, sans-serif' }}>
                    {wager.status.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Varien, sans-serif' }}>Amount</div>
                  <div className="text-lg font-bold text-white" style={{ fontFamily: 'Varien, sans-serif' }}>
                    {wager.wager_amount} SOL
                  </div>
                </div>
                {'target_price' in wager && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Varien, sans-serif' }}>Target Price</div>
                    <div className="text-lg font-bold text-white" style={{ fontFamily: 'Varien, sans-serif' }}>
                      ${wager.target_price}
                    </div>
                  </div>
                )}
                {'prediction' in wager && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Varien, sans-serif' }}>Prediction</div>
                    <div className="text-lg font-bold text-white" style={{ fontFamily: 'Varien, sans-serif' }}>
                      {wager.prediction.toUpperCase()}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </motion.div>

            {/* Additional Details Section */}
            <motion.div
              className="p-6 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Wager Information
                </h2>
                <div className="space-y-3 text-sm text-gray-400" style={{ fontFamily: 'Varien, sans-serif' }}>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium text-white">
                      {new Date(wager.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="font-medium text-white">
                      {new Date(wager.expires_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creator:</span>
                    <span className="font-medium text-white">
                      {formatAddress(wager.creator_address)}
                    </span>
                  </div>
                  {wager.acceptor_address && (
                    <div className="flex justify-between">
                      <span>Acceptor:</span>
                      <span className="font-medium text-white">
                        {formatAddress(wager.acceptor_address)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Actions */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              className="p-6 rounded-xl sticky top-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
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
                <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Varien, sans-serif' }}>
                  Actions
                </h2>
                
                {wager.status === 'open' && !wager.acceptor_address && (
                  <motion.button
                    className="w-full px-4 py-3 rounded-lg text-white font-bold mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
                      fontFamily: 'Varien, sans-serif'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Accept Wager
                  </motion.button>
                )}

                <motion.button
                  className="w-full px-4 py-3 rounded-lg text-white font-bold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontFamily: 'Varien, sans-serif'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/trade')}
                >
                  View More Wagers
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

