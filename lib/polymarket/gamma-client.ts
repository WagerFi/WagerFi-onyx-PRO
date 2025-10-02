// Gamma Markets API Client - For fetching market data
import axios, { AxiosInstance } from 'axios';
import type { Market, PriceHistory, Trade } from './types';

// Use Next.js API routes to avoid CORS issues
const API_BASE = typeof window !== 'undefined' ? '/api' : 'https://gamma-api.polymarket.com';

export class GammaClient {
    private client: AxiosInstance;
    private useProxy: boolean;

    constructor() {
        // Use proxy (Next.js API routes) when in browser
        this.useProxy = typeof window !== 'undefined';

        this.client = axios.create({
            baseURL: this.useProxy ? API_BASE : 'https://gamma-api.polymarket.com',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get all active markets from events
     * Per Polymarket docs: https://docs.polymarket.com/developers/gamma-markets-api/fetch-markets-guide
     */
    async getAllMarkets(params?: {
        active?: boolean;
        closed?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Market[]> {
        try {
            // Use /events endpoint as recommended by Polymarket docs
            const endpoint = this.useProxy ? '/events' : '/events';

            const queryParams = {
                limit: params?.limit || 500,  // Fetch more events by default
                offset: params?.offset || 0,
                order: 'id',
                ascending: false,
                closed: params?.closed === true ? true : false,  // Only show non-closed by default
                _t: Date.now(),
            };

            console.log('📡 Fetching events from Polymarket:', queryParams);
            const response = await this.client.get(endpoint, { params: queryParams });

            const events = Array.isArray(response.data) ? response.data : [];
            console.log(`✅ Received ${events.length} events from Polymarket`);

            // Extract markets from events
            const markets: Market[] = [];
            events.forEach((event: any, idx: number) => {
                if (event.markets && Array.isArray(event.markets)) {
                    event.markets.forEach((market: any) => {
                        // Parse JSON strings that come from the API
                        let parsedOutcomes = market.outcomes;
                        let parsedOutcomePrices = market.outcomePrices;
                        let parsedTokenIds = market.clobTokenIds;

                        // Parse outcomes if it's a string
                        if (typeof market.outcomes === 'string') {
                            try {
                                parsedOutcomes = JSON.parse(market.outcomes);
                            } catch (e) {
                                parsedOutcomes = ['Yes', 'No'];
                            }
                        }

                        // Parse outcomePrices if it's a string
                        if (typeof market.outcomePrices === 'string') {
                            try {
                                parsedOutcomePrices = JSON.parse(market.outcomePrices);
                            } catch (e) {
                                parsedOutcomePrices = null;
                            }
                        }

                        // Parse clobTokenIds if it's a string
                        if (typeof market.clobTokenIds === 'string') {
                            try {
                                parsedTokenIds = JSON.parse(market.clobTokenIds);
                            } catch (e) {
                                parsedTokenIds = null;
                            }
                        }

                        // Create tokens array if we have parsed data
                        const tokens = parsedTokenIds && parsedOutcomes ?
                            parsedTokenIds.map((tokenId: string, idx: number) => ({
                                token_id: tokenId,
                                outcome: parsedOutcomes[idx] || `Outcome ${idx + 1}`,
                                price: parsedOutcomePrices?.[idx] || '0.5',
                                winner: false,
                            })) : undefined;

                        // Add event context to market
                        const enhancedMarket = {
                            ...market,
                            outcomes: parsedOutcomes,
                            outcome_prices: parsedOutcomePrices,
                            tokens: tokens || market.tokens,
                            clobTokenIds: parsedTokenIds,
                            event_slug: event.slug,
                            event_title: event.title,
                        };
                        markets.push(enhancedMarket);

                        // Log first market to see structure
                        if (markets.length === 1) {
                            console.log('🔍 Parsed market structure:', {
                                question: market.question,
                                originalOutcomes: market.outcomes,
                                parsedOutcomes,
                                parsedOutcomePrices,
                                tokens: enhancedMarket.tokens,
                            });
                        }
                    });
                }
            });

            console.log(`📊 Extracted ${markets.length} markets from ${events.length} events`);

            return markets;
        } catch (error: any) {
            console.error('❌ Error fetching markets:', error?.response?.data || error?.message);
            return [];
        }
    }

    /**
     * Get a specific market by condition ID
     */
    async getMarket(conditionId: string): Promise<Market> {
        try {
            console.log('🔍 Fetching single market, conditionId:', conditionId);
            const endpoint = this.useProxy ? `/api/markets/${conditionId}` : `https://gamma-api.polymarket.com/markets/${conditionId}`;
            const response = await this.client.get(endpoint);

            // Parse the market data similar to getAllMarkets
            const market = response.data;
            if (market.outcomes && typeof market.outcomes === 'string') {
                try {
                    market.outcomes = JSON.parse(market.outcomes);
                } catch (e) {
                    console.warn('Failed to parse outcomes:', market.outcomes);
                }
            }
            if (market.outcomePrices && typeof market.outcomePrices === 'string') {
                try {
                    market.outcomePrices = JSON.parse(market.outcomePrices);
                } catch (e) {
                    console.warn('Failed to parse outcomePrices:', market.outcomePrices);
                }
            }
            if (market.clobTokenIds && typeof market.clobTokenIds === 'string') {
                try {
                    market.clobTokenIds = JSON.parse(market.clobTokenIds);
                } catch (e) {
                    console.warn('Failed to parse clobTokenIds:', market.clobTokenIds);
                }
            }

            console.log('✅ Single market fetched:', market.question);
            return market;
        } catch (error: any) {
            console.error('❌ Error fetching market:', error?.response?.data || error?.message);
            throw error;
        }
    }

    /**
     * Get markets by category
     */
    async getMarketsByCategory(category: string): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets();
            return markets.filter(m => m.category === category);
        } catch (error) {
            console.error('Error fetching markets by category:', error);
            throw error;
        }
    }

    /**
     * Get trending markets based on 24hr volume
     */
    async getTrendingMarkets(limit: number = 10): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets({ limit: 100 });

            // Calculate trend score based on volume_24hr
            const marketsWithScore = markets.map(market => {
                const volume24hr = parseFloat(market.volume_24hr || market.volume24hr || '0');
                const totalVolume = parseFloat(market.volume || '0');

                // Higher score for markets with high 24hr volume
                const trendScore = volume24hr + (totalVolume * 0.1);

                return {
                    ...market,
                    trend_score: trendScore,
                };
            });

            // Sort by trend score and return top N
            return marketsWithScore
                .sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching trending markets:', error);
            return [];
        }
    }

    /**
     * Get most profitable markets (highest price differentials)
     */
    async getProfitableMarkets(limit: number = 10): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets({ limit: 100 });

            // Calculate profitability score based on price differentials
            const marketsWithScore = markets.map(market => {
                const tokens = market.tokens || [];
                if (tokens.length < 2) {
                    return { ...market, profitability_score: 0 };
                }

                // Calculate price spread and volume
                const prices = tokens.map(t => parseFloat(t.price || '0.5'));
                const maxPrice = Math.max(...prices);
                const minPrice = Math.min(...prices);
                const spread = Math.abs(maxPrice - minPrice);
                const volume = parseFloat(market.volume || '0');

                // Profitability score: spread + volume factor
                const profitabilityScore = (spread * 100) + Math.log(volume + 1);

                return {
                    ...market,
                    profitability_score: profitabilityScore,
                };
            });

            // Sort by profitability score and return top N
            return marketsWithScore
                .filter(m => (m.profitability_score || 0) > 0)
                .sort((a, b) => (b.profitability_score || 0) - (a.profitability_score || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching profitable markets:', error);
            return [];
        }
    }

    /**
     * Get recent trades for a token
     */
    async getRecentTrades(tokenId: string, limit: number = 50): Promise<Trade[]> {
        try {
            const endpoint = this.useProxy ? '/trades' : '/trades';
            const response = await this.client.get(endpoint, {
                params: { token_id: tokenId, limit }
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            console.error('Error fetching recent trades:', error?.response?.data || error?.message);
            return [];
        }
    }

    /**
     * Get price history for a token
     */
    async getPriceHistory(
        tokenId: string,
        interval: string = '1h',
        startTs?: number,
        endTs?: number
    ): Promise<PriceHistory[]> {
        try {
            const response = await this.client.get(`/prices`, {
                params: {
                    token_id: tokenId,
                    interval,
                    start_ts: startTs,
                    end_ts: endTs,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching price history:', error);
            throw error;
        }
    }

    /**
     * Search markets by query
     */
    async searchMarkets(query: string): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets({ active: true });
            const lowerQuery = query.toLowerCase();

            return markets.filter(market =>
                market.question.toLowerCase().includes(lowerQuery) ||
                market.description?.toLowerCase().includes(lowerQuery) ||
                market.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        } catch (error) {
            console.error('Error searching markets:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const gammaClient = new GammaClient();

