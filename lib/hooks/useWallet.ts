'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function useWallet() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const { wallets } = useWallets();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        console.log('🔍 Wallet detection:', {
            walletsCount: wallets.length,
            wallets: wallets.map(w => ({
                address: w.address,
                walletClientType: w.walletClientType
            }))
        });

        if (wallets.length > 0) {
            // Get the first connected wallet (any chain type)
            const activeWallet = wallets[0];

            if (activeWallet) {
                console.log('✅ Active wallet found:', {
                    address: activeWallet.address,
                    walletClientType: activeWallet.walletClientType
                });
                setWalletAddress(activeWallet.address);
            }
        } else {
            console.log('❌ No wallets connected');
            setWalletAddress(null);
        }
    }, [wallets]);

    const connect = async () => {
        setIsConnecting(true);
        try {
            await login();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            await logout();
            setWalletAddress(null);
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    // User is connected if they have a wallet address (regardless of authenticated state)
    // Some wallet extensions might not set authenticated=true immediately
    const isConnected = !!walletAddress && wallets.length > 0;

    console.log('🔍 Connection state:', {
        authenticated,
        walletAddress,
        walletsCount: wallets.length,
        isConnected
    });

    return {
        ready,
        authenticated,
        connected: isConnected,
        connecting: isConnecting,
        walletAddress,
        user,
        connect,
        disconnect,
    };
}
