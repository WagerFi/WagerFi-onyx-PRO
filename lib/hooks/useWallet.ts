'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function useWallet() {
    const { ready, authenticated, user, login, logout, linkWallet } = usePrivy();
    const { wallets } = useWallets();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        console.log('🔍 Wallet detection:', {
            walletsCount: wallets.length,
            wallets: wallets.map(w => ({
                address: w.address,
                walletClientType: w.walletClientType
            })),
            user: user ? {
                id: user.id,
                linkedAccounts: user.linkedAccounts?.length || 0
            } : null
        });

        // Try external wallets first (MetaMask, Phantom, etc.)
        if (wallets.length > 0) {
            const activeWallet = wallets[0];
            console.log('✅ External wallet found:', {
                address: activeWallet.address,
                walletClientType: activeWallet.walletClientType
            });
            setWalletAddress(activeWallet.address);
        }
        // Fall back to user's linked accounts (embedded wallets, email wallets, etc.)
        else if (user?.linkedAccounts && user.linkedAccounts.length > 0) {
            // Find the first wallet-type account
            const walletAccount = user.linkedAccounts.find(
                (account: any) => account.type === 'wallet' || account.type === 'smart_wallet'
            );

            if (walletAccount && 'address' in walletAccount) {
                console.log('✅ Embedded/linked wallet found:', {
                    address: walletAccount.address,
                    type: walletAccount.type
                });
                setWalletAddress(walletAccount.address);
            } else {
                console.log('❌ No wallet address in linked accounts');
                setWalletAddress(null);
            }
        } else {
            console.log('❌ No wallets connected');
            setWalletAddress(null);
        }
    }, [wallets, user]);

    const connect = async () => {
        console.log('🔌 Connect function called!', { ready, authenticated, walletsCount: wallets.length });
        setIsConnecting(true);
        try {
            if (authenticated && wallets.length === 0) {
                // User is logged in but no wallet connected - link a wallet
                console.log('🔗 User authenticated, linking wallet...');
                await linkWallet();
            } else if (!authenticated) {
                // User not logged in - show login modal
                console.log('🚀 Calling Privy login()...');
                await login();
            }
            console.log('✅ Wallet connection successful!');
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
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

    // User is connected if they have a wallet address
    // This works for both external wallets and embedded/linked Privy wallets
    const isConnected = !!walletAddress && authenticated;

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
