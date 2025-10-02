// CLOB API Client - For order book and trading operations
import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import type {
    OrderBookSummary,
    Order,
    CreateOrderOptions,
    SignedOrder,
    TickSize
} from './types';

const API_BASE = typeof window !== 'undefined' ? '/api' : 'https://clob.polymarket.com';
const POLYGON_CHAIN_ID = 137;

export class ClobClient {
    private client: AxiosInstance;
    private directClient: AxiosInstance;
    private signer?: ethers.Signer;
    private signerAddress?: string;
    private useProxy: boolean;

    constructor() {
        this.useProxy = typeof window !== 'undefined';

        // Client for proxied requests (order book reads)
        this.client = axios.create({
            baseURL: this.useProxy ? API_BASE : 'https://clob.polymarket.com',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Direct client for writes (order submission)
        this.directClient = axios.create({
            baseURL: 'https://clob.polymarket.com',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Set the signer for order signing
     */
    async setSigner(signer: ethers.Signer) {
        this.signer = signer;
        this.signerAddress = await signer.getAddress();
    }

    /**
     * Get order book summary for a token
     */
    async getOrderBook(tokenId: string): Promise<OrderBookSummary> {
        try {
            const endpoint = this.useProxy ? '/orderbook' : '/book';
            const response = await this.client.get(endpoint, {
                params: { token_id: tokenId }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching order book:', error?.response?.data || error?.message);
            // Return empty order book instead of throwing
            return {
                market: '',
                asset_id: tokenId,
                hash: '',
                bids: [],
                asks: [],
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Get tick sizes for tokens
     */
    async getTickSizes(tokenIds: string[]): Promise<TickSize[]> {
        try {
            const response = await this.client.get(`/tick-sizes`, {
                params: { token_ids: tokenIds.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching tick sizes:', error);
            throw error;
        }
    }

    /**
     * Get user orders
     */
    async getUserOrders(address?: string): Promise<Order[]> {
        try {
            const ownerAddress = address || this.signerAddress;
            if (!ownerAddress) {
                throw new Error('No address provided and no signer set');
            }

            const response = await this.client.get(`/orders`, {
                params: { owner: ownerAddress }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user orders:', error);
            throw error;
        }
    }

    /**
     * Create and sign an order (requires signer)
     */
    async createOrder(options: CreateOrderOptions): Promise<SignedOrder> {
        if (!this.signer || !this.signerAddress) {
            throw new Error('Signer not set. Call setSigner() first.');
        }

        try {
            const { tokenID, price, size, side, feeRateBps = 0, nonce, expiration } = options;

            // Generate order parameters
            const salt = nonce || Math.floor(Math.random() * 1000000000);
            const expirationTime = expiration || Math.floor(Date.now() / 1000) + 86400; // 24 hours default

            // Calculate amounts based on side (ethers v5)
            const makerAmount = side === 'BUY'
                ? ethers.utils.parseUnits((size * price).toFixed(6), 6).toString()
                : ethers.utils.parseUnits(size.toFixed(6), 6).toString();

            const takerAmount = side === 'BUY'
                ? ethers.utils.parseUnits(size.toFixed(6), 6).toString()
                : ethers.utils.parseUnits((size * price).toFixed(6), 6).toString();

            // Build order object for signing
            const order = {
                salt: salt.toString(),
                maker: this.signerAddress,
                signer: this.signerAddress,
                taker: ethers.constants.AddressZero, // ethers v5
                tokenId: tokenID,
                makerAmount,
                takerAmount,
                side: side === 'BUY' ? '0' : '1',
                expiration: expirationTime.toString(),
                nonce: salt.toString(),
                feeRateBps: feeRateBps.toString(),
                signatureType: 0, // EOA signature
            };

            // Create EIP-712 domain
            const domain = {
                name: 'Polymarket CTF Exchange',
                version: '1',
                chainId: POLYGON_CHAIN_ID,
                verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E', // Polymarket Exchange contract
            };

            // Create order type
            const types = {
                Order: [
                    { name: 'salt', type: 'uint256' },
                    { name: 'maker', type: 'address' },
                    { name: 'signer', type: 'address' },
                    { name: 'taker', type: 'address' },
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'makerAmount', type: 'uint256' },
                    { name: 'takerAmount', type: 'uint256' },
                    { name: 'expiration', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'feeRateBps', type: 'uint256' },
                    { name: 'side', type: 'uint8' },
                    { name: 'signatureType', type: 'uint8' },
                ],
            };

            // Sign the order (ethers v5 uses _signTypedData)
            // @ts-ignore - _signTypedData is a private method in ethers v5
            const signature = await this.signer._signTypedData(domain, types, order);

            return {
                ...order,
                signature,
            };
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    /**
     * Submit a signed order to the CLOB via API route (handles auth server-side)
     */
    async postOrder(
        signedOrder: SignedOrder,
        orderType: 'GTC' | 'FOK' | 'GTD' = 'GTC'
    ): Promise<{
        orderID: string;
        success: boolean;
        status?: string;
        errorMsg?: string;
    }> {
        try {
            console.log('📝 Submitting order via API route...');

            // Use API route to handle authentication securely
            const response = await axios.post('/api/trade/place-order', {
                signedOrder,
                orderType,
                owner: signedOrder.maker,
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Order placement failed');
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error posting order:', error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.error || error.message || 'Failed to post order');
        }
    }

    /**
     * Submit multiple signed orders as a batch
     */
    async postOrders(
        signedOrders: SignedOrder[],
        orderType: 'GTC' | 'FOK' | 'GTD' = 'GTC'
    ): Promise<{
        success: boolean;
        orderIDs: string[];
        errors?: string[];
    }> {
        try {
            console.log(`📝 Submitting ${signedOrders.length} orders as batch...`);

            const response = await axios.post('/api/trade/place-orders-batch', {
                signedOrders,
                orderType,
                owner: signedOrders[0]?.maker,
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Error posting batch orders:', error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.error || error.message || 'Failed to post batch orders');
        }
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderID: string): Promise<{ success: boolean }> {
        try {
            console.log('🚫 Canceling order:', orderID);

            const response = await axios.post('/api/trade/cancel-order', {
                orderID,
                owner: this.signerAddress,
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Error canceling order:', error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.error || error.message || 'Failed to cancel order');
        }
    }

    /**
     * Cancel multiple orders
     */
    async cancelOrders(orderIDs: string[]): Promise<{ success: boolean; canceled: number }> {
        try {
            console.log(`🚫 Canceling ${orderIDs.length} orders...`);

            const response = await axios.post('/api/trade/cancel-orders-batch', {
                orderIDs,
                owner: this.signerAddress,
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Error canceling orders:', error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.error || error.message || 'Failed to cancel orders');
        }
    }

    /**
     * Check allowances for trading
     */
    async checkAllowances(address?: string): Promise<{
        success: boolean;
        usdc: { balance: string; allowance: string; hasAllowance: boolean };
    }> {
        try {
            const ownerAddress = address || this.signerAddress;
            if (!ownerAddress) {
                throw new Error('No address provided and no signer set');
            }

            const response = await axios.get('/api/trade/check-allowances', {
                params: { address: ownerAddress }
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Error checking allowances:', error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.error || error.message || 'Failed to check allowances');
        }
    }


    /**
     * Get market prices (mid-price from order book)
     */
    async getMarketPrice(tokenId: string): Promise<number> {
        try {
            const orderBook = await this.getOrderBook(tokenId);

            if (orderBook.bids.length === 0 || orderBook.asks.length === 0) {
                return 0.5; // Default mid-price if no orders
            }

            const bestBid = parseFloat(orderBook.bids[0].price);
            const bestAsk = parseFloat(orderBook.asks[0].price);

            return (bestBid + bestAsk) / 2;
        } catch (error) {
            console.error('Error fetching market price:', error);
            return 0.5;
        }
    }
}

// Export singleton instance
export const clobClient = new ClobClient();

