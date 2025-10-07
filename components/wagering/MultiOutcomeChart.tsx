'use client';

import { useEffect, useRef, useState } from 'react';

export interface OutcomeData {
  name: string;
  color: string;
  prices: number[]; // Historical prices (0-1 range)
}

export interface EventMarker {
  timestamp: number;
  title: string;
  description?: string;
  xPostUrl?: string;
}

export interface ChartDataPoint {
  timestamp: number;
  outcomes: { [outcomeName: string]: number };
}

interface MultiOutcomeChartProps {
  data: ChartDataPoint[];
  outcomes: OutcomeData[];
  events?: EventMarker[];
  height?: number;
  showLabels?: boolean;
}

// Color palette for outcomes
const OUTCOME_COLORS = [
  '#f97316', // orange
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#a855f7', // purple
  '#ec4899', // pink
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
];

export function MultiOutcomeChart({ 
  data, 
  outcomes,
  events = [],
  height = 180,
  showLabels = true 
}: MultiOutcomeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<EventMarker | null>(null);
  const [eventPosition, setEventPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('⚠️ Chart canvas not found');
      return;
    }
    
    if (data.length === 0) {
      console.log('⚠️ Chart data is empty');
      return;
    }

    console.log('📊 Drawing chart with', data.length, 'points for', outcomes.length, 'outcomes');

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('⚠️ Canvas context not available');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;

    ctx.clearRect(0, 0, width, canvasHeight);

    const padding = { top: 15, right: 50, bottom: showLabels ? 35 : 15, left: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = canvasHeight - padding.top - padding.bottom;

    // Get min and max timestamps
    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;
    const timeRange = maxTime - minTime;

    // Draw dark background
    ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
    ctx.fillRect(0, 0, width, canvasHeight);

    // Draw horizontal grid lines and Y-axis percentage labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const percentage = 100 - (i * 20); // 100%, 80%, 60%, 40%, 20%, 0%
      const y = padding.top + (chartHeight * i) / 5;
      
      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Draw percentage label on the right
      ctx.fillText(`${percentage}%`, width - 8, y);
    }

    // Draw outcome lines with anti-aliasing
    outcomes.forEach((outcome, outcomeIdx) => {
      const color = outcome.color || OUTCOME_COLORS[outcomeIdx % OUTCOME_COLORS.length];
      
      // Draw shadow/glow for line
      ctx.strokeStyle = color + '30'; // 20% opacity glow
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      data.forEach((point, i) => {
        const price = point.outcomes[outcome.name] || 0;
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight * (1 - price);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw main line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, i) => {
        const price = point.outcomes[outcome.name] || 0;
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight * (1 - price);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();

      // Draw dot at the end with glow
      const lastPoint = data[data.length - 1];
      const lastPrice = lastPoint.outcomes[outcome.name] || 0;
      const lastX = padding.left + chartWidth;
      const lastY = padding.top + chartHeight * (1 - lastPrice);
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fillStyle = color + '30';
      ctx.fill();
      
      // Main dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(lastX - 0.5, lastY - 0.5, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    });

    // Draw event markers
    events.forEach((event) => {
      if (event.timestamp >= minTime && event.timestamp <= maxTime) {
        const progress = (event.timestamp - minTime) / timeRange;
        const x = padding.left + progress * chartWidth;
        
        // Draw vertical line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw circle marker
        const markerY = padding.top + chartHeight + 10;
        ctx.beginPath();
        ctx.arc(x, markerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw time labels
    if (showLabels && data.length > 0) {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      
      // Show 5-6 time labels
      const labelCount = 6;
      for (let i = 0; i < labelCount; i++) {
        const dataIdx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
        const point = data[dataIdx];
        const date = new Date(point.timestamp * 1000);
        const label = i === labelCount - 1 ? 'Now' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const x = padding.left + (i / (labelCount - 1)) * chartWidth;
        ctx.fillText(label, x, canvasHeight - 8);
      }
    }

  }, [data, outcomes, events, height, showLabels]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (events.length === 0 || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const padding = { top: 20, right: 10, bottom: showLabels ? 30 : 10, left: 10 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;
    const timeRange = maxTime - minTime;

    // Check if click is near any event marker
    for (const event of events) {
      if (event.timestamp >= minTime && event.timestamp <= maxTime) {
        const progress = (event.timestamp - minTime) / timeRange;
        const eventX = padding.left + progress * chartWidth;
        
        // If click is within 10px of marker
        if (Math.abs(x - eventX) < 10) {
          setHoveredEvent(event);
          setEventPosition({ x: eventX, y: e.clientY - rect.top });
          return;
        }
      }
    }
    
    // Close tooltip if clicked elsewhere
    setHoveredEvent(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        className="w-full cursor-pointer"
        style={{ height: `${height}px` }}
        onClick={handleCanvasClick}
      />
      
      {/* Event Tooltip */}
      {hoveredEvent && eventPosition && (
        <div
          className="absolute z-50 bg-black/95 border border-white/20 rounded-lg p-3 max-w-xs shadow-xl"
          style={{
            left: `${eventPosition.x}px`,
            top: `${eventPosition.y - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={() => setHoveredEvent(null)}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold text-white">{hoveredEvent.title}</h4>
            <button
              onClick={() => setHoveredEvent(null)}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          {hoveredEvent.description && (
            <p className="text-xs text-gray-300 mb-2">{hoveredEvent.description}</p>
          )}
          <div className="text-xs text-gray-500">
            {new Date(hoveredEvent.timestamp * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {hoveredEvent.xPostUrl && (
            <a
              href={hoveredEvent.xPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              See X Posts →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

