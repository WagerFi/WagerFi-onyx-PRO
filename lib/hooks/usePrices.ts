'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PriceData {
    [tokenId: string]: number;
}

/**
 * Hook to fetch and cache prices for token IDs
 */
export function usePrices(tokenIds: string[] | undefined) {
    const [prices, setPrices] = useState<PriceData>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tokenIds || tokenIds.length === 0) return;

        const fetchPrices = async () => {
            setLoading(true);

            try {
                // Batch fetch prices (max 50 at a time to avoid long URLs)
                const batches: string[][] = [];
                for (let i = 0; i < tokenIds.length; i += 50) {
                    batches.push(tokenIds.slice(i, i + 50));
                }

                const allPrices: PriceData = {};

                for (const batch of batches) {
                    const response = await axios.get('/api/prices', {
                        params: { token_ids: batch.join(',') },
                        timeout: 10000,
                    });

                    if (response.data?.prices) {
                        response.data.prices.forEach((p: { tokenId: string; price: number }) => {
                            allPrices[p.tokenId] = p.price;
                        });
                    }
                }

                setPrices(allPrices);
            } catch (error) {
                console.error('Error fetching prices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();

        // Refresh prices every 10 seconds
        const interval = setInterval(fetchPrices, 10000);

        return () => clearInterval(interval);
    }, [tokenIds?.join(',')]);

    return { prices, loading };
}

