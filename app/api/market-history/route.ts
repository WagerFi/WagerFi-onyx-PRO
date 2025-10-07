import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Polymarket CLOB API for historical trade data
const CLOB_API_BASE = 'https://clob.polymarket.com';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tokenId = searchParams.get('token_id');

        if (!tokenId) {
            return NextResponse.json({ error: 'token_id required' }, { status: 400 });
        }

        console.log('📊 Fetching historical trade data for token:', tokenId);

        // Fetch trades from CLOB API
        const response = await axios.get(`${CLOB_API_BASE}/trades`, {
            params: {
                asset_id: tokenId,
                // Get more trades to build a longer history
                limit: 1000,
            },
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
            },
            validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            const trades = response.data;

            console.log('📊 Received', trades.length, 'trades from CLOB');

            // Aggregate trades into hourly buckets
            const hourlyData: { [timestamp: number]: { prices: number[], volumes: number[] } } = {};

            trades.forEach((trade: any) => {
                // trade.timestamp is in seconds
                const tradeTime = parseInt(trade.timestamp);
                const hourTimestamp = Math.floor(tradeTime / 3600) * 3600;

                // Price is a decimal string (0.0 to 1.0)
                const price = parseFloat(trade.price);
                const size = parseFloat(trade.size || '0');

                if (!hourlyData[hourTimestamp]) {
                    hourlyData[hourTimestamp] = { prices: [], volumes: [] };
                }
                hourlyData[hourTimestamp].prices.push(price);
                hourlyData[hourTimestamp].volumes.push(size);
            });

            // Convert to time series with volume-weighted average prices
            const history = Object.entries(hourlyData)
                .map(([timestamp, data]) => {
                    // Volume-weighted average price
                    const totalVolume = data.volumes.reduce((a, b) => a + b, 0);
                    const weightedSum = data.prices.reduce((sum, price, idx) =>
                        sum + price * data.volumes[idx], 0
                    );
                    const avgPrice = totalVolume > 0 ? weightedSum / totalVolume :
                        data.prices.reduce((a, b) => a + b, 0) / data.prices.length;

                    return {
                        t: parseInt(timestamp),
                        p: avgPrice.toString(),
                        volume: totalVolume
                    };
                })
                .sort((a, b) => a.t - b.t);

            console.log('📊 Transformed', history.length, 'hourly data points from', trades.length, 'trades');

            return NextResponse.json({ history }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            });
        }

        console.log('📊 No trade data available (status:', response.status, ')');
        // No data found
        return NextResponse.json({ history: [] }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    } catch (error: any) {
        console.error('Error fetching market history from CLOB:', error?.response?.data || error?.message);
        return NextResponse.json({ history: [] }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    }
}

