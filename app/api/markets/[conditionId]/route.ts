import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ conditionId: string }> }
) {
    try {
        const params = await context.params;
        const { conditionId } = params;

        console.log('🔍 Fetching market by condition ID:', conditionId);

        // Try fetching from events endpoint and filter for the specific market
        // We need to search through multiple pages since we don't know which event contains our market
        let foundMarket = null;
        let offset = 0;
        const limit = 100;
        const maxPages = 10; // Search through up to 1000 markets

        for (let page = 0; page < maxPages; page++) {
            const eventsResponse = await axios.get(`${GAMMA_API_BASE}/events`, {
                params: {
                    closed: false,
                    limit,
                    offset,
                },
                timeout: 30000,
                headers: {
                    'User-Agent': 'onyx.market/1.0',
                },
            });

            const events = eventsResponse.data || [];
            if (events.length === 0) break; // No more events

            // Find the market within the events
            for (const event of events) {
                if (event.markets) {
                    const market = event.markets.find((m: any) =>
                        m.condition_id === conditionId ||
                        m.conditionId === conditionId ||
                        m.id === conditionId
                    );

                    if (market) {
                        console.log('✅ Found market:', market.question);
                        foundMarket = market;
                        break;
                    }
                }
            }

            if (foundMarket) break;
            offset += limit;
        }

        if (foundMarket) {
            // Parse JSON strings similar to the main events endpoint
            if (foundMarket.outcomes && typeof foundMarket.outcomes === 'string') {
                try {
                    foundMarket.outcomes = JSON.parse(foundMarket.outcomes);
                } catch (e) {
                    console.warn('Failed to parse outcomes');
                }
            }
            if (foundMarket.outcomePrices && typeof foundMarket.outcomePrices === 'string') {
                try {
                    foundMarket.outcomePrices = JSON.parse(foundMarket.outcomePrices);
                } catch (e) {
                    console.warn('Failed to parse outcomePrices');
                }
            }
            if (foundMarket.clobTokenIds && typeof foundMarket.clobTokenIds === 'string') {
                try {
                    foundMarket.clobTokenIds = JSON.parse(foundMarket.clobTokenIds);
                } catch (e) {
                    console.warn('Failed to parse clobTokenIds');
                }
            }

            return NextResponse.json(foundMarket);
        }

        // If not found, return 404
        console.log('❌ Market not found for condition ID:', conditionId);
        return NextResponse.json(
            { error: 'Market not found' },
            { status: 404 }
        );
    } catch (error: any) {
        console.error('❌ Error fetching market:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch market', details: error.message },
            { status: error.response?.status || 500 }
        );
    }
}

