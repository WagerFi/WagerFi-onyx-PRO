// Server-side API Key Management for Polymarket
// This file should ONLY run on the server (in API routes)

import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from 'ethers';

let cachedApiKeys: { apiKey: string; apiSecret: string; apiPassphrase: string } | null = null;
let clobClientInstance: ClobClient | null = null;

/**
 * Initialize Polymarket CLOB Client with API keys
 * This should only be called server-side
 */
export async function getPolymarketApiKeys() {
    // Return cached keys if available
    if (cachedApiKeys) {
        return cachedApiKeys;
    }

    const privateKey = process.env.POLYMARKET_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error('POLYMARKET_PRIVATE_KEY not set in environment variables');
    }

    try {
        const host = 'https://clob.polymarket.com';
        const chainId = 137; // Polygon

        // Create wallet from private key
        const wallet = new Wallet(privateKey);

        // Initialize CLOB client
        const client = new ClobClient(host, chainId, wallet);

        // Derive API keys
        const apiCreds = await client.deriveApiKey();

        cachedApiKeys = {
            apiKey: apiCreds.apiKey,
            apiSecret: apiCreds.apiSecret,
            apiPassphrase: apiCreds.apiPassphrase,
        };

        clobClientInstance = client;

        console.log('✅ Polymarket API keys derived successfully');

        return cachedApiKeys;
    } catch (error) {
        console.error('❌ Failed to derive Polymarket API keys:', error);
        throw error;
    }
}

/**
 * Get the initialized CLOB client
 */
export function getClobClient(): ClobClient | null {
    return clobClientInstance;
}

