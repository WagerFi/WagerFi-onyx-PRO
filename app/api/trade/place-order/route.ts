import { NextRequest, NextResponse } from 'next/server';
import { getClobClient, getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signedOrder, orderType = 'GTC', owner } = body;

        if (!signedOrder) {
            return NextResponse.json(
                { error: 'signedOrder is required' },
                { status: 400 }
            );
        }

        console.log('📝 Placing order:', { orderType, owner });

        // Get API credentials
        const apiKeys = await getPolymarketApiKeys();

        // Create authentication headers
        const timestamp = Date.now().toString();
        const headers = {
            'Content-Type': 'application/json',
            'POLY-ADDRESS': owner || signedOrder.maker,
            'POLY-SIGNATURE': signedOrder.signature,
            'POLY-TIMESTAMP': timestamp,
            'POLY-NONCE': signedOrder.nonce,
            'POLY-API-KEY': apiKeys.apiKey,
            'POLY-PASSPHRASE': apiKeys.apiPassphrase,
        };

        // Prepare order payload
        const payload = {
            order: signedOrder,
            owner: owner || signedOrder.maker,
            orderType: orderType, // GTC, FOK, or GTD
        };

        console.log('📡 Submitting order to CLOB API...');

        // Submit to Polymarket CLOB
        const response = await fetch('https://clob.polymarket.com/order', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Order placement failed:', data);
            return NextResponse.json(
                {
                    success: false,
                    error: data.errorMsg || 'Failed to place order',
                    details: data
                },
                { status: response.status }
            );
        }

        console.log('✅ Order placed successfully:', data);

        return NextResponse.json({
            success: true,
            orderID: data.orderID,
            transactionHash: data.transactionHash,
            status: data.status, // matched, live, delayed, unmatched
            orderHashes: data.orderHashes,
            ...data,
        });
    } catch (error: any) {
        console.error('❌ Error placing order:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to place order',
                details: error.message
            },
            { status: 500 }
        );
    }
}

