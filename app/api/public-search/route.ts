import { NextRequest, NextResponse } from 'next/server';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Build the Polymarket API URL with all query parameters
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (key !== '_t') { // Exclude our cache-busting param
                params.append(key, value);
            }
        });

        const url = `${GAMMA_API_BASE}/public-search?${params.toString()}`;

        console.log('🔍 Proxying search to Polymarket:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('❌ Polymarket search failed:', response.status, response.statusText);
            return NextResponse.json(
                { error: 'Failed to search markets', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();

        console.log('✅ Search returned:', {
            events: data.events?.length || 0,
            tags: data.tags?.length || 0,
            profiles: data.profiles?.length || 0,
        });

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error: any) {
        console.error('❌ Error proxying search request:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

