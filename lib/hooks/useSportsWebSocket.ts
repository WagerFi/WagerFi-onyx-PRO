import { useState, useEffect, useCallback, useRef } from 'react';
import { Game } from '../types/sports';

interface SportsUpdate {
    type: 'sports_update';
    timestamp: string;
    liveGames: { [sportId: string]: Game[] };
    summary: {
        totalLiveGames: number;
        sportsWithLiveGames: string[];
    };
}

interface UseSportsWebSocketOptions {
    sport?: string; // Subscribe to specific sport, or 'all' for all sports
    autoConnect?: boolean;
}

interface UseSportsWebSocketReturn {
    isConnected: boolean;
    liveGames: { [sportId: string]: Game[] };
    lastUpdate: string | null;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    reconnectAttempts: number;
    connect: () => void;
    disconnect: () => void;
    subscribe: (sport: string) => void;
    unsubscribe: (sport: string) => void;
}

export function useSportsWebSocket(options: UseSportsWebSocketOptions = {}): UseSportsWebSocketReturn {
    const { sport = 'all', autoConnect = true } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [liveGames, setLiveGames] = useState<{ [sportId: string]: Game[] }>({});
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 10;
    const isManualDisconnect = useRef(false);
    const lastPongTime = useRef<number>(Date.now());

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            return; // Already connected or connecting
        }

        // Clean up any existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const backgroundWorkerUrl = import.meta.env.VITE_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

        // Handle different environments for WebSocket URL
        let wsUrl;
        if (backgroundWorkerUrl.includes('localhost')) {
            // Local development
            wsUrl = backgroundWorkerUrl.replace('http://', 'ws://') + '/ws';
        } else {
            // Production - always use WSS for production URLs
            wsUrl = backgroundWorkerUrl.replace('https://', 'wss://') + '/ws';
        }

        try {
            setConnectionStatus('connecting');
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                setConnectionStatus('connected');
                reconnectAttempts.current = 0;
                isManualDisconnect.current = false;
                lastPongTime.current = Date.now();

                // Start ping interval for connection health monitoring
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        // Check if we haven't received a pong in 30 seconds
                        if (Date.now() - lastPongTime.current > 30000) {
                            console.warn('⚠️ [SportsWebSocket] No pong received, reconnecting...');
                            wsRef.current.close();
                            return;
                        }

                        // Send ping
                        try {
                            wsRef.current.send(JSON.stringify({ type: 'ping' }));
                        } catch (error) {
                            console.error('❌ [SportsWebSocket] Error sending ping:', error);
                        }
                    }
                }, 15000); // Ping every 15 seconds

                // Subscribe to the specified sport
                if (sport && sport !== 'all') {
                    subscribe(sport);
                } else {
                    subscribe('all');
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'pong') {
                        lastPongTime.current = Date.now();
                        return;
                    }

                    if (data.type === 'sports_update') {
                        setLiveGames(data.liveGames);
                        setLastUpdate(data.timestamp);
                    }
                } catch (error) {
                    console.error('❌ [SportsWebSocket] Error parsing message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                setIsConnected(false);
                setConnectionStatus('disconnected');

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Attempt to reconnect if not a manual close and we haven't exceeded max attempts
                if (!isManualDisconnect.current && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                } else if (reconnectAttempts.current >= maxReconnectAttempts) {
                    setConnectionStatus('error');
                    console.error('❌ [SportsWebSocket] Max reconnection attempts reached');
                }
            };

            wsRef.current.onerror = (error) => {
                setConnectionStatus('error');
                console.error('❌ [SportsWebSocket] WebSocket error:', error);
            };

        } catch (error) {
            setConnectionStatus('error');
            console.error('❌ [SportsWebSocket] Failed to create WebSocket connection:', error);
        }
    }, [sport]);

    const disconnect = useCallback(() => {
        isManualDisconnect.current = true;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }

        setIsConnected(false);
        setConnectionStatus('disconnected');
    }, []);

    const subscribe = useCallback((sportToSubscribe: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'subscribe',
                sport: sportToSubscribe
            });
            wsRef.current.send(message);
        }
    }, []);

    const unsubscribe = useCallback((sportToUnsubscribe: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'unsubscribe',
                sport: sportToUnsubscribe
            });
            wsRef.current.send(message);
        }
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return {
        isConnected,
        liveGames,
        lastUpdate,
        connectionStatus,
        reconnectAttempts: reconnectAttempts.current,
        connect,
        disconnect,
        subscribe,
        unsubscribe
    };
}
