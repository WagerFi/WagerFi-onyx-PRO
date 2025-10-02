import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token_id = searchParams.get('token_id');
        const limit = searchParams.get('limit');

        const params: any = {};
        if (token_id) params.token_id = token_id;
        if (limit) params.limit = limit;

        const response = await axios.get(`${GAMMA_API_BASE}/trades`, {
            params,
            timeout: 30000,
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching trades:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch trades', details: error.message },
            { status: error.response?.status || 500 }
        );
    }
}

