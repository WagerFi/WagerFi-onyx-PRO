'use client';

import { useState, useEffect, useCallback } from 'react';
import { clobClient } from '@/lib/polymarket/clob-client';
import { wsClient } from '@/lib/polymarket/websocket-client';
import type { OrderBookSummary } from '@/lib/polymarket/types';

export function useOrderBook(tokenId: string | null) {
    const [orderBook, setOrderBook] = useState<OrderBookSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderBook = useCallback(async () => {
        if (!tokenId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await clobClient.getOrderBook(tokenId);
            setOrderBook(data);
        } catch (err: any) {
            console.error('Error fetching order book:', err);
            setError(err.message || 'Failed to fetch order book');
        } finally {
            setLoading(false);
        }
    }, [tokenId]);

    useEffect(() => {
        if (!tokenId) return;

        // Initial fetch
        fetchOrderBook();

        // Try to subscribe to WebSocket for real-time updates
        const handleBookUpdate = (data: any) => {
            console.log('📊 WebSocket order book update:', data);

            if (data.asset_id === tokenId || data.market) {
                // Handle both 'book' and 'price_change' event types
                if (data.event_type === 'book') {
                    // Full order book snapshot
                    setOrderBook({
                        market: data.market || '',
                        asset_id: data.asset_id,
                        hash: data.hash || '',
                        bids: data.bids || [],
                        asks: data.asks || [],
                        timestamp: parseInt(data.timestamp) || Date.now(),
                    });
                } else if (data.event_type === 'price_change') {
                    // Incremental update - refetch to get full book
                    fetchOrderBook();
                }
            }
        };

        // Subscribe to WebSocket updates (will only work if API keys are configured)
        wsClient.on('book_update', handleBookUpdate);
        wsClient.subscribeToOrderBook(tokenId);

        // Fallback polling every 10 seconds (primary method until API keys configured)
        const interval = setInterval(fetchOrderBook, 10000);

        return () => {
            wsClient.off('book_update', handleBookUpdate);
            wsClient.unsubscribe(`book_${tokenId}`);
            clearInterval(interval);
        };
    }, [tokenId, fetchOrderBook]);

    return {
        orderBook,
        loading,
        error,
        refetch: fetchOrderBook,
    };
}

