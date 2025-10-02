import { NextRequest, NextResponse } from 'next/server';
import { getPolymarketApiKeys } from '@/lib/polymarket/api-keys';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signedOrders, orderType = 'GTC', owner } = body;

        if (!signedOrders || !Array.isArray(signedOrders) || signedOrders.length === 0) {
            return NextResponse.json(
                { error: 'signedOrders array is required' },
                { status: 400 }
            );
        }

        console.log(`📝 Placing ${signedOrders.length} orders in batch...`);

        // Get API credentials
        const apiKeys = await getPolymarketApiKeys();

        const results = {
            success: true,
            orderIDs: [] as string[],
            errors: [] as string[],
            statuses: [] as string[],
        };

        // Process each order
        for (let i = 0; i < signedOrders.length; i++) {
            const signedOrder = signedOrders[i];

            try {
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

                const payload = {
                    order: signedOrder,
                    owner: owner || signedOrder.maker,
                    orderType: orderType,
                };

                const response = await fetch('https://clob.polymarket.com/order', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok && data.orderID) {
                    results.orderIDs.push(data.orderID);
                    results.statuses.push(data.status || 'unknown');
                    console.log(`✅ Order ${i + 1}/${signedOrders.length} placed: ${data.orderID}`);
                } else {
                    const errorMsg = data.errorMsg || 'Unknown error';
                    results.errors.push(`Order ${i + 1}: ${errorMsg}`);
                    console.error(`❌ Order ${i + 1}/${signedOrders.length} failed:`, errorMsg);
                }
            } catch (error: any) {
                results.errors.push(`Order ${i + 1}: ${error.message}`);
                console.error(`❌ Error placing order ${i + 1}:`, error);
            }
        }

        const allSucceeded = results.errors.length === 0;

        console.log(`📊 Batch complete: ${results.orderIDs.length}/${signedOrders.length} succeeded`);

        return NextResponse.json({
            success: allSucceeded,
            orderIDs: results.orderIDs,
            statuses: results.statuses,
            errors: results.errors.length > 0 ? results.errors : undefined,
            summary: {
                total: signedOrders.length,
                succeeded: results.orderIDs.length,
                failed: results.errors.length,
            },
        });
    } catch (error: any) {
        console.error('❌ Error placing batch orders:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to place batch orders',
                details: error.message
            },
            { status: 500 }
        );
    }
}

