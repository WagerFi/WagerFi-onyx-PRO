import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CLOB_API_BASE = 'https://clob.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token_id = searchParams.get('token_id');

        if (!token_id) {
            return NextResponse.json(
                { error: 'token_id parameter is required' },
                { status: 400 }
            );
        }

        const response = await axios.get(`${CLOB_API_BASE}/book`, {
            params: { token_id },
            timeout: 30000,
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching order book:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch order book', details: error.message },
            { status: error.response?.status || 500 }
        );
    }
}

