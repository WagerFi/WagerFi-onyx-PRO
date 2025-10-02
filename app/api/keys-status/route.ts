import { NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

/**
 * Get masked API keys for display purposes
 */
export async function GET() {
    try {
        const apiKeys = await getPolymarketApiKeys();

        // Mask the keys for security (show first 8 chars and last 4 chars)
        const maskKey = (key: string) => {
            if (!key || key.length < 12) return '***';
            return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
        };

        return NextResponse.json({
            success: true,
            keys: {
                apiKey: maskKey(apiKeys.apiKey),
                apiSecret: maskKey(apiKeys.apiSecret),
                apiPassphrase: maskKey(apiKeys.apiPassphrase),
            },
            fullKeys: {
                apiKey: apiKeys.apiKey,
                apiSecret: apiKeys.apiSecret,
                apiPassphrase: apiKeys.apiPassphrase,
            },
            note: 'These keys are derived from your private key and cached in memory',
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}

