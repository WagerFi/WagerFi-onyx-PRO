import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

function parseMarketFields(market: any) {
    // Parse JSON strings similar to the main events endpoint
    if (market.outcomes && typeof market.outcomes === 'string') {
        try {
            market.outcomes = JSON.parse(market.outcomes);
        } catch (e) {
            console.warn('Failed to parse outcomes');
        }
    }
    if (market.outcomePrices && typeof market.outcomePrices === 'string') {
        try {
            market.outcomePrices = JSON.parse(market.outcomePrices);
        } catch (e) {
            console.warn('Failed to parse outcomePrices');
        }
    }
    if (market.clobTokenIds && typeof market.clobTokenIds === 'string') {
        try {
            market.clobTokenIds = JSON.parse(market.clobTokenIds);
        } catch (e) {
            console.warn('Failed to parse clobTokenIds');
        }
    }
    return market;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const id = params.id;
        console.log('📡 Fetching market/event from Polymarket API, ID:', id);

        // Try to fetch as a market first
        let response = await fetch(`${GAMMA_API_BASE}/markets/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Fetched market:', data.question);
            return NextResponse.json(data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            });
        }

        // If not found as a market, search for it as an event using Polymarket's search API
        if (response.status === 404) {
            console.log('⚠️ Not found in /markets, searching via /events endpoint with ID:', id);

            // Try direct event fetch first (Polymarket supports /events/{id})
            const eventDirectResponse = await fetch(`${GAMMA_API_BASE}/events/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (eventDirectResponse.ok) {
                const event = await eventDirectResponse.json();
                console.log('✅ Found event via direct fetch:', event.title || event.question, 'with', event.markets?.length || 0, 'markets');
                return NextResponse.json(event, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                    },
                });
            }

            console.log('⚠️ Direct event fetch failed, trying search...');

            // If direct fetch fails, use public search
            const searchResponse = await fetch(`${GAMMA_API_BASE}/public-search?q=${encodeURIComponent(id)}&limit_per_type=100&_t=${Date.now()}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const events = searchData.events || [];
                console.log(`📊 Search returned ${events.length} events for ID: ${id}`);

                // Find event by exact ID match
                const searchId = String(id);
                const event = events.find((e: any) => {
                    const eventId = String(e.id || '');
                    const eventSlug = String(e.slug || '');
                    const eventEventId = String(e.event_id || '');

                    return eventId === searchId || eventSlug === searchId || eventEventId === searchId;
                });

                if (event) {
                    console.log('✅ Found event via search:', event.title, 'with', event.markets?.length || 0, 'markets');
                    console.log(`📋 Event details: ID=${event.id}, Slug=${event.slug}`);
                    return NextResponse.json(event, {
                        headers: {
                            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                        },
                    });
                } else {
                    console.log('⚠️ Event not found in search results. Searched ID:', id);
                    if (events.length > 0) {
                        console.log('Sample event IDs from search:', events.slice(0, 5).map((e: any) => ({
                            id: e.id,
                            event_id: e.event_id,
                            slug: e.slug,
                            title: e.title
                        })));
                    }
                }
            } else {
                console.error('❌ Search API request failed:', searchResponse.status, searchResponse.statusText);
            }

            // Last resort: try searching by condition ID through events
            console.log('⚠️ Searching by condition ID through events...');
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

                const eventsData = eventsResponse.data || [];
                if (eventsData.length === 0) break; // No more events

                // Find the market within the events by condition_id
                for (const event of eventsData) {
                    if (event.markets) {
                        const market = event.markets.find((m: any) =>
                            m.condition_id === id ||
                            m.conditionId === id ||
                            m.id === id
                        );

                        if (market) {
                            console.log('✅ Found market by condition ID:', market.question);
                            foundMarket = parseMarketFields(market);
                            break;
                        }
                    }
                }

                if (foundMarket) break;
                offset += limit;
            }

            if (foundMarket) {
                return NextResponse.json(foundMarket, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                    },
                });
            }
        }

        console.error('❌ Market/event not found:', id);
        return NextResponse.json(
            { error: 'Market not found' },
            { status: 404 }
        );
    } catch (error: any) {
        console.error('❌ Error fetching market/event:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

