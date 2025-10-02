import { NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

/**
 * Initialize Polymarket API keys (server-side only)
 * Call this endpoint once to derive and cache API keys
 */
export async function POST() {
    try {
        const apiKeys = await getPolymarketApiKeys();

        return NextResponse.json({
            success: true,
            message: 'API keys initialized',
            hasKeys: !!apiKeys,
        });
    } catch (error: any) {
        console.error('Failed to initialize API keys:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            hint: 'Make sure POLYMARKET_PRIVATE_KEY is set in .env.local'
        }, { status: 500 });
    }
}

/**
 * Check if API keys are initialized
 */
export async function GET() {
    try {
        const privateKey = process.env.POLYMARKET_PRIVATE_KEY;

        return NextResponse.json({
            configured: !!privateKey,
            message: privateKey
                ? 'Private key is configured'
                : 'Private key not found in environment'
        });
    } catch (error: any) {
        return NextResponse.json({
            configured: false,
            error: error.message
        }, { status: 500 });
    }
}

