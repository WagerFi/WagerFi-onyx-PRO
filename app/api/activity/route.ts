import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CLOB_API_BASE = 'https://clob.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const market = searchParams.get('market');
        const token_id = searchParams.get('token_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Use CLOB API for trades
        // This endpoint requires either asset_id (token_id) or market
        if (!market && !token_id) {
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
                },
            });
        }

        try {
            // Build the request URL with query parameters
            let url = `${CLOB_API_BASE}/trades`;
            const params = new URLSearchParams();

            if (token_id) {
                params.append('asset_id', token_id);
            }
            if (market) {
                params.append('market', market);
            }

            params.append('_limit', limit.toString());

            const fullUrl = `${url}?${params.toString()}`;

            const response = await axios.get(fullUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                },
                validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            });

            // If we got data, return it, otherwise return empty array
            if (response.status === 200 && response.data) {
                return NextResponse.json(Array.isArray(response.data) ? response.data : [], {
                    headers: {
                        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
                    },
                });
            }

            // For any non-200 status, return empty array silently
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
                },
            });
        } catch (apiError: any) {
            // Silently return empty array on any error
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
                },
            });
        }
    } catch (error: any) {
        // Silently return empty array on any error
        return NextResponse.json([], {
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
            },
        });
    }
}

