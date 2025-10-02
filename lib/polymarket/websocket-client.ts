// WebSocket Client for real-time market updates
import { EventEmitter } from 'events';

const WS_BASE_URL = 'wss://ws-subscriptions-clob.polymarket.com';

export type WebSocketEventType =
    | 'market'
    | 'book'
    | 'last_trade_price'
    | 'tick_size'
    | 'user';

export interface WebSocketSubscription {
    type: WebSocketEventType;
    market?: string;
    asset_id?: string;
}

export class PolymarketWebSocketClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private subscriptions: Map<string, WebSocketSubscription> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private isManualClose = false;
    private hasApiKeys = false;
    private auth: { apiKey: string; secret: string; passphrase: string } | null = null;

    constructor() {
        super();
        // Try to fetch auth credentials on initialization
        this.initializeAuth();
    }

    /**
     * Initialize authentication by fetching API keys from the server
     */
    private async initializeAuth() {
        try {
            const response = await fetch('/api/polymarket/ws-auth');
            const data = await response.json();

            if (data.success && data.auth) {
                this.auth = data.auth;
                this.hasApiKeys = true;
                console.log('✅ WebSocket authentication initialized');
            } else {
                console.log('📡 WebSocket running in public mode (no authentication)');
            }
        } catch (error) {
            console.log('📡 WebSocket running in public mode (no authentication)');
            this.hasApiKeys = false;
        }
    }

    /**
     * Set whether we have API keys configured
     */
    setHasApiKeys(hasKeys: boolean) {
        this.hasApiKeys = hasKeys;
        if (hasKeys && !this.auth) {
            this.initializeAuth();
        }
    }

    /**
     * Connect to WebSocket for a specific channel
     */
    connect(channel: 'market' | 'user' = 'market'): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                resolve();
                return;
            }

            this.isConnecting = true;
            this.isManualClose = false;

            try {
                // Connect to specific channel endpoint
                const wsUrl = `${WS_BASE_URL}/ws/${channel}`;
                console.log(`📡 Connecting to WebSocket: ${wsUrl}`);
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected successfully');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;

                    // Polymarket WebSocket doesn't require initial auth message
                    // Auth is sent with subscription messages

                    // Resubscribe to all previous subscriptions
                    this.subscriptions.forEach((sub) => {
                        this.sendSubscription(sub);
                    });

                    this.emit('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        // Handle PONG keepalive messages (plain text, not JSON)
                        if (event.data === 'PONG') {
                            // Just ignore PONG responses
                            return;
                        }

                        // Parse and handle JSON messages
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
                    }
                };

                this.ws.onerror = (error) => {
                    console.warn('⚠️ WebSocket connection failed');
                    this.isConnecting = false;
                    // Don't emit 'error' event to avoid unhandled error exceptions
                    // Just log and continue
                    resolve();
                };

                this.ws.onclose = () => {
                    console.log('WebSocket closed');
                    this.isConnecting = false;
                    this.emit('disconnected');

                    // Only attempt to reconnect if we have auth and not manually closed
                    if (!this.isManualClose && this.auth && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                        setTimeout(() => {
                            this.connect();
                        }, this.reconnectDelay * this.reconnectAttempts);
                    } else if (!this.auth) {
                        console.log('📡 WebSocket disabled - authentication not available. Using polling fallback.');
                    }
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        this.isManualClose = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscriptions.clear();
    }

    /**
     * Subscribe to market updates (order book, price changes, trades)
     */
    async subscribeToMarket(market: string, assetIds?: string[]) {
        const key = `market_${market}`;
        const subscription: WebSocketSubscription = {
            type: 'market',
            market,
            asset_id: assetIds?.[0], // Can subscribe to specific asset
        };

        this.subscriptions.set(key, subscription);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendSubscription(subscription);
        } else {
            await this.connect();
            this.sendSubscription(subscription);
        }
    }

    /**
     * Subscribe to order book updates for a specific asset/token
     */
    async subscribeToOrderBook(assetId: string, market?: string) {
        const key = `book_${assetId}`;
        const subscription: WebSocketSubscription = {
            type: 'market', // Use market channel for book updates
            asset_id: assetId,
            market: market,
        };

        this.subscriptions.set(key, subscription);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendSubscription(subscription);
        } else {
            await this.connect();
            this.sendSubscription(subscription);
        }
    }

    /**
     * Subscribe to last trade price
     */
    async subscribeToLastTradePrice(assetId: string) {
        const key = `last_trade_${assetId}`;
        const subscription: WebSocketSubscription = {
            type: 'last_trade_price',
            asset_id: assetId,
        };

        this.subscriptions.set(key, subscription);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendSubscription(subscription);
        } else {
            await this.connect();
            this.sendSubscription(subscription);
        }
    }

    /**
     * Unsubscribe from updates
     */
    unsubscribe(key: string) {
        const subscription = this.subscriptions.get(key);
        if (subscription && this.ws?.readyState === WebSocket.OPEN) {
            const { type, ...rest } = subscription;
            this.ws.send(JSON.stringify({
                auth: {},
                type: 'unsubscribe',
                channel: type,
                ...rest,
            }));
        }
        this.subscriptions.delete(key);
    }

    /**
     * Send subscription message
     */
    private sendSubscription(subscription: WebSocketSubscription) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const { type, asset_id, market } = subscription;

            let message: any = {};

            // Format message according to Polymarket API
            if (type === 'market' || type === 'book') {
                // Market channel format
                message = {
                    type: 'market',
                    assets_ids: asset_id ? [asset_id] : [],
                };
            } else if (type === 'user') {
                // User channel format (requires auth)
                message = {
                    type: 'user',
                    markets: market ? [market] : [],
                };

                if (this.auth) {
                    message.auth = this.auth;
                }
            }

            console.log('📡 Sending WebSocket subscription:', JSON.stringify(message).substring(0, 100) + '...');
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: any) {
        const { event_type } = data;

        switch (event_type) {
            case 'market':
                this.emit('market_update', data);
                break;
            case 'book':
                // Full order book snapshot
                this.emit('book_update', data);
                break;
            case 'price_change':
                // Incremental price level updates
                this.emit('price_change', data);
                this.emit('book_update', data); // Also emit as book update
                break;
            case 'last_trade_price':
                // Trade execution
                this.emit('trade', data);
                this.emit('price_update', data);
                break;
            case 'tick_size_change':
                this.emit('tick_size_change', data);
                break;
            case 'user':
                this.emit('user_update', data);
                break;
            default:
                console.log('📨 Unknown WebSocket message type:', event_type, data);
                this.emit('message', data);
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Export singleton instance
export const wsClient = new PolymarketWebSocketClient();

