'use client';

import { useState, useEffect, useCallback } from 'react';
import { gammaClient } from '@/lib/polymarket/gamma-client';
import type { Market } from '@/lib/polymarket/types';

export function useMarkets() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [trending, setTrending] = useState<Market[]>([]);
    const [profitable, setProfitable] = useState<Market[]>([]);
    const [searchResults, setSearchResults] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Infinite scroll state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);

    const fetchMarkets = useCallback(async (reset = true) => {
        if (reset) {
            setLoading(true);
            setCurrentOffset(0);
        }
        setError(null);

        try {
            console.log('📡 Fetching ALL markets from Polymarket...');

            // Fetch active markets directly from Polymarket /markets endpoint
            const allMarkets = await gammaClient.getAllMarkets({
                active: true,
                limit: 500  // Top 500 by 24hr volume (trending markets)
            });

            console.log(`✅ Fetched ${allMarkets.length} active markets from Polymarket`);

            // Filter out any invalid markets (minimal filtering)
            const validMarkets = allMarkets.filter(m => {
                if (!m || !m.question) return false;
                // Must have either tokens with prices OR outcome prices
                const hasTokens = m.tokens && Array.isArray(m.tokens) && m.tokens.length > 0;
                const hasOutcomePrices = m.outcomePrices || m.outcome_prices;
                const hasOutcomes = m.outcomes && (Array.isArray(m.outcomes) ? m.outcomes.length > 0 : true);
                return hasOutcomes && (hasTokens || hasOutcomePrices);
            });

            console.log(`✅ ${validMarkets.length} valid markets after filtering`);

            // Count binary vs multi-outcome markets
            const binaryMarkets = validMarkets.filter(m =>
                Array.isArray(m.outcomes) ? m.outcomes.length === 2 : false
            );
            const multiOutcomeMarkets = validMarkets.filter(m =>
                Array.isArray(m.outcomes) ? m.outcomes.length > 2 : false
            );

            console.log('📊 Market breakdown:', {
                total: validMarkets.length,
                binary: binaryMarkets.length,
                multiOutcome: multiOutcomeMarkets.length,
            });

            // Log sample multi-outcome markets
            if (multiOutcomeMarkets.length > 0) {
                console.log('🎯 Sample multi-outcome markets:', multiOutcomeMarkets.slice(0, 5).map(m => ({
                    question: m.question,
                    outcomes: Array.isArray(m.outcomes) ? m.outcomes.length : 'not array',
                    options: Array.isArray(m.outcomes) ? m.outcomes.slice(0, 5) : m.outcomes,
                    prices: m.tokens?.slice(0, 5).map(t => t.price) || (Array.isArray(m.outcomePrices) ? m.outcomePrices.slice(0, 5) : m.outcomePrices),
                    volume: m.volume,
                })));

                // Show position of first multi-outcome in trending
                const firstMultiPos = validMarkets.findIndex(m =>
                    Array.isArray(m.outcomes) && m.outcomes.length > 2
                );
                console.log(`📍 First multi-outcome market is at position ${firstMultiPos} in all markets`);
            } else {
                console.warn('⚠️ No multi-outcome markets found in data!');
            }

            // Sort for trending (by 24h volume, with boost for multi-outcome)
            const trendingMarkets = [...validMarkets]
                .sort((a, b) => {
                    const volA = parseFloat(a.volume_24hr || a.volume24hr || a.volume || '0');
                    const volB = parseFloat(b.volume_24hr || b.volume24hr || b.volume || '0');

                    // Boost multi-outcome markets by 20% to ensure visibility
                    const isMultiA = Array.isArray(a.outcomes) && a.outcomes.length > 2;
                    const isMultiB = Array.isArray(b.outcomes) && b.outcomes.length > 2;
                    const boostA = isMultiA ? 1.2 : 1;
                    const boostB = isMultiB ? 1.2 : 1;

                    return (volB * boostB) - (volA * boostA);
                })
                ; // Show all markets sorted by volume for infinite scroll

            // Sort for profitable (by price spread + volume)
            const profitableMarkets = [...validMarkets]
                .map(market => {
                    const tokens = market.tokens || [];
                    if (tokens.length < 2) return { ...market, profitScore: 0 };

                    const prices = tokens.map(t => parseFloat(t.price || '0.5'));
                    const spread = Math.abs(Math.max(...prices) - Math.min(...prices));
                    const volume = parseFloat(market.volume || '0');

                    // Higher spread + more volume = more profitable opportunity
                    // Boost multi-outcome markets slightly
                    const isMulti = Array.isArray(market.outcomes) && market.outcomes.length > 2;
                    const multiBoost = isMulti ? 1.15 : 1;
                    const profitScore = ((spread * 100) + Math.log(volume + 1)) * multiBoost;

                    return { ...market, profitScore };
                })
                .filter(m => (m.profitScore || 0) > 0)
                .sort((a, b) => (b.profitScore || 0) - (a.profitScore || 0))
                .slice(0, 100); // Top 100 by profit opportunity (increased from 50)

            // Count multi-outcome in trending
            const multiInTrending = trendingMarkets.filter(m =>
                Array.isArray(m.outcomes) && m.outcomes.length > 2
            ).length;

            console.log('📊 Markets categorized:', {
                all: validMarkets.length,
                trending: trendingMarkets.length,
                profitable: profitableMarkets.length,
                multiOutcomeInTrending: multiInTrending,
            });

            setMarkets(validMarkets);
            setTrending(trendingMarkets);
            setProfitable(profitableMarkets);

            if (validMarkets.length === 0) {
                setError('No markets found. Polymarket API might be unavailable.');
            }
        } catch (err: any) {
            console.error('❌ Error fetching markets:', err);
            setError(err.message || 'Failed to fetch markets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch markets only on initial mount (page load/refresh)
        fetchMarkets();
    }, [fetchMarkets]);

    // Search function
    const searchMarkets = useCallback(async (query: string) => {
        if (!query || query.trim().length === 0) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        setError(null);

        try {
            const results = await gammaClient.searchMarkets(query, 50);
            setSearchResults(results);
        } catch (err: any) {
            console.error('❌ Error searching markets:', err);
            setError(err.message || 'Failed to search markets');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    // Load more markets for infinite scroll
    const loadMoreMarkets = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextOffset = currentOffset + 100;
            console.log(`📡 Loading more markets from offset ${nextOffset}...`);

            const moreMarkets = await gammaClient.getAllMarkets({
                active: true,
                limit: 100,
                offset: nextOffset
            });

            console.log(`✅ Loaded ${moreMarkets.length} more markets`);

            if (moreMarkets.length === 0) {
                setHasMore(false);
            } else {
                // Filter and sort by volume
                const validMarkets = moreMarkets.filter(m => {
                    if (!m || !m.question) return false;
                    const hasTokens = m.tokens && Array.isArray(m.tokens) && m.tokens.length > 0;
                    const hasOutcomePrices = m.outcomePrices || m.outcome_prices;
                    const hasOutcomes = m.outcomes && (Array.isArray(m.outcomes) ? m.outcomes.length > 0 : true);
                    return hasOutcomes && (hasTokens || hasOutcomePrices);
                });

                // Sort by volume (highest first)
                const sortedMarkets = validMarkets.sort((a, b) => {
                    const volumeA = parseFloat(a.volume_24hr || a.volume24hr || a.volume || '0');
                    const volumeB = parseFloat(b.volume_24hr || b.volume24hr || b.volume || '0');
                    return volumeB - volumeA;
                });

                // Append to existing trending markets
                setTrending(prev => [...prev, ...sortedMarkets]);
                setCurrentOffset(nextOffset);
            }
        } catch (error) {
            console.error('❌ Error loading more markets:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, currentOffset]);

    return {
        markets,
        trending,
        profitable,
        searchResults,
        loading,
        searching,
        error,
        hasMore,
        loadingMore,
        refetch: fetchMarkets,
        searchMarkets,
        loadMoreMarkets,
    };
}

export function useMarket(conditionId: string | null) {
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true); // Start as loading
    const [error, setError] = useState<string | null>(null);

    // Try to get from the markets list first (cached)
    const { markets: allMarkets, searchResults, loading: marketsLoading } = useMarkets();

    useEffect(() => {
        if (!conditionId) {
            setLoading(false);
            return;
        }

        // If markets are still loading, wait
        if (marketsLoading) {
            console.log('⏳ Waiting for markets to load...');
            setLoading(true);
            return;
        }

        // Function to find market in an array
        const findMarket = (markets: Market[]) => markets.find(m =>
            m.conditionId === conditionId ||
            m.condition_id === conditionId ||
            m.id === conditionId
        );

        // Markets are loaded, now search in cache (both main markets and search results)
        console.log('🔍 Looking for market in cache, conditionId:', conditionId);
        console.log(`📊 Searching through ${allMarkets.length} cached markets + ${searchResults.length} search results`);

        let cachedMarket = findMarket(allMarkets);

        // If not in main markets, check search results
        if (!cachedMarket && searchResults.length > 0) {
            console.log('🔍 Not in main markets, checking search results...');
            cachedMarket = findMarket(searchResults);
        }

        if (cachedMarket) {
            console.log('✅ Found market in cache:', cachedMarket.question);
            setMarket(cachedMarket);
            setError(null);
            setLoading(false);
        } else {
            // Market not in cache - fetch it directly from the API
            console.log('📡 Market not in cache, fetching from API...');
            setLoading(true);

            gammaClient.getMarket(conditionId)
                .then(fetchedMarket => {
                    console.log('✅ Fetched market from API:', fetchedMarket.question);
                    setMarket(fetchedMarket);
                    setError(null);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('❌ Failed to fetch market:', err);
                    setError('Market not found');
                    setLoading(false);
                });
        }
    }, [conditionId, allMarkets, searchResults, marketsLoading]);

    const refetch = useCallback(() => {
        // Force re-check the cache or fetch from API
        if (!conditionId) return;

        const findMarket = (markets: Market[]) => markets.find(m =>
            m.conditionId === conditionId ||
            m.condition_id === conditionId ||
            m.id === conditionId
        );

        let cachedMarket = findMarket(allMarkets);

        if (!cachedMarket && searchResults.length > 0) {
            cachedMarket = findMarket(searchResults);
        }

        if (cachedMarket) {
            setMarket(cachedMarket);
            setError(null);
        } else {
            // Fetch from API
            gammaClient.getMarket(conditionId)
                .then(fetchedMarket => {
                    setMarket(fetchedMarket);
                    setError(null);
                })
                .catch(err => {
                    console.error('❌ Failed to fetch market:', err);
                    setError('Market not found');
                });
        }
    }, [conditionId, allMarkets, searchResults]);

    return {
        market,
        loading,
        error,
        refetch,
    };
}

