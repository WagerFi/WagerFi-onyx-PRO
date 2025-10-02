import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const active = searchParams.get('active');
        const closed = searchParams.get('closed');
        const limit = searchParams.get('limit') || '50';
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

        console.log('Fetching markets with params:', params);

        const response = await axios.get(`${GAMMA_API_BASE}/markets`, {
            params,
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'onyx-market/1.0'
            }
        });

        console.log(`Fetched ${response.data?.length || 0} markets`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching markets:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to fetch markets', details: error.response?.data || error.message },
            { status: error.response?.status || 500 }
        );
    }
}

