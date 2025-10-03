'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <style jsx global>{`
        /* Privy Modal Custom Styling */
        [data-privy-modal] {
          font-family: 'JetBrains Mono', monospace !important;
        }

        /* Modal Container */
        [data-privy-modal-content] {
          background: linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(30, 30, 30, 0.98)) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
        }

        /* Headers */
        [data-privy-modal-content] h1,
        [data-privy-modal-content] h2,
        [data-privy-modal-content] h3 {
          font-family: 'Varien', 'JetBrains Mono', sans-serif !important;
          color: #ffffff !important;
        }

        /* Text */
        [data-privy-modal-content] p,
        [data-privy-modal-content] span {
          color: rgba(255, 255, 255, 0.9) !important;
          font-family: 'JetBrains Mono', monospace !important;
        }

        /* Buttons */
        [data-privy-modal-content] button[type="button"] {
          background: linear-gradient(135deg, rgba(131, 56, 236, 0.9), rgba(58, 134, 255, 0.9)) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 10px !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }

        [data-privy-modal-content] button[type="button"]:hover {
          background: linear-gradient(135deg, rgba(131, 56, 236, 1), rgba(58, 134, 255, 1)) !important;
          transform: scale(1.02) !important;
        }

        /* Wallet List Items */
        [data-privy-modal-content] [role="button"] {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
        }

        [data-privy-modal-content] [role="button"]:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(131, 56, 236, 0.5) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(131, 56, 236, 0.2) !important;
        }

        /* Input Fields */
        [data-privy-modal-content] input {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 10px !important;
          color: #ffffff !important;
          font-family: 'JetBrains Mono', monospace !important;
        }

        [data-privy-modal-content] input:focus {
          border-color: #8338ec !important;
          box-shadow: 0 0 0 3px rgba(131, 56, 236, 0.1) !important;
        }

        /* Close Button */
        [data-privy-modal-content] button[aria-label="Close"] {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }

        [data-privy-modal-content] button[aria-label="Close"]:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        /* Loading Spinner */
        [data-privy-modal-content] [role="status"] {
          border-color: rgba(131, 56, 236, 0.2) !important;
          border-top-color: #8338ec !important;
        }

        /* Links */
        [data-privy-modal-content] a {
          color: #8338ec !important;
          font-family: 'JetBrains Mono', monospace !important;
        }

        [data-privy-modal-content] a:hover {
          color: #a569ff !important;
        }

        /* Dividers */
        [data-privy-modal-content] hr {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
      
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmf6t0hd40005ju0bitgmflbd'}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#8338ec',
            logo: 'https://wagerfi-sportsapi.b-cdn.net/wagerfionyxpro.png',
            showWalletLoginFirst: true,
            walletList: [
              'detected_wallets',
              'detected_solana_wallets', 
              'metamask',
              'phantom',
              'solflare',
              'backpack',
              'coinbase_wallet',
              'okx_wallet'
            ],
          },
          loginMethods: ['wallet'],
          embeddedWallets: {
            showWalletUIs: true,
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
          externalWallets: {
            solana: {
              connectors: toSolanaWalletConnectors(),
            },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </>
  );
}

