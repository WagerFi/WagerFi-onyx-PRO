'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  walletConnected?: boolean;
  username?: string | null;
  onConnectWallet?: () => void;
}

export function Navbar({ walletConnected, username, onConnectWallet }: NavbarProps) {
  const [isNavHovered, setIsNavHovered] = useState(false);

  return (
    <motion.nav
      className="absolute top-0 left-0 right-0 z-50 p-6"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between">
        <Link href="/">
          <motion.div
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(30, 30, 30, 1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
            onMouseEnter={() => setIsNavHovered(true)}
            onMouseLeave={() => setIsNavHovered(false)}
            whileHover={{ scale: 1.02 }}
          >
            {/* Iridescent hover border */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                inset: 0,
                borderRadius: '12px',
                padding: '2px',
                background: `radial-gradient(100px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                WebkitMask:
                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
              }}
              animate={{
                opacity: isNavHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            />

            <span
              className="relative z-10 text-xl tracking-tight select-none uppercase mt-0.5 flex items-center gap-2"
              style={{ fontFamily: 'Surgena, sans-serif' }}
            >
              <span className="font-light text-white">WAGERFI</span>
              <span className="w-0.5 h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
              <span
                className="font-bold"
                style={{
                  background:
                    'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ONYX
              </span>
            </span>
            <span
              className="relative z-10 bg-white text-[#2a2a2a] text-sm font-extrabold px-2 py-0.5 rounded-md"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              PRO
            </span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/trade">
            <motion.div
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
              whileHover={{ scale: 1.05 }}
            >
              Trade
            </motion.div>
          </Link>

          {walletConnected && username ? (
            <div
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {username}
            </div>
          ) : (
            onConnectWallet && (
              <Button onClick={onConnectWallet} variant="primary">
                Connect Wallet
              </Button>
            )
          )}
        </div>
      </div>
    </motion.nav>
  );
}

