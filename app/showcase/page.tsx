'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PoliticalMarketCard } from '@/components/wagering/PoliticalMarketCard';
import { PredictionMarketCard } from '@/components/wagering/PredictionMarketCard';
import type { Market } from '@/lib/polymarket/types';
import { useRouter } from 'next/navigation';

export default function ShowcasePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Political market cards (styled like your images)
  const politicalMarkets = [
    {
      location: 'USA',
      title: 'Texas Presidential Vote',
      candidate1: {
        name: 'Donald Trump',
        party: 'Republican',
        percentage: 61.45,
        imageUrl: undefined, // You can add actual image URLs
      },
      candidate2: {
        name: 'Greg Newsman',
        party: 'Democrat',
        percentage: 38.55,
        imageUrl: undefined,
      },
      matchedAmount: '$1,200,055',
      change24h: '3.05',
      endDate: '2024-11-05T00:00:00Z',
    },
    {
      location: 'USA',
      title: 'Senate Control',
      candidate1: {
        name: 'Republican',
        party: 'GOP',
        percentage: 72.99,
        imageUrl: undefined,
      },
      candidate2: {
        name: 'Democratic',
        party: 'DEM',
        percentage: 27.01,
        imageUrl: undefined,
      },
      matchedAmount: '$3,450,000',
      change24h: '-1.23',
      endDate: '2024-11-05T00:00:00Z',
    },
    {
      location: 'USA',
      title: 'Presidential Election',
      candidate1: {
        name: 'Trump',
        party: 'Democrat',
        percentage: 66.67,
        imageUrl: undefined,
      },
      candidate2: {
        name: 'Newsman',
        party: 'Republican',
        percentage: 66.67,
        imageUrl: undefined,
      },
      matchedAmount: '$5,600,000',
      change24h: '0.45',
      endDate: '2024-11-05T00:00:00Z',
    },
    {
      location: 'USA',
      title: 'House Control',
      candidate1: {
        name: 'Republican',
        party: 'GOP',
        percentage: 55.23,
        imageUrl: undefined,
      },
      candidate2: {
        name: 'Democratic',
        party: 'DEM',
        percentage: 44.77,
        imageUrl: undefined,
      },
      matchedAmount: '$2,100,000',
      change24h: '2.15',
      endDate: '2024-11-05T00:00:00Z',
    },
    {
      location: 'USA',
      title: 'California Governor',
      candidate1: {
        name: 'Democratic',
        party: 'DEM',
        percentage: 78.45,
        imageUrl: undefined,
      },
      candidate2: {
        name: 'Republican',
        party: 'GOP',
        percentage: 21.55,
        imageUrl: undefined,
      },
      matchedAmount: '$890,000',
      change24h: '-0.87',
      endDate: '2024-11-05T00:00:00Z',
    },
    {
      location: 'USA',
      title: 'Florida Senate Race',
      candidate1: {
        name: 'Republican',
        party: 'GOP',
        percentage: 68.34,
        imageUrl: undefined,
      },
      candidate2: {
        name: 'Democratic',
        party: 'DEM',
        percentage: 31.66,
        imageUrl: undefined,
      },
      matchedAmount: '$1,450,000',
      change24h: '1.92',
      endDate: '2024-11-05T00:00:00Z',
    },
  ];

  // Generic prediction markets (alternative style)
  const genericMarkets: Market[] = [
    {
      id: '7',
      question: 'TECH | Bitcoin Price Prediction',
      description: 'Will Bitcoin reach $100,000 by end of 2024?',
      category: 'Crypto',
      outcomes: ['Yes', 'No'],
      outcome_prices: ['0.4234', '0.5766'],
      volume: '4200000',
      end_date_iso: '2024-12-31T23:59:59Z',
      active: true,
      closed: false,
      accepting_orders: true,
    },
    {
      id: '8',
      question: 'SPORTS | Super Bowl Winner',
      description: 'Who will win Super Bowl LIX?',
      category: 'Sports',
      outcomes: ['Chiefs', 'Other'],
      outcome_prices: ['0.3456', '0.6544'],
      volume: '2800000',
      end_date_iso: '2025-02-09T00:00:00Z',
      active: true,
      closed: false,
      accepting_orders: true,
    },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: '#0a0a0a' }}>
      {/* Grid pattern background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-24 pb-8 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="text-5xl font-bold text-white mb-3 tracking-tight"
            style={{ fontFamily: 'Varien, sans-serif' }}
          >
            Market Card Showcase
          </h1>
          <p className="text-gray-400 text-lg">
            Beautiful prediction market cards with real-time data visualization
          </p>
        </motion.div>
      </div>

      {/* Political Markets Section */}
      <div className="relative z-10 px-6 pb-12 max-w-7xl mx-auto">
        <motion.h2
          className="text-2xl font-bold text-white mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Political Markets
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {politicalMarkets.map((market, index) => (
            <PoliticalMarketCard
              key={index}
              {...market}
              index={index}
              onClick={() => console.log('Clicked:', market.title)}
            />
          ))}
        </div>
      </div>

      {/* Generic Markets Section */}
      <div className="relative z-10 px-6 pb-16 max-w-7xl mx-auto">
        <motion.h2
          className="text-2xl font-bold text-white mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Other Markets
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {genericMarkets.map((market, index) => (
            <PredictionMarketCard
              key={market.id}
              market={market}
              index={index + politicalMarkets.length}
              onClick={() => console.log('Clicked:', market.question)}
            />
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="relative z-10 px-6 pb-16 max-w-7xl mx-auto">
        <div className="rounded-2xl p-8 border border-purple-500/20" style={{ background: 'rgba(30, 27, 46, 0.6)' }}>
          <h3 className="text-xl font-bold text-white mb-4">Card Features</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong className="text-white">Real-time visualization:</strong> Historical chart showing odds movement over time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong className="text-white">Split design:</strong> Clear display of both outcomes with percentages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong className="text-white">Interactive elements:</strong> Hover effects, share functionality, and smooth animations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong className="text-white">Market stats:</strong> Matched volume, 24h price changes, and current percentages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong className="text-white">Dark theme:</strong> Professional look with purple/cyan gradients</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-8 left-8 right-8 z-20 flex justify-between">
        <motion.button
          className="px-6 py-3 rounded-xl font-medium text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.95), rgba(42, 36, 56, 0.95))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/trade')}
        >
          ← Back to Trade
        </motion.button>
        
        <motion.button
          className="px-6 py-3 rounded-xl font-medium text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(6, 182, 212, 0.95))',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            backdropFilter: 'blur(12px)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/trade')}
        >
          View All Markets →
        </motion.button>
      </div>
    </div>
  );
}

