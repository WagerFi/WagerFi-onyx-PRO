'use client';

import { useState, useEffect, useCallback } from 'react';
import { gammaClient } from '@/lib/polymarket/gamma-client';
import type { Market } from '@/lib/polymarket/types';

export function useMarkets() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [trending, setTrending] = useState<Market[]>([]);
    const [profitable, setProfitable] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarkets = useCallback(async (isInitialLoad = false) => {
        // Only show loading on initial load, not on refresh
        if (isInitialLoad) {
            setLoading(true);
        }
        setError(null);

        try {
            console.log('📡 Fetching ALL markets from Polymarket...');

            // Fetch a large batch of markets (Polymarket typically has 300-500 events)
            const allMarkets = await gammaClient.getAllMarkets({
                closed: false,
                limit: 500  // Increased to get more markets
            });

            console.log(`✅ Fetched ${allMarkets.length} markets from Polymarket`);

            // Filter out any invalid markets
            const validMarkets = allMarkets.filter(m => {
                if (!m) return false;
                const hasTokens = m.tokens && Array.isArray(m.tokens) && m.tokens.length > 0;
                const hasOutcomes = m.outcomes && Array.isArray(m.outcomes) && m.outcomes.length > 0;
                return hasTokens || hasOutcomes;
            });

            console.log(`✅ ${validMarkets.length} valid markets after filtering`);

            // Sort for trending (by 24h volume)
            const trendingMarkets = [...validMarkets]
                .sort((a, b) => {
                    const volA = parseFloat(a.volume_24hr || a.volume24hr || '0');
                    const volB = parseFloat(b.volume_24hr || b.volume24hr || '0');
                    return volB - volA;
                })
                .slice(0, 50); // Top 50 by volume

            // Sort for profitable (by price spread + volume)
            const profitableMarkets = [...validMarkets]
                .map(market => {
                    const tokens = market.tokens || [];
                    if (tokens.length < 2) return { ...market, profitScore: 0 };

                    const prices = tokens.map(t => parseFloat(t.price || '0.5'));
                    const spread = Math.abs(Math.max(...prices) - Math.min(...prices));
                    const volume = parseFloat(market.volume || '0');

                    // Higher spread + more volume = more profitable opportunity
                    const profitScore = (spread * 100) + Math.log(volume + 1);

                    return { ...market, profitScore };
                })
                .filter(m => (m.profitScore || 0) > 0)
                .sort((a, b) => (b.profitScore || 0) - (a.profitScore || 0))
                .slice(0, 50); // Top 50 by profit opportunity

            console.log('📊 Markets categorized:', {
                all: validMarkets.length,
                trending: trendingMarkets.length,
                profitable: profitableMarkets.length
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
        // Initial load with loading state
        fetchMarkets(true);

        // Refresh markets every 30 seconds (without loading state)
        const interval = setInterval(() => fetchMarkets(false), 30000);

        return () => clearInterval(interval);
    }, [fetchMarkets]);

    return {
        markets,
        trending,
        profitable,
        loading,
        error,
        refetch: fetchMarkets,
    };
}

export function useMarket(conditionId: string | null) {
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true); // Start as loading
    const [error, setError] = useState<string | null>(null);

    // Try to get from the markets list first (cached)
    const { markets: allMarkets, loading: marketsLoading } = useMarkets();

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

        // Markets are loaded, now search in cache
        console.log('🔍 Looking for market in cache, conditionId:', conditionId);
        console.log(`📊 Searching through ${allMarkets.length} cached markets`);

        const cachedMarket = allMarkets.find(m =>
            m.conditionId === conditionId ||
            m.condition_id === conditionId ||
            m.id === conditionId
        );

        if (cachedMarket) {
            console.log('✅ Found market in cache:', cachedMarket.question);
            setMarket(cachedMarket);
            setError(null);
            setLoading(false);
        } else {
            // Market not in cache - this shouldn't happen if we came from the market list
            console.warn('⚠️ Market not found in cache, this is unexpected');
            setError('Market not found');
            setLoading(false);
        }
    }, [conditionId, allMarkets, marketsLoading]);

    const refetch = useCallback(() => {
        // Force re-check the cache
        if (!conditionId) return;

        const cachedMarket = allMarkets.find(m =>
            m.conditionId === conditionId ||
            m.condition_id === conditionId ||
            m.id === conditionId
        );

        if (cachedMarket) {
            setMarket(cachedMarket);
            setError(null);
        }
    }, [conditionId, allMarkets]);

    return {
        market,
        loading,
        error,
        refetch,
    };
}

