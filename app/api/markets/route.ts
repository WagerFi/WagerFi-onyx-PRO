import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const active = searchParams.get('active');
        const closed = searchParams.get('closed');
        const limit = searchParams.get('limit') || '500';  // Increased default to get more markets
        const offset = searchParams.get('offset') || '0';

        // Force active and not closed for real current markets
        const params: any = {
            limit,
            offset,
            active: true,
            closed: false,
            _t: Date.now(), // Cache buster
        };

        // Allow override if explicitly specified
        if (active === 'false') params.active = false;
        if (closed === 'true') params.closed = true;

        console.log('📡 Fetching markets from Polymarket with params:', params);

        const response = await axios.get(`${GAMMA_API_BASE}/markets`, {
            params,
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'onyx-market/1.0'
            }
        });

        console.log(`✅ Fetched ${response.data?.length || 0} markets from Polymarket`);

        // Analyze market outcome distribution
        const allMarkets = response.data || [];
        const marketsByOutcomes: Record<string, number> = {};

        allMarkets.forEach((market: any) => {
            let outcomeCount = 0;
            if (typeof market.outcomes === 'string') {
                try {
                    const parsed = JSON.parse(market.outcomes);
                    outcomeCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch {
                    outcomeCount = 0;
                }
            } else if (Array.isArray(market.outcomes)) {
                outcomeCount = market.outcomes.length;
            }

            marketsByOutcomes[outcomeCount] = (marketsByOutcomes[outcomeCount] || 0) + 1;
        });

        console.log('📊 Markets by outcome count:', marketsByOutcomes);

        // Find and log a multi-outcome market example
        const multiOutcome = allMarkets.find((m: any) => {
            if (typeof m.outcomes === 'string') {
                try {
                    const parsed = JSON.parse(m.outcomes);
                    return Array.isArray(parsed) && parsed.length > 2;
                } catch {
                    return false;
                }
            }
            return Array.isArray(m.outcomes) && m.outcomes.length > 2;
        });

        if (multiOutcome) {
            console.log('🎯 Found multi-outcome market example:', {
                question: multiOutcome.question,
                outcomes: multiOutcome.outcomes,
                outcomePrices: multiOutcome.outcomePrices,
            });
        } else {
            console.warn('⚠️ NO multi-outcome markets in API response!');
        }

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('❌ Error fetching markets:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to fetch markets', details: error.response?.data || error.message },
            { status: error.response?.status || 500 }
        );
    }
}

