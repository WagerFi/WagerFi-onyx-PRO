'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const gradients = {
    primary: 'linear-gradient(135deg, #8338ec, #3a86ff)',
    secondary: 'linear-gradient(135deg, hsl(178, 90%, 60%), #8338ec)',
    danger: 'linear-gradient(135deg, #ef476f, #fb5607)',
    success: 'linear-gradient(135deg, #06ffa5, #3a86ff)',
  };

  return (
    <motion.button
      type={type}
      className={`relative px-6 py-3 rounded-xl font-medium overflow-hidden ${className}`}
      style={{
        background: gradients[variant],
        fontFamily: 'Varien, sans-serif',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      disabled={disabled}
    >
      <span className="relative z-10 text-white">{children}</span>
      
      {/* Shimmer effect on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
}

