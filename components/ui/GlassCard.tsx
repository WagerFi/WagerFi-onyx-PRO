'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className = '', 
  hoverable = true,
  onClick 
}: GlassCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverable) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      className={`relative rounded-xl backdrop-blur-md ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
      
      {/* Iridescent border on hover */}
      {hoverable && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(200px circle at ${mousePosition.x}% ${mousePosition.y}%, 
              hsl(280, 100%, 70%), 
              hsl(200, 100%, 60%) 25%, 
              rgba(0, 0, 0, 0.6) 50%, 
              rgba(0, 0, 0, 0.5) 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '2px',
          }}
        />
      )}
    </motion.div>
  );
}

