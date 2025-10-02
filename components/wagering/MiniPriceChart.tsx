'use client';

import { useEffect, useRef } from 'react';

interface MiniPriceChartProps {
  currentPrice: number;
  targetPrice: number;
  predictionType: 'above' | 'below';
  tokenSymbol: string;
  priceHistory?: Array<{ price: number; timestamp: number }>;
  className?: string;
}

export function MiniPriceChart({
  currentPrice,
  targetPrice,
  predictionType,
  priceHistory = [],
  className = '',
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
      // Use real chart_data from database (same as WagerFi)
      priceData = priceHistory.slice(-30).map(p => p.price);
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

    // Draw target price line
    const targetY =
      padding.top +
      chartHeight -
      ((targetPrice - minPrice) / priceRange) * chartHeight;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(padding.left + chartWidth, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price line
    const isWinning =
      (predictionType === 'above' && currentPrice > targetPrice) ||
      (predictionType === 'below' && currentPrice < targetPrice);

    const gradient = ctx.createLinearGradient(0, 0, chartWidth, 0);
    gradient.addColorStop(0, isWinning ? '#10b981' : '#ef4444');
    gradient.addColorStop(1, isWinning ? '#06ffa5' : '#ff006e');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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

    // Draw current price dot
    const lastX = padding.left + chartWidth;
    const lastY =
      padding.top +
      chartHeight -
      ((currentPrice - minPrice) / priceRange) * chartHeight;

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
  }, [currentPrice, targetPrice, predictionType, priceHistory]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

