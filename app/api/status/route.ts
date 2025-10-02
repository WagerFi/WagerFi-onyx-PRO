import { NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

/**
 * Get status of all Polymarket integrations
 */
export async function GET() {
    const status: any = {
        timestamp: new Date().toISOString(),
        environment: {
            hasPrivateKey: !!process.env.POLYMARKET_PRIVATE_KEY,
        },
        apiKeys: {
            initialized: false,
            error: null,
        },
        integrations: {
            gammaApi: 'Ready (public)',
            clobApi: 'Waiting for API keys',
            websocket: 'Waiting for API keys',
        },
    };

    // Try to get API keys
    try {
        const apiKeys = await getPolymarketApiKeys();
        status.apiKeys.initialized = !!apiKeys;

        if (apiKeys) {
            status.integrations.clobApi = '✅ Ready (authenticated)';
            status.integrations.websocket = '✅ Ready (authenticated)';
        }
    } catch (error: any) {
        status.apiKeys.error = error.message;
    }

    return NextResponse.json(status, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

