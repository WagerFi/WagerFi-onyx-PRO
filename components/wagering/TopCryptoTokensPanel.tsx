'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import globalWebSocketManager from '@/lib/hooks/useGlobalWebSocket';

export interface Token {
  id: number | string;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
    };
  };
  coingecko_id?: string;
  slug?: string;
  logo?: string;
}

export type { Token as CryptoToken };

interface TopCryptoTokensPanelProps {
  onCreateWager?: (token: Token) => void;
  onWagerCreated?: () => void;
}

export function TopCryptoTokensPanel({ onCreateWager, onWagerCreated }: TopCryptoTokensPanelProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceAnimations, setPriceAnimations] = useState<Map<number | string, {isAnimating: boolean; isUp: boolean}>>(new Map());

  // Fetch tokens from background worker via API proxy
  const fetchTokens = async () => {
      setIsLoading(true);
    setError(null);
    
    try {
      console.log('💰 Fetching crypto tokens from server...');
      
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 100 // Get top 100 tokens by market cap
        })
      });

      if (!response.ok) {
        throw new Error(`Background worker responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.data)) {
        // Filter out stablecoins
        const stablecoinSymbols = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'USDD', 'GUSD', 'FRAX'];
        const majorCryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'BCH', 'XRP', 'DOGE', 'SHIB'];
        
        const filteredTokens = data.data.filter((token: Token) => {
          const symbol = token.symbol.toUpperCase();
          
          // Always include major cryptos
          if (majorCryptoSymbols.includes(symbol)) {
            return true;
          }
          
          // Filter out stablecoins
          if (stablecoinSymbols.includes(symbol)) {
            return false;
          }
          
          // Filter out low volatility tokens (< 0.5% change)
          const hasVolatility = Math.abs(token.quote.USD.percent_change_24h) >= 0.5;
          
          return hasVolatility;
        });
        
        setTokens(filteredTokens);
        console.log(`✅ Successfully fetched ${filteredTokens.length} tokens`);
      } else {
        throw new Error('Invalid response format from background worker');
      }
    } catch (err) {
      console.error('❌ Error fetching crypto tokens:', err);
      setError('Failed to load tokens. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tokens on mount
  useEffect(() => {
    fetchTokens();
    
    // Auto-refresh every 30 seconds (as backup)
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to WebSocket for real-time price updates
  useEffect(() => {
    if (tokens.length === 0) return;

    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to each token for live price updates
    tokens.forEach((token) => {
      const tokenId = token.coingecko_id || token.slug || String(token.id);
      
      const unsubscribe = globalWebSocketManager.subscribe(tokenId, (update) => {
        setTokens((prevTokens) =>
          prevTokens.map((t) => {
            const tId = t.coingecko_id || t.slug || String(t.id);
            if (tId === tokenId) {
              const oldPrice = t.quote.USD.price;
              const newPrice = update.price;
              
              // Trigger price animation
              if (oldPrice > 0 && newPrice !== oldPrice) {
                setPriceAnimations((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(t.id, {
                    isAnimating: true,
                    isUp: newPrice > oldPrice
                  });
                  return newMap;
                });
                
                // Clear animation after 500ms
        setTimeout(() => {
                  setPriceAnimations((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(t.id);
                    return newMap;
                  });
        }, 500);
      }
      
              return {
                ...t,
            quote: {
              USD: {
                    ...t.quote.USD,
                    price: newPrice
                  }
                }
              };
            }
            return t;
          })
        );
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup: Unsubscribe from all tokens when component unmounts or tokens change
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [tokens.length]); // Only re-subscribe when token count changes (not on every price update)

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'Varien, sans-serif' }}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
              placeholder="Search tokens..."
                value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
              style={{ fontFamily: 'Varien, sans-serif' }}
            />
                </div>
          <button 
            onClick={fetchTokens}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            title="Refresh tokens"
          >
            <TrendingUp className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tokens List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading tokens...</p>
                </div>
        ) : error ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-red-500 font-medium">{error}</p>
              <button 
              onClick={fetchTokens}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
              Try Again
              </button>
            </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tokens found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                </div>
              ) : (
          filteredTokens.map((token) => {
            const isPositive = token.quote.USD.percent_change_24h >= 0;
            const priceAnimation = priceAnimations.get(token.id);
                  return (
                  <div 
                key={token.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                onClick={() => onCreateWager?.(token)}
              >
                {/* Token Header */}
                <div className="flex items-center gap-3 mb-3">
                  {token.logo && (
                    <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" />
                  )}
                        <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{token.symbol}</span>
                      <span className="text-sm text-gray-500">{token.name}</span>
                            </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      MC: {formatMarketCap(token.quote.USD.market_cap)}
                               </div>
                            </div>
                  <div className="text-right">
                    <div className={`font-bold transition-all duration-500 ${
                      priceAnimation?.isAnimating
                        ? priceAnimation.isUp
                          ? 'text-green-600 scale-110'
                          : 'text-red-600 scale-110'
                        : 'text-gray-800'
                    }`}>
                      {formatPrice(token.quote.USD.price)}
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(token.quote.USD.percent_change_24h).toFixed(2)}%</span>
                          </div>
                      </div>
                    </div>

                {/* Create Wager Button */}
                    <button
                  className="w-full py-2 px-4 rounded-lg text-sm font-bold text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
                  }}
                                onClick={(e) => {
                                    e.stopPropagation();
                    onCreateWager?.(token);
                  }}
                >
                  Create Wager
                                </button>
                    </div>
                  );
                })
              )}
            </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-center text-gray-500">
          Click on any token to create a price prediction wager
                  </p>
                </div>
              </div>
  );
}

export default TopCryptoTokensPanel; 
