'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function useWallet() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const { wallets } = useWallets();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (wallets.length > 0) {
            // Get the first Solana wallet
            const solanaWallet = wallets.find(
                (w) => w.chainType === 'solana'
            );

            if (solanaWallet) {
                setWalletAddress(solanaWallet.address);
            }
        } else {
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

    return {
        ready,
        authenticated,
        connected: authenticated && !!walletAddress,
        connecting: isConnecting,
        walletAddress,
        user,
        connect,
        disconnect,
    };
}
