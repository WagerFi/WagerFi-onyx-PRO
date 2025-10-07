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
     * Search markets and events by query string
     * Returns markets that match the search query
     */
    async searchMarkets(query: string, limit: number = 50): Promise<Market[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        try {
            console.log(`🔍 Searching Polymarket using /public-search for: "${query}"`);

            // Use Polymarket's dedicated search endpoint
            const response = await this.client.get('/public-search', {
                params: {
                    q: query,
                    limit_per_type: 500, // Get up to 200 results per type (events, markets, etc.)
                    search_tags: true,
                    _t: Date.now(),
                }
            });

            const { events = [], tags = [] } = response.data || {};

            console.log(`✅ Search returned ${events.length} events`);
            if (events.length > 0) {
                console.log('📋 Top 5 event results:');
                events.slice(0, 5).forEach((e: any, i: number) => {
                    console.log(`  ${i + 1}. ${e.title} (${e.markets?.length || 0} markets)`);
                });
            }

            // Process search results
            const processedConditions = new Set<string>();
            const searchResults: Market[] = [];

            // Process events from search results
            events.forEach((event: any) => {
                if (!event.markets || !Array.isArray(event.markets)) return;

                const eventMarkets = event.markets.filter((m: any) => m.active !== false && m.closed !== true);
                if (eventMarkets.length === 0) return;

                // Try to group as multi-outcome market
                if (eventMarkets.length > 1 && this.areMarketsGroupable(eventMarkets)) {
                    const groupedMarket = this.groupMarketsAsMultiOutcome(event, eventMarkets);
                    if (groupedMarket) {
                        searchResults.push(groupedMarket);
                        eventMarkets.forEach((m: any) => {
                            const condId = m.condition_id || m.conditionId;
                            if (condId) processedConditions.add(condId);
                        });
                    }
                } else {
                    // Add individual markets from the event
                    eventMarkets.forEach((m: any) => {
                        const parsed = this.parseMarket(m, event);
                        if (parsed) {
                            searchResults.push(parsed);
                            const condId = m.condition_id || m.conditionId;
                            if (condId) processedConditions.add(condId);
                        }
                    });
                }
            });

            console.log(`🎯 Found ${searchResults.length} markets matching "${query}"`);
            return searchResults;

        } catch (error: any) {
            console.error('❌ Error searching markets:', error?.response?.data || error?.message);
            return [];
        }
    }

    /**
     * Get all active markets from Polymarket events
     * Uses /events endpoint to get grouped markets (includes multi-outcome markets)
     */
    async getAllMarkets(params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Market[]> {
        try {
            // STEP 1: Fetch from /markets to get trending markets with volume data
            console.log('📡 Step 1: Fetching trending markets from /markets endpoint...');
            const marketsResponse = await this.client.get('/markets', {
                params: {
                    limit: params?.limit || 500,
                    offset: params?.offset || 0,
                    order: 'volume24hr',
                    ascending: false,
                    active: params?.active !== false,
                    closed: false, // Never show closed markets
                    _t: Date.now(),
                }
            });

            const trendingMarkets = Array.isArray(marketsResponse.data) ? marketsResponse.data : [];
            console.log(`✅ Received ${trendingMarkets.length} trending markets`);

            if (trendingMarkets.length > 0) {
                console.log('📋 Top 10 markets by 24hr volume:');
                trendingMarkets.slice(0, 10).forEach((market: any, i: number) => {
                    const vol24hr = parseFloat(market.volume24hr || market.volume_24hr || '0');
                    console.log(`  ${i + 1}. ${market.question} ($${(vol24hr / 1000000).toFixed(2)}M)`);
                });
            }

            // STEP 2: Fetch from /events to get multi-outcome market structures
            console.log('📡 Step 2: Fetching events for multi-outcome markets...');
            const eventsResponse = await this.client.get('/events', {
                params: {
                    limit: 1000,
                    offset: 0,
                    closed: false,
                    _t: Date.now(),
                }
            });

            const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
            console.log(`✅ Received ${events.length} events`);

            // STEP 3: Build a map of condition_id -> market for quick lookup
            const marketsByCondition = new Map<string, any>();
            trendingMarkets.forEach((market: any) => {
                if (market.condition_id || market.conditionId) {
                    marketsByCondition.set(market.condition_id || market.conditionId, market);
                }
            });

            // STEP 4: Process events and create multi-outcome markets
            const allMarkets: Market[] = [];
            const processedConditions = new Set<string>();

            events.forEach((event: any) => {
                if (!event.markets || !Array.isArray(event.markets) || event.markets.length === 0) return;

                const eventMarkets = event.markets.filter((m: any) => m.active !== false && m.closed !== true);
                if (eventMarkets.length === 0) return;

                // Check if this is a multi-outcome event (multiple related markets)
                if (eventMarkets.length > 1 && this.areMarketsGroupable(eventMarkets)) {
                    const groupedMarket = this.groupMarketsAsMultiOutcome(event, eventMarkets);
                    if (groupedMarket) {
                        allMarkets.push(groupedMarket);
                        // Mark all these conditions as processed
                        eventMarkets.forEach((m: any) => {
                            const condId = m.condition_id || m.conditionId;
                            if (condId) processedConditions.add(condId);
                        });
                    }
                }
            });

            // STEP 5: Add remaining trending binary markets that weren't grouped
            trendingMarkets.forEach((market: any) => {
                const condId = market.condition_id || market.conditionId;
                if (!condId || !processedConditions.has(condId)) {
                    const parsed = this.parseMarket(market);
                    if (parsed) {
                        allMarkets.push(parsed);
                        if (condId) processedConditions.add(condId);
                    }
                }
            });

            console.log(`✅ Combined ${allMarkets.length} total markets (events + trending)`);

            // Count types
            const multiCount = allMarkets.filter(m => Array.isArray(m.outcomes) && m.outcomes.length > 2).length;
            const binaryCount = allMarkets.length - multiCount;
            console.log(`📊 ${multiCount} multi-outcome, ${binaryCount} binary`);

            return allMarkets;
        } catch (error: any) {
            console.error('❌ Error fetching markets:', error?.response?.data || error?.message);
            return [];
        }
    }

    /**
     * Check if markets in an event should be grouped as multi-outcome
     */
    private areMarketsGroupable(markets: any[]): boolean {
        if (markets.length < 2) return false;

        // Check if all markets have similar question patterns
        // indicating they're part of a multi-outcome group (e.g., "Will X win?")
        const firstQuestion = markets[0].question || '';

        // Common patterns for groupable markets:
        // - "Will [name] win..."
        // - "Will [name] be..."
        // - All have "Yes"/"No" outcomes
        const hasCommonPattern = markets.every((m: any) => {
            const question = m.question || '';
            // Extract outcomes
            let outcomes = m.outcomes;
            if (typeof outcomes === 'string') {
                try {
                    outcomes = JSON.parse(outcomes);
                } catch {
                    return false;
                }
            }

            // Must be binary Yes/No markets
            if (!Array.isArray(outcomes) || outcomes.length !== 2) return false;
            const isYesNo = outcomes.some((o: string) => o.toLowerCase() === 'yes') &&
                outcomes.some((o: string) => o.toLowerCase() === 'no');

            return isYesNo;
        });

        return hasCommonPattern && markets.length <= 25; // Max 25 outcomes for display
    }

    /**
     * Group multiple binary markets into a single multi-outcome market
     */
    private groupMarketsAsMultiOutcome(event: any, markets: any[]): Market | null {
        try {
            // Filter out inactive markets (Polymarket placeholders like "Person A, B, C...")
            // Check both m.active and m.closed properties, and also filter out zero-volume markets
            const activeMarkets = markets.filter((m: any) => {
                // Log first market to see structure
                if (markets.indexOf(m) === 0) {
                    console.log('🔍 First market structure:', {
                        question: m.question,
                        active: m.active,
                        closed: m.closed,
                        volume: m.volume,
                        groupItemTitle: m.groupItemTitle
                    });
                }

                return m.active !== false && !m.closed && parseFloat(m.volume || '0') > 0;
            });

            console.log(`🔍 Filtering markets: ${markets.length} total → ${activeMarkets.length} active (removed ${markets.length - activeMarkets.length} inactive)`);

            // If all markets are inactive, return null
            if (activeMarkets.length === 0) {
                return null;
            }

            // Extract candidate/option names from questions
            const outcomes: string[] = [];
            const outcomePrices: string[] = [];
            const tokens: any[] = [];

            // Log the event for debugging
            if (activeMarkets.length === 3) {
                console.log('🔍 Parsing 3-outcome market:', {
                    eventTitle: event.title,
                    questions: activeMarkets.map((m: any) => m.question)
                });
            } else if (activeMarkets.length >= 5) {
                console.log('🔍 Parsing multi-outcome market:', {
                    eventTitle: event.title,
                    outcomeCount: activeMarkets.length,
                    sampleQuestions: activeMarkets.slice(0, 3).map((m: any) => m.question)
                });
            }

            activeMarkets.forEach((market: any) => {
                // Parse outcomes and prices
                let marketOutcomes = market.outcomes;
                let marketPrices = market.outcomePrices;

                if (typeof marketOutcomes === 'string') {
                    try { marketOutcomes = JSON.parse(marketOutcomes); } catch { }
                }
                if (typeof marketPrices === 'string') {
                    try { marketPrices = JSON.parse(marketPrices); } catch { }
                }

                // Extract outcome name from Polymarket's question text
                // Note: Polymarket only provides outcomes: ["Yes", "No"]
                // The question is the ONLY source for meaningful outcome names
                const question = market.question || '';
                let entityName = this.extractEntityNameFromQuestion(question);

                outcomes.push(entityName);

                // Debug log for multi-outcome markets
                if (markets.length === 3 && outcomes.length <= 3) {
                    console.log(`  Question: "${question}" → Entity: "${entityName}"`);
                } else if (markets.length >= 5 && outcomes.length <= 3) {
                    console.log(`  Sample Q: "${question}" → Entity: "${entityName}"`);
                }

                // Get "Yes" probability (first outcome for grouping)
                const yesIndex = Array.isArray(marketOutcomes) ?
                    marketOutcomes.findIndex((o: string) => o.toLowerCase() === 'yes') : 0;
                const yesProbability = Array.isArray(marketPrices) ? marketPrices[yesIndex] || '0.5' : '0.5';

                outcomePrices.push(yesProbability);

                // Create token for this outcome
                if (market.clobTokenIds) {
                    let tokenIds = market.clobTokenIds;
                    if (typeof tokenIds === 'string') {
                        try { tokenIds = JSON.parse(tokenIds); } catch { }
                    }
                    if (Array.isArray(tokenIds) && tokenIds[yesIndex]) {
                        tokens.push({
                            token_id: tokenIds[yesIndex],
                            outcome: entityName,
                            price: yesProbability,
                            winner: false,
                            image: market.image || market.icon || undefined,
                        });
                    }
                }
            });

            // Use event title as question
            const question = event.title || activeMarkets[0]?.question || 'Multi-outcome market';

            // Sum volume from all markets
            const totalVolume = activeMarkets.reduce((sum, m) => {
                const vol = parseFloat(m.volume || '0');
                return sum + vol;
            }, 0);

            return {
                id: event.id || event.slug,
                condition_id: event.id,
                conditionId: event.id,
                question: question,
                description: event.description,
                end_date_iso: activeMarkets[0]?.end_date_iso,
                category: event.category,
                image: event.image,
                active: event.active,
                closed: event.closed,
                outcomes: outcomes,
                outcome_prices: outcomePrices,
                outcomePrices: outcomePrices,
                tokens: tokens.length > 0 ? tokens : undefined,
                volume: totalVolume.toString(),
                event_slug: event.slug,
                event_title: event.title,
            };
        } catch (error) {
            console.error('Error grouping markets:', error);
            return null;
        }
    }

    /**
     * Parse a single market with event context
     */
    private parseMarket(market: any, event?: any): Market {
        // Parse JSON strings
        let parsedOutcomes = market.outcomes;
        let parsedOutcomePrices = market.outcomePrices;
        let parsedTokenIds = market.clobTokenIds;

        if (typeof market.outcomes === 'string') {
            try {
                parsedOutcomes = JSON.parse(market.outcomes);
            } catch {
                parsedOutcomes = ['Yes', 'No'];
            }
        }

        if (typeof market.outcomePrices === 'string') {
            try {
                parsedOutcomePrices = JSON.parse(market.outcomePrices);
            } catch {
                parsedOutcomePrices = null;
            }
        }

        if (typeof market.clobTokenIds === 'string') {
            try {
                parsedTokenIds = JSON.parse(market.clobTokenIds);
            } catch {
                parsedTokenIds = null;
            }
        }

        // Create tokens array
        const tokens = parsedTokenIds && parsedOutcomes && parsedOutcomePrices ?
            parsedTokenIds.map((tokenId: string, idx: number) => ({
                token_id: tokenId,
                outcome: parsedOutcomes[idx] || `Outcome ${idx + 1}`,
                price: parsedOutcomePrices?.[idx] || '0.5',
                winner: false,
            })) : undefined;

        return {
            ...market,
            outcomes: parsedOutcomes,
            outcome_prices: parsedOutcomePrices,
            outcomePrices: parsedOutcomePrices,
            tokens: tokens || market.tokens,
            clobTokenIds: parsedTokenIds,
            event_slug: event?.slug,
            event_title: event?.title,
        };
    }


    /**
     * Get a specific market by condition ID or market ID
     * Also handles event IDs for multi-outcome markets
     */
    async getMarket(conditionId: string): Promise<Market> {
        try {
            console.log('🔍 Fetching single market/event, ID:', conditionId);
            // Don't include /api prefix when using proxy - axios baseURL already has it
            const endpoint = `/markets/${conditionId}`;
            const response = await this.client.get(endpoint);

            const data = response.data;

            // Check if this is an event (multi-outcome market) by looking for markets array
            if (data.markets && Array.isArray(data.markets) && data.markets.length > 0) {
                console.log('📦 Detected event with', data.markets.length, 'markets, parsing as multi-outcome');

                // Parse as multi-outcome market (same logic as in searchMarkets)
                const event = data;
                let markets = event.markets;

                // Filter out inactive markets and placeholder markets (Person A, B, C, etc.)
                // These are markets with active=false, closed=true, or zero volume
                const activeMarkets = markets.filter((m: any) => {
                    return m.active !== false && !m.closed && parseFloat(m.volume || '0') > 0;
                });

                console.log(`🔍 Filtering markets: ${markets.length} total → ${activeMarkets.length} active (removed ${markets.length - activeMarkets.length} inactive)`);

                // If no active markets, throw error
                if (activeMarkets.length === 0) {
                    throw new Error('No active markets found for this event');
                }

                // Use only active markets
                markets = activeMarkets;

                // Extract candidate/option names from questions
                const outcomes: string[] = [];
                const outcomePrices: string[] = [];
                const tokens: any[] = [];

                markets.forEach((market: any, idx: number) => {
                    // Parse outcomes and prices
                    let marketOutcomes = market.outcomes;
                    let marketPrices = market.outcomePrices;

                    if (typeof marketOutcomes === 'string') {
                        try { marketOutcomes = JSON.parse(marketOutcomes); } catch { }
                    }
                    if (typeof marketPrices === 'string') {
                        try { marketPrices = JSON.parse(marketPrices); } catch { }
                    }

                    // Extract outcome name from question (same logic as searchMarkets)
                    const question = market.question || '';
                    let entityName = this.extractEntityNameFromQuestion(question);

                    // Debug log for multi-outcome markets
                    if (idx < 5) {
                        console.log(`  Market ${idx + 1}:`, {
                            question: question,
                            extractedEntity: entityName,
                            apiOutcomes: marketOutcomes,
                        });
                    }

                    outcomes.push(entityName);

                    // Get "Yes" probability
                    const yesIndex = Array.isArray(marketOutcomes) ?
                        marketOutcomes.findIndex((o: string) => o.toLowerCase() === 'yes') : 0;
                    const yesProbability = Array.isArray(marketPrices) ? marketPrices[yesIndex] || '0.5' : '0.5';

                    outcomePrices.push(yesProbability);

                    // Create token for this outcome
                    if (market.clobTokenIds) {
                        let tokenIds = market.clobTokenIds;
                        if (typeof tokenIds === 'string') {
                            try { tokenIds = JSON.parse(tokenIds); } catch { }
                        }
                        if (Array.isArray(tokenIds) && tokenIds[yesIndex]) {
                            tokens.push({
                                token_id: tokenIds[yesIndex],
                                outcome: entityName,
                                price: yesProbability,
                                winner: false,
                                image: market.image || market.icon || undefined
                            });
                        }
                    }
                });

                // Create the multi-outcome market object
                const multiOutcomeMarket: Market = {
                    id: event.id || event.event_id || conditionId,
                    condition_id: event.id || event.event_id || conditionId,
                    conditionId: event.id || event.event_id || conditionId,
                    question: event.title || markets[0]?.question || 'Multi-Outcome Market',
                    description: event.description || markets[0]?.description || '',
                    outcomes,
                    outcomePrices,
                    tokens,
                    category: event.category || markets[0]?.category || 'Politics',
                    image: event.image || event.icon || markets[0]?.image || markets[0]?.icon || undefined,
                    end_date_iso: markets[0]?.end_date_iso || null,
                    game_start_time: markets[0]?.game_start_time || null,
                    volume: markets.reduce((sum: number, m: any) => sum + (parseFloat(m.volume) || 0), 0).toString(),
                    volume24hr: markets.reduce((sum: number, m: any) => sum + (parseFloat(m.volume24hr) || 0), 0),
                    liquidity: markets.reduce((sum: number, m: any) => sum + (parseFloat(m.liquidity) || 0), 0).toString(),
                    slug: event.slug || markets[0]?.slug || '',
                    active: markets.some((m: any) => m.active),
                    closed: markets.every((m: any) => m.closed),
                    accepting_orders: markets.some((m: any) => m.accepting_orders),
                    event_title: event.title,
                    rewards: markets[0]?.rewards || {},
                };

                console.log('✅ Multi-outcome market fetched:', multiOutcomeMarket.question);
                return multiOutcomeMarket;
            }

            // Single market - use parseMarket for consistent handling
            const market = this.parseMarket(data);

            console.log('✅ Single market fetched:', market.question);
            return market;
        } catch (error: any) {
            console.error('❌ Error fetching market:', error?.response?.data || error?.message);
            throw error;
        }
    }

    /**
     * Extract entity name from a market question
     * Used for both searchMarkets and getMarket
     */
    private extractEntityNameFromQuestion(question: string): string {
        let entityName = question;

        // Draw (football/soccer)
        if (/draw/i.test(question)) {
            entityName = 'Draw';
        }
        // "Not win"
        else if (/^Will\s+.+\s+not\s+win/i.test(question)) {
            entityName = 'Not win';
        }
        // "Will the X have the largest/biggest..." format
        else if (/^Will\s+the\s+(.+?)\s+(?:have|be)\s+the\s+(?:largest|biggest|highest|most)/i.test(question)) {
            const match = question.match(/^Will\s+the\s+(.+?)\s+(?:have|be)\s+the\s+(?:largest|biggest|highest|most)/i);
            entityName = match ? match[1].trim() : question;
        }
        // Margin/percentage
        else if (/win\s+by\s+([\d.]+%?\s*[-–—]\s*[\d.]+%?)/i.test(question)) {
            const match = question.match(/win\s+by\s+([\d.]+%?\s*[-–—]\s*[\d.]+%?)/i);
            entityName = match ? match[1].trim() : question;
        }
        // Number of things
        else if (/win\s+(\d+\s+\w+)/i.test(question)) {
            const match = question.match(/win\s+(\d+\s+\w+)/i);
            entityName = match ? match[1].trim() : question;
        }
        // "finish second" or "come second" or "place second"
        else if (/^Will\s+(.+?)\s+(?:finish|come|place|win)\s+(?:in\s+)?second(?:\s+place)?/i.test(question)) {
            const match = question.match(/^Will\s+(.+?)\s+(?:finish|come|place|win)\s+(?:in\s+)?second(?:\s+place)?/i);
            entityName = match ? match[1].trim() : question;
        }
        // Location/place: "Will X win The Bronx" or "win Brooklyn"
        else if (/win\s+((?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+in\s+the/i.test(question)) {
            const match = question.match(/win\s+((?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+in\s+the/i);
            entityName = match ? match[1].trim() : question;
        }
        // Price ranges
        else if (/between\s+\$([\d,]+(?:\.\d+)?)\s+and\s+\$([\d,]+(?:\.\d+)?)/i.test(question)) {
            const match = question.match(/between\s+\$([\d,]+(?:\.\d+)?)\s+and\s+\$([\d,]+(?:\.\d+)?)/i);
            entityName = match ? `$${match[1]}-$${match[2]}` : question;
        }
        else if (/less than\s+\$([\d,]+(?:\.\d+)?)/i.test(question)) {
            const match = question.match(/less than\s+\$([\d,]+(?:\.\d+)?)/i);
            entityName = match ? `< $${match[1]}` : question;
        }
        else if (/above\s+\$([\d,]+(?:\.\d+)?)/i.test(question)) {
            const match = question.match(/above\s+\$([\d,]+(?:\.\d+)?)/i);
            entityName = match ? `> $${match[1]}` : question;
        }
        // Endorsement
        else if (/endorse\s+(.+?)\s+for/i.test(question)) {
            const match = question.match(/endorse\s+(.+?)\s+for/i);
            entityName = match ? match[1].trim() : question;
        }
        else if (/make no endorsement/i.test(question)) {
            entityName = 'No endorsement';
        }
        // Team win with date
        else if (/^Will\s+(.+)\s+win\s+on\s+\d{4}-\d{2}-\d{2}/i.test(question)) {
            const match = question.match(/^Will\s+(.+)\s+win\s+on\s+\d{4}-\d{2}-\d{2}/i);
            entityName = match ? match[1].trim() : question;
        }
        // Generic win: "Will X win [anything]?"
        else if (/^Will\s+(.+?)\s+(?:win|be\s+elected|be\s+the)/i.test(question)) {
            const match = question.match(/^Will\s+(.+?)\s+(?:win|be\s+elected|be\s+the)/i);
            entityName = match ? match[1].trim() : question;
        }
        // Reach/dip price
        else if (/reach\s+\$([\d,]+)/i.test(question)) {
            const match = question.match(/reach\s+\$([\d,]+)/i);
            entityName = match ? `$${match[1]}` : question;
        }
        else if (/dip to\s+\$([\d,]+)/i.test(question)) {
            const match = question.match(/dip to\s+\$([\d,]+)/i);
            entityName = match ? `$${match[1]}` : question;
        }
        // Fallback: try to extract a name-like pattern, but skip common question words
        else {
            // Remove "Will" and "the" from the start, then find proper nouns
            const cleaned = question.replace(/^Will\s+the\s+/i, '').replace(/^Will\s+/i, '');
            const nameMatch = cleaned.match(/^([A-Z][a-zA-Z\s&'.-]+?)(?:\s+(?:win|have|be|end|vs\.|election|referendum))/i);
            if (nameMatch) {
                entityName = nameMatch[1].trim();
            } else {
                entityName = cleaned.replace(/\?$/, '').trim();
                if (entityName.length > 50) {
                    entityName = entityName.substring(0, 47) + '...';
                }
            }
        }

        return entityName;
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
    async getTrendingMarkets(limit: number = 50): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets({ active: true, limit: 500 });

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
    async getProfitableMarkets(limit: number = 50): Promise<Market[]> {
        try {
            const markets = await this.getAllMarkets({ active: true, limit: 500 });

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

}

// Export singleton instance
export const gammaClient = new GammaClient();

