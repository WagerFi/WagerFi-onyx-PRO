'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

export function CountdownTimer({ expiresAt, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, isExpired: false };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null;
    return `${value}${unit}`;
  };

  const getDisplayText = () => {
    if (timeLeft.isExpired) {
      return 'Expired';
    }

    const parts = [
      formatTimeUnit(timeLeft.days, 'd'),
      formatTimeUnit(timeLeft.hours, 'h'),
      formatTimeUnit(timeLeft.minutes, 'm'),
      formatTimeUnit(timeLeft.seconds, 's')
    ].filter(Boolean);

    // Show only the most significant units
    if (timeLeft.days > 0) {
      return parts.slice(0, 2).join(' '); // days and hours
    } else if (timeLeft.hours > 0) {
      return parts.slice(0, 2).join(' '); // hours and minutes
    } else {
      return parts.slice(0, 2).join(' '); // minutes and seconds
    }
  };

  const getColorClass = () => {
    if (timeLeft.isExpired) {
      return 'text-red-400';
    }
    
    const totalMinutes = timeLeft.days * 24 * 60 + timeLeft.hours * 60 + timeLeft.minutes;
    
    if (totalMinutes <= 60) { // Less than 1 hour
      return 'text-red-400';
    } else if (totalMinutes <= 240) { // Less than 4 hours
      return 'text-yellow-400';
    } else {
      return 'text-emerald-400';
    }
  };

  return (
    <span className={`text-sm font-bold ${getColorClass()} ${className}`}>
      {getDisplayText()}
    </span>
  );
}

