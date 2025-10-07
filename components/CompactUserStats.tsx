'use client';

import { useWallet } from '@/lib/hooks/useWallet';

interface CompactUserStatsProps {
  className?: string;
}

export function CompactUserStats({ className = '' }: CompactUserStatsProps) {
  const { connected, solBalance, wagerBalance } = useWallet();

  if (!connected) {
    return null;
  }

  // Solana logo SVG component
  const SolanaLogo = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 397.7 311.7" fill="currentColor">
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
    </svg>
  );

  return (
    <div className={`hidden sm:flex items-center gap-2 lg:gap-3 text-sm ${className}`}>
      {/* $WAGER Balance */}
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded shadow-lg" 
        title="$WAGER Balance"
        style={{
          background: 'rgba(30, 30, 30, 1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span className="text-gray-100 font-bold">{wagerBalance ? wagerBalance.toLocaleString() : '0'}</span>
        <span className="text-green-400 font-bold text-sm">$WAGER</span>
      </div>

      {/* Divider after $WAGER Balance */}
      <div className="w-px h-4 bg-slate-600"></div>

      {/* SOL Balance */}
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded shadow-lg" 
        title="SOL Balance"
        style={{
          background: 'rgba(30, 30, 30, 1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span className="text-gray-100 font-bold">{solBalance !== null ? solBalance.toFixed(4) : '0.0000'}</span>
        <SolanaLogo className="w-4 h-4 text-purple-400 drop-shadow-sm" />
      </div>
    </div>
  );
}

