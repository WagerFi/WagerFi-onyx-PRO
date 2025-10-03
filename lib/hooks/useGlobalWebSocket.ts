import { useEffect, useRef } from 'react';

interface PriceUpdate {
    tokenId: string;
    price: number;
    timestamp: number;
    change_24h?: number;
}

interface WebSocketManager {
    subscribe: (tokenId: string, callback: (update: PriceUpdate) => void) => () => void;
    unsubscribe: (tokenId: string, callback: (update: PriceUpdate) => void) => void;
    isConnected: () => boolean;
}

// Global WebSocket manager singleton
class GlobalWebSocketManager implements WebSocketManager {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Set<(update: PriceUpdate) => void>> = new Map();
    private subscribedTokens: Set<string> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private wsUrl: string;

    constructor() {
        const backgroundWorkerUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

        // Handle different environments for WebSocket URL
        if (backgroundWorkerUrl.includes('localhost')) {
            this.wsUrl = backgroundWorkerUrl.replace('http://', 'ws://') + '/ws';
        } else {
            if (window.location.protocol === 'https:') {
                this.wsUrl = backgroundWorkerUrl.replace('https://', 'wss://') + '/ws';
            } else {
                this.wsUrl = backgroundWorkerUrl.replace('http://', 'ws://') + '/ws';
            }
        }
    }

    private connect(): void {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;
        console.log('🔌 [GlobalWebSocket] Connecting to WebSocket...');

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('✅ [GlobalWebSocket] Connected to WebSocket');
                this.isConnecting = false;
                this.reconnectAttempts = 0;

                // Re-subscribe to all tokens
                this.subscribedTokens.forEach(tokenId => {
                    this.sendSubscription(tokenId);
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'price_update' && data.tokenId && data.price) {
                        const update: PriceUpdate = {
                            tokenId: data.tokenId,
                            price: parseFloat(data.price),
                            timestamp: Date.now(),
                            change_24h: data.change_24h
                        };

                        // Notify all subscribers for this token
                        const callbacks = this.subscribers.get(data.tokenId);
                        if (callbacks) {
                            callbacks.forEach(callback => {
                                try {
                                    callback(update);
                                } catch (error) {
                                    console.error('❌ [GlobalWebSocket] Error in price update callback:', error);
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ [GlobalWebSocket] Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('🔌 [GlobalWebSocket] WebSocket connection closed');
                this.isConnecting = false;
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ [GlobalWebSocket] WebSocket error:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('❌ [GlobalWebSocket] Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ [GlobalWebSocket] Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`🔄 [GlobalWebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    private sendSubscription(tokenId: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'subscribe',
                tokenId: tokenId
            };
            console.log(`📡 [GlobalWebSocket] Subscribing to token: ${tokenId}`);
            this.ws.send(JSON.stringify(message));
        }
    }

    private sendUnsubscription(tokenId: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'unsubscribe',
                tokenId: tokenId
            };
            console.log(`📡 [GlobalWebSocket] Unsubscribing from token: ${tokenId}`);
            this.ws.send(JSON.stringify(message));
        }
    }

    subscribe(tokenId: string, callback: (update: PriceUpdate) => void): () => void {
        // Add callback to subscribers
        if (!this.subscribers.has(tokenId)) {
            this.subscribers.set(tokenId, new Set());
        }
        this.subscribers.get(tokenId)!.add(callback);

        // Subscribe to token if not already subscribed
        if (!this.subscribedTokens.has(tokenId)) {
            this.subscribedTokens.add(tokenId);
            this.connect(); // Ensure connection is established
            this.sendSubscription(tokenId);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(tokenId, callback);
    }

    unsubscribe(tokenId: string, callback: (update: PriceUpdate) => void): void {
        const callbacks = this.subscribers.get(tokenId);
        if (callbacks) {
            callbacks.delete(callback);

            // If no more callbacks for this token, unsubscribe
            if (callbacks.size === 0) {
                this.subscribers.delete(tokenId);
                this.subscribedTokens.delete(tokenId);
                this.sendUnsubscription(tokenId);
            }
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscribers.clear();
        this.subscribedTokens.clear();
        this.isConnecting = false;
    }
}

// Global instance
const globalWebSocketManager = new GlobalWebSocketManager();

// Hook for components to use
export function useGlobalWebSocket(tokenId: string, onPriceUpdate: (update: PriceUpdate) => void) {
    const onPriceUpdateRef = useRef(onPriceUpdate);

    // Update the callback ref when it changes
    useEffect(() => {
        onPriceUpdateRef.current = onPriceUpdate;
    }, [onPriceUpdate]);

    useEffect(() => {
        if (!tokenId) return;

        const unsubscribe = globalWebSocketManager.subscribe(tokenId, (update) => {
            onPriceUpdateRef.current(update);
        });

        return unsubscribe;
    }, [tokenId]);

    return {
        isConnected: globalWebSocketManager.isConnected(),
        subscribe: globalWebSocketManager.subscribe.bind(globalWebSocketManager),
        unsubscribe: globalWebSocketManager.unsubscribe.bind(globalWebSocketManager)
    };
}

export default globalWebSocketManager;
