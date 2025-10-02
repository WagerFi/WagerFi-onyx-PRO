import { NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

/**
 * Debug endpoint to see raw market data structure
 */
export async function GET() {
    try {
        console.log('🔍 Fetching sample event for debugging...');

        const response = await axios.get(`${GAMMA_API_BASE}/events`, {
            params: {
                limit: 1,
                order: 'id',
                ascending: false,
                closed: false,
            },
            timeout: 30000,
        });

        const event = response.data?.[0];

        if (!event) {
            return NextResponse.json({ error: 'No events found' }, { status: 404 });
        }

        const market = event.markets?.[0];

        return NextResponse.json({
            success: true,
            event: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                marketsCount: event.markets?.length,
            },
            market: market,
            availableFields: market ? Object.keys(market) : [],
            priceFields: {
                outcome_prices: market?.outcome_prices,
                outcomePrices: market?.outcomePrices,
                tokens: market?.tokens,
                outcomes: market?.outcomes,
            }
        });
    } catch (error: any) {
        console.error('Debug API Error:', error.message);

        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.response?.data
        }, { status: 500 });
    }
}

