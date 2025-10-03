'use client';

import { useEffect, useRef } from 'react';

// Generate gradient colors from address for avatar
function getGradientFromAddress(address: string): string {
  const hash = address.slice(2, 8); // Take 6 chars from address
  const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
  const hue2 = (hue1 + 60) % 360; // Complementary hue
  return `hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 60%)`;
}

interface MiniPriceChartProps {
  currentPrice: number;
  targetPrice: number;
  predictionType: 'above' | 'below';
  tokenSymbol: string;
  priceHistory?: Array<{ price: number; timestamp: number }>;
  className?: string;
  status?: string;
  winnerAddress?: string;
  winnerUsername?: string;
  winnerAvatar?: string;
}

export function MiniPriceChart({
  currentPrice,
  targetPrice,
  predictionType,
  priceHistory = [],
  className = '',
  status = 'open',
  winnerAddress,
  winnerUsername,
  winnerAvatar,
}: MiniPriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Use real price history if available, otherwise generate mock data
    let priceData: number[] = [];
    
    if (priceHistory.length > 0) {
      // Use ALL chart_data from database (same as WagerFi)
      priceData = priceHistory.map(p => p.price);
    } else {
      // Fallback: Generate realistic price movement data
      const points = 30;
      const startPrice = targetPrice;
      let price = startPrice;

      // Generate price movement from target to current
      const priceChange = currentPrice - targetPrice;
      const stepChange = priceChange / (points - 1);

      for (let i = 0; i < points; i++) {
        // Add some randomness for realistic movement
        const randomness = (Math.random() - 0.5) * (Math.abs(priceChange) * 0.1);
        price = startPrice + stepChange * i + randomness;
        priceData.push(price);
      }

      // Ensure the last point is the current price
      priceData[points - 1] = currentPrice;
    }

    const maxPrice = Math.max(...priceData, targetPrice);
    const minPrice = Math.min(...priceData, targetPrice);
    const priceRange = maxPrice - minPrice || 1;

    // Add padding
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate positions and values first
    const isWinning =
      (predictionType === 'above' && currentPrice > targetPrice) ||
      (predictionType === 'below' && currentPrice < targetPrice);

    const lastX = padding.left + chartWidth;
    const lastY =
      padding.top +
      chartHeight -
      ((currentPrice - minPrice) / priceRange) * chartHeight;

    const targetY =
      padding.top +
      chartHeight -
      ((targetPrice - minPrice) / priceRange) * chartHeight;

    // Draw target price line
    ctx.strokeStyle = predictionType === 'above' 
      ? 'rgba(16, 185, 129, 0.5)' 
      : 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(padding.left + chartWidth, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw price line with drop shadow
    const gradient = ctx.createLinearGradient(0, 0, chartWidth, 0);
    gradient.addColorStop(0, isWinning ? '#10b981' : '#ef4444');
    gradient.addColorStop(1, isWinning ? '#06ffa5' : '#ff006e');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    priceData.forEach((price, i) => {
      const x = padding.left + (i / (priceData.length - 1)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((price - minPrice) / priceRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Reset shadow for subsequent drawings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw current price dot
    // Outer glow
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isWinning
      ? 'rgba(16, 185, 129, 0.3)'
      : 'rgba(239, 68, 68, 0.3)';
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = isWinning ? '#10b981' : '#ef4444';
    ctx.fill();
  }, [currentPrice, targetPrice, predictionType, priceHistory, status, winnerUsername, winnerAddress, winnerAvatar]);

  // Format price for display
  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else if (price >= 0.0001) {
      return `$${price.toFixed(6)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  };

  const isOpenOrActive = status === 'open' || status === 'active' || status === 'live' || status === 'matched';
  const labelPrefix = isOpenOrActive ? 'CP' : 'RP';
  const priceText = formatPrice(currentPrice);
  const isWinning = (predictionType === 'above' && currentPrice > targetPrice) ||
                    (predictionType === 'below' && currentPrice < targetPrice);
  const isResolved = status === 'resolved' || status === 'settled';
  const statusText = isResolved ? 'WON' : 'WINNING';

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

