import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DATA_API_BASE = 'https://data-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const market = searchParams.get('market');

        if (!market) {
            return NextResponse.json(
                { error: 'Market ID is required' },
                { status: 400 }
            );
        }

        // Try different endpoints/parameters
        try {
            // Try with condition_id parameter
            const response = await axios.get(`${DATA_API_BASE}/top-holders`, {
                params: {
                    condition_id: market,
                },
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            return NextResponse.json(response.data || [], {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            });
        } catch (apiError: any) {
            // If top holders endpoint fails, return empty array
            console.log('Top holders not available for this market:', market);
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            });
        }
    } catch (error: any) {
        console.error('Error fetching top holders:', error.message);
        return NextResponse.json([], {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    }
}

