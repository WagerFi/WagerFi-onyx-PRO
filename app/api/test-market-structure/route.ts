import { NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET() {
    try {
        console.log('🧪 Testing Polymarket API structure...');

        // Fetch events (which contain grouped markets)
        const response = await axios.get(`${GAMMA_API_BASE}/events`, {
            params: {
                limit: 100,
                order: 'id',
                ascending: false,
                closed: false,
                _t: Date.now(),
            },
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'onyx-market/1.0'
            }
        });

        const events = response.data || [];
        const markets: any[] = [];

        // Extract all markets from events
        events.forEach((event: any) => {
            if (event.markets && Array.isArray(event.markets)) {
                event.markets.forEach((market: any) => {
                    markets.push({ ...market, eventTitle: event.title, eventMarketCount: event.markets.length });
                });
            }
        });

        // Analyze structure
        const analysis = {
            totalMarkets: markets.length,
            totalEvents: events.length,
            eventsWithMultipleMarkets: events.filter((e: any) => e.markets && e.markets.length > 1).length,
            samples: {
                singleMarketEvent: null as any,
                multiMarketEvent: null as any,
            },
            marketCountByEvent: {} as Record<string, number>,
        };

        // Count markets per event
        events.forEach((event: any) => {
            const count = event.markets ? event.markets.length : 0;
            analysis.marketCountByEvent[count] = (analysis.marketCountByEvent[count] || 0) + 1;

            // Capture samples
            if (count === 1 && !analysis.samples.singleMarketEvent) {
                analysis.samples.singleMarketEvent = {
                    eventTitle: event.title,
                    marketQuestion: event.markets[0].question,
                };
            }

            if (count > 2 && !analysis.samples.multiMarketEvent) {
                analysis.samples.multiMarketEvent = {
                    eventTitle: event.title,
                    marketCount: count,
                    markets: event.markets.map((m: any) => ({
                        question: m.question,
                        outcomes: m.outcomes,
                        outcomePrices: m.outcomePrices,
                    })).slice(0, 5),
                };
            }
        });


        return NextResponse.json({
            success: true,
            analysis,
            message: analysis.samples.multiMarketEvent
                ? `✅ Found events with multiple markets! (${analysis.eventsWithMultipleMarkets} events with 2+ markets)`
                : '⚠️ No multi-market events in first 100 results'
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                details: error.response?.data
            },
            { status: 500 }
        );
    }
}

