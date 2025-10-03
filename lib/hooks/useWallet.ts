'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Helius RPC URL
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=8e2a463b-4b52-49f4-a39f-eb98f5ca27bb';

// $WAGER token mint address
const WAGER_TOKEN_MINT = '8Dk4CWZv1j1fJEyDXXL1DH7EQZutbsqiXahEy5y215Yr';

export function useWallet() {
    const { ready, authenticated, user, login, logout, linkWallet } = usePrivy();
    const { wallets } = useWallets();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [wagerBalance, setWagerBalance] = useState<number | null>(null);
    const [connection, setConnection] = useState<Connection | null>(null);

    // Initialize Helius RPC connection
    useEffect(() => {
        const conn = new Connection(HELIUS_RPC_URL, 'confirmed');
        setConnection(conn);
        console.log('🔌 Helius RPC connection initialized');
    }, []);

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

    // Fetch SOL balance
    useEffect(() => {
        const fetchSolBalance = async () => {
            if (connection && walletAddress) {
                try {
                    const publicKey = new PublicKey(walletAddress);
                    const balance = await connection.getBalance(publicKey);
                    setSolBalance(balance / 1e9); // Convert lamports to SOL
                } catch (error) {
                    console.error('❌ Error fetching SOL balance:', error);
                    setSolBalance(0);
                }
            } else {
                setSolBalance(null);
            }
        };

        fetchSolBalance();

        // Refresh SOL balance every 10 seconds
        const interval = setInterval(fetchSolBalance, 10000);
        return () => clearInterval(interval);
    }, [connection, walletAddress]);

    // Fetch $WAGER token balance
    useEffect(() => {
        const fetchWagerBalance = async () => {
            if (connection && walletAddress) {
                try {
                    const publicKey = new PublicKey(walletAddress);
                    const wagerTokenMint = new PublicKey(WAGER_TOKEN_MINT);

                    // Get associated token account address
                    const associatedTokenAddress = await getAssociatedTokenAddress(
                        wagerTokenMint,
                        publicKey,
                        false,
                        TOKEN_PROGRAM_ID
                    );

                    // Get token account info
                    const tokenAccountInfo = await connection.getTokenAccountBalance(associatedTokenAddress);

                    if (tokenAccountInfo.value) {
                        setWagerBalance(tokenAccountInfo.value.uiAmount || 0);
                    } else {
                        setWagerBalance(0);
                    }
                } catch (error) {
                    // Token account doesn't exist or other error
                    setWagerBalance(0);
                }
            } else {
                setWagerBalance(null);
            }
        };

        fetchWagerBalance();

        // Refresh $WAGER balance every 10 seconds
        const interval = setInterval(fetchWagerBalance, 10000);
        return () => clearInterval(interval);
    }, [connection, walletAddress]);

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
        isConnected,
        solBalance,
        wagerBalance
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
        solBalance,
        wagerBalance,
        connection,
    };
}
