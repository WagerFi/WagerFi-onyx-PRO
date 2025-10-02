import { NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

/**
 * Get WebSocket authentication credentials
 * This endpoint provides the API keys needed for authenticated WebSocket connections
 */
export async function GET() {
    try {
        const apiKeys = await getPolymarketApiKeys();

        return NextResponse.json({
            success: true,
            auth: {
                apiKey: apiKeys.apiKey,
                secret: apiKeys.apiSecret,
                passphrase: apiKeys.apiPassphrase,
            },
        });
    } catch (error: any) {
        console.warn('⚠️ WebSocket auth not available:', error.message);

        return NextResponse.json({
            success: false,
            message: 'API keys not initialized. WebSocket will use public data only.',
        }, { status: 200 }); // Return 200 to avoid errors, just no auth
    }
}

