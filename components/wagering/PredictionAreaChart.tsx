'use client';

import { useEffect, useRef } from 'react';

interface ChartDataPoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
}

interface PredictionAreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  showLabels?: boolean;
}

export function PredictionAreaChart({ 
  data, 
  height = 120,
  showLabels = true 
}: PredictionAreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;

    ctx.clearRect(0, 0, width, canvasHeight);

    const padding = { top: 10, right: 10, bottom: showLabels ? 25 : 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = canvasHeight - padding.top - padding.bottom;

    // Draw filled area for outcome 1 (Yes/Republican) - Magenta/Pink
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    
    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - point.yesPrice);
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.closePath();
    
    const yesGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    yesGradient.addColorStop(0, 'rgba(236, 72, 153, 0.5)');
    yesGradient.addColorStop(1, 'rgba(219, 39, 119, 0.15)');
    ctx.fillStyle = yesGradient;
    ctx.fill();

    // Draw filled area for outcome 2 (No/Democrat) - Cyan/Teal
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    
    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * point.yesPrice;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.closePath();
    
    const noGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    noGradient.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
    noGradient.addColorStop(1, 'rgba(8, 145, 178, 0.15)');
    ctx.fillStyle = noGradient;
    ctx.fill();

    // Draw border line for outcome 1
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - point.yesPrice);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw border line for outcome 2
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * point.yesPrice;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw current value indicators (dots at the end)
    const lastPoint = data[data.length - 1];
    const lastX = padding.left + chartWidth;
    
    // Outcome 1 dot
    const lastY1 = padding.top + chartHeight * (1 - lastPoint.yesPrice);
    ctx.beginPath();
    ctx.arc(lastX, lastY1, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY1, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.fill();

    // Outcome 2 dot
    const lastY2 = padding.top + chartHeight * lastPoint.yesPrice;
    ctx.beginPath();
    ctx.arc(lastX, lastY2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();

    // Draw time labels
    if (showLabels) {
      const timeLabels = ['Aug 22', 'Sep 22', 'Oct 22', 'Nov 22', 'Dec 22', 'Live'];
      ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      
      timeLabels.forEach((label, i) => {
        const x = padding.left + (i / (timeLabels.length - 1)) * chartWidth;
        ctx.fillText(label, x, canvasHeight - 8);
      });
    }

  }, [data, height, showLabels]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}

