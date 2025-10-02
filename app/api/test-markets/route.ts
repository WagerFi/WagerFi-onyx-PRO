import { NextResponse } from 'next/server';
import axios from 'axios';

// Test endpoint to check Polymarket API directly
export async function GET() {
    try {
        console.log('Testing Polymarket API...');

        const response = await axios.get('https://gamma-api.polymarket.com/markets', {
            params: {
                limit: 5,
                _t: Date.now()
            },
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        return NextResponse.json({
            success: true,
            count: response.data?.length || 0,
            sample: response.data?.[0] || null,
            allMarkets: response.data
        });
    } catch (error: any) {
        console.error('Test API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.response?.data,
            status: error.response?.status
        }, { status: 500 });
    }
}

