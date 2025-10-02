'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMarket } from '@/lib/hooks/useMarkets';
import { useOrderBook } from '@/lib/hooks/useOrderBook';
import { useWallet } from '@/lib/hooks/useWallet';
import { OrderBook } from '@/components/OrderBook';
import { TradePanel } from '@/components/TradePanel';
import type { Market } from '@/lib/polymarket/types';

export default function MarketPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  
  console.log('📄 Market page loaded, ID:', marketId);
  
  const { market, loading: marketLoading } = useMarket(marketId);
  const { orderBook, loading: orderBookLoading } = useOrderBook(
    market?.tokens?.[0]?.token_id || null
  );
  const { walletAddress, connected, connect } = useWallet();

  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [isNavHovered, setIsNavHovered] = useState(false);

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}k`;
    return `$${vol.toFixed(0)}`;
  };

  // Get market data
  const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : (market?.tokens?.map(t => t.outcome) || ['Yes', 'No']);
  const prices = market?.tokens?.map(t => parseFloat(t.price || '0.5')) || [0.5, 0.5];
  const volume24h = parseFloat(market?.volume_24hr || market?.volume24hr || '0');
  const totalVolume = parseFloat(market?.volume || '0');
  const liquidity = parseFloat(market?.liquidity || '0');

  if (marketLoading) {
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

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Market Not Found</h1>
          <Link href="/trade" className="text-blue-600 hover:underline">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
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
        className="relative z-50 p-6"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <Link href="/trade">
            <motion.div 
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(30, 30, 30, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
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
              whileHover={{ scale: 1.02 }}
            >
              {/* Iridescent hover border */}
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

              <span className="relative z-10 text-xl tracking-tight select-none" style={{ fontFamily: 'Surgena, sans-serif' }}>
                <span 
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  onyx
                </span>
                <span className="font-light text-white">.market</span>
              </span>
              <span 
                className="relative z-10 bg-white text-[#2a2a2a] text-sm font-extrabold px-2 py-0.5 rounded-md"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                PRO
              </span>
            </motion.div>
          </Link>

          {/* Wallet Connection */}
          <motion.button
            onClick={connect}
            disabled={connected}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{
              background: connected 
                ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.2), rgba(58, 134, 255, 0.2))'
                : 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            {connected ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </>
            ) : (
              'Connect MetaMask'
            )}
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-6 pb-16">
        {/* Back Button */}
        <Link href="/trade">
          <motion.button
            className="mb-6 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ scale: 1.02, x: -4 }}
          >
            ← Back to Markets
          </motion.button>
        </Link>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Market Info & Stats */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Market Header */}
            <motion.div
              className="p-6 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(30, 30, 30, 0.98))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {market.category && (
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    {market.category}
                  </span>
                </div>
              )}

              <h1 className="text-3xl font-bold text-white mb-6 leading-tight" 
                style={{ fontFamily: 'Surgena, sans-serif' }}
              >
                {market.question}
              </h1>

              {market.description && (
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {market.description}
                </p>
              )}

              {/* Outcome Probabilities */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {outcomes.map((outcome, idx) => {
                  const price = prices[idx] || 0.5;
                  const percentage = (price * 100).toFixed(1);
                  
                  return (
                    <motion.div
                      key={idx}
                      className="relative p-4 rounded-xl cursor-pointer"
                      style={{
                        background: idx === 0 
                          ? 'linear-gradient(135deg, rgba(6, 255, 165, 0.12), rgba(58, 134, 255, 0.12))'
                          : 'linear-gradient(135deg, rgba(255, 0, 110, 0.12), rgba(251, 86, 7, 0.12))',
                        border: `2px solid ${selectedOutcome === idx 
                          ? (idx === 0 ? 'rgba(6, 255, 165, 0.5)' : 'rgba(255, 0, 110, 0.5)')
                          : (idx === 0 ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)')}`,
                      }}
                      onClick={() => setSelectedOutcome(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wide">
                        {outcome}
                      </div>
                      <div className="text-4xl font-bold"
                        style={{
                          background: idx === 0 
                            ? 'linear-gradient(135deg, #06ffa5, #3a86ff)'
                            : 'linear-gradient(135deg, #ff006e, #fb5607)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}
                      >
                        {percentage}%
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800">
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">24h Volume</div>
                  <div className="text-xl text-white font-bold font-mono">{formatVolume(volume24h)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Volume</div>
                  <div className="text-xl text-white font-bold font-mono">{formatVolume(totalVolume)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Liquidity</div>
                  <div className="text-xl text-emerald-400 font-bold font-mono">{formatVolume(liquidity)}</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                {market.end_date_iso && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Market Closes</div>
                    <div className="text-sm text-white font-mono">
                      {new Date(market.end_date_iso).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
                {market.event_title && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Event</div>
                    <div className="text-sm text-white">{market.event_title}</div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Order Book */}
            <motion.div
              className="p-6 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(30, 30, 30, 0.98))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Surgena, sans-serif' }}>
                Order Book
              </h2>
              <OrderBook orderBook={orderBook} loading={orderBookLoading} />
            </motion.div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              className="sticky top-6 p-6 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(30, 30, 30, 0.98))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Surgena, sans-serif' }}>
                Place Trade
              </h2>
              <TradePanel
                market={market}
                isConnected={connected}
                onConnect={connect}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

