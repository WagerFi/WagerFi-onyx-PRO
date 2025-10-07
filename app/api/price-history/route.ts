import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const market = searchParams.get('market');
        const startTs = searchParams.get('startTs');
        const endTs = searchParams.get('endTs');
        const fidelity = searchParams.get('fidelity') || '60'; // 60 seconds default

        if (!market) {
            return NextResponse.json({ error: 'Market ID required' }, { status: 400 });
        }

        // Fetch price history from Gamma API
        const params: any = {
            market: market,
            fidelity: fidelity,
        };

        if (startTs) params.startTs = startTs;
        if (endTs) params.endTs = endTs;

        const response = await axios.get(`${GAMMA_API_BASE}/prices-history`, {
            params,
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
            },
            validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data) {
            return NextResponse.json(response.data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            });
        }

        // Return empty array for non-200 responses
        return NextResponse.json({ history: [] }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    } catch (error: any) {
        console.error('Error fetching price history:', error?.response?.data || error?.message);
        // Return empty array on error
        return NextResponse.json({ history: [] }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    }
}

