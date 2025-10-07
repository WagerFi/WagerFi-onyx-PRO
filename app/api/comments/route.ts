import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const market = searchParams.get('market');
        const limit = searchParams.get('limit') || '20';
        const offset = searchParams.get('offset') || '0';
        const holdersOnly = searchParams.get('holders_only') === 'true';
        const order = searchParams.get('order') || 'createdAt';
        const ascending = searchParams.get('ascending') === 'true';

        if (!market) {
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                },
            });
        }

        // Try to fetch comments using the correct parameters
        // Note: parent_entity_type must be capitalized: 'Event', 'Series', or 'market'
        try {
            const response = await axios.get(`${GAMMA_API_BASE}/comments`, {
                params: {
                    parent_entity_type: 'Event', // Must be capitalized!
                    parent_entity_id: market,
                    limit: limit,
                    offset: offset,
                    holders_only: holdersOnly,
                    order: order,
                    ascending: ascending,
                },
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                },
                validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            });

            if (response.status === 200 && response.data) {
                return NextResponse.json(Array.isArray(response.data) ? response.data : [], {
                    headers: {
                        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                    },
                });
            }

            // Return empty array for non-200 responses
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                },
            });
        } catch (apiError: any) {
            // Silently return empty array
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                },
            });
        }
    } catch (error: any) {
        // Silently return empty array
        return NextResponse.json([], {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        });
    }
}

