import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CLOB_API_BASE = 'https://clob.polymarket.com';

/**
 * Fetch current prices for multiple token IDs
 * Uses the CLOB sampling-simplified-markets endpoint
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tokenIds = searchParams.get('token_ids');

        if (!tokenIds) {
            return NextResponse.json(
                { error: 'token_ids parameter required (comma-separated)' },
                { status: 400 }
            );
        }

        const tokenIdArray = tokenIds.split(',');

        // Fetch prices for all tokens
        const pricePromises = tokenIdArray.map(async (tokenId) => {
            try {
                const response = await axios.get(`${CLOB_API_BASE}/prices`, {
                    params: { token_id: tokenId },
                    timeout: 5000,
                });

                // Extract mid price from order book
                const data = response.data;
                let price = 0.5; // Default

                if (data && data.mid) {
                    price = parseFloat(data.mid);
                }

                return { tokenId, price };
            } catch (error) {
                console.error(`Error fetching price for ${tokenId}:`, error);
                return { tokenId, price: 0.5 };
            }
        });

        const prices = await Promise.all(pricePromises);

        return NextResponse.json({ prices });
    } catch (error: any) {
        console.error('Error fetching prices:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch prices', details: error.message },
            { status: 500 }
        );
    }
}

