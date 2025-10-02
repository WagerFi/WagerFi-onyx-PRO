import { NextRequest, NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderID, owner } = body;

        if (!orderID) {
            return NextResponse.json(
                { error: 'orderID is required' },
                { status: 400 }
            );
        }

        console.log('🚫 Canceling order:', orderID);

        // Get API credentials
        const apiKeys = await getPolymarketApiKeys();

        const headers = {
            'Content-Type': 'application/json',
            'POLY-API-KEY': apiKeys.apiKey,
            'POLY-PASSPHRASE': apiKeys.apiPassphrase,
        };

        const payload = {
            orderID,
        };

        const response = await fetch('https://clob.polymarket.com/order', {
            method: 'DELETE',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Order cancellation failed:', data);
            return NextResponse.json(
                { success: false, error: data.error || 'Failed to cancel order' },
                { status: response.status }
            );
        }

        console.log('✅ Order canceled successfully');

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error: any) {
        console.error('❌ Error canceling order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to cancel order', details: error.message },
            { status: 500 }
        );
    }
}

