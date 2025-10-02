import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get('limit') || '500';  // Increased default limit
        const offset = searchParams.get('offset') || '0';
        const closed = searchParams.get('closed');

        // Use the recommended approach from Polymarket docs
        const params: any = {
            limit,
            offset,
            order: 'id',
            ascending: false,
            closed: closed === 'true' ? true : false,
            _t: Date.now(), // Cache buster
        };

        console.log('Fetching events with params:', params);

        const response = await axios.get(`${GAMMA_API_BASE}/events`, {
            params,
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'onyx-market/1.0'
            }
        });

        console.log(`Fetched ${response.data?.length || 0} events from Polymarket`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching events:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to fetch events', details: error.response?.data || error.message },
            { status: error.response?.status || 500 }
        );
    }
}

