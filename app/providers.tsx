'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmf6t0hd40005ju0bitgmflbd'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#8338ec',
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
        },
        loginMethods: ['wallet'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
          showWalletUIs: true,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

