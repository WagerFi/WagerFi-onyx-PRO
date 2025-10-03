import { format, parse, isValid } from 'date-fns';

/**
 * Parses a date string in various formats and returns a Date object
 * Handles DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD formats
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  try {
    // First try to parse as ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Create a local date at midnight, not UTC
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (isValid(date)) {
        return date;
      }
    }

    // Try parsing as DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      // Try DD/MM/YYYY format (European)
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-based month
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day, 0, 0, 0, 0);
        if (isValid(date)) {
          return date;
        }
      }
    }

    // Try MM/DD/YYYY format (US)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      const month = parseInt(parts[0], 10) - 1; // 0-based month
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day, 0, 0, 0, 0);
        if (isValid(date)) {
          return date;
        }
      }
    }

    // Last fallback, try direct parsing
    const parsedDate = new Date(dateString);
    if (isValid(parsedDate)) {
      // Create a local date at midnight
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        0, 0, 0, 0
      );
    }

    console.error('Failed to parse date:', dateString);
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Formats a date string for display
 * @param dateString Date string in any supported format
 * @param formatStr Optional format string (default: 'MMM d, yyyy')
 */
export const formatDateString = (dateString: string, formatStr: string = 'MMM d, yyyy'): string => {
  if (!dateString) return '';

  const date = parseDate(dateString);
  if (!date) return dateString;

  return format(date, formatStr);
};

/**
 * Formats a date string as MM/DD/YYYY
 * @param dateString Date string in any supported format
 */
export const formatDateStringMMA = (dateString: string): string => {
  if (!dateString) return '';

  const date = parseDate(dateString);
  if (!date) return dateString;

  return format(date, 'MM/dd/yyyy');
};

/**
 * Converts a date from DD/MM/YYYY to YYYY-MM-DD format
 */
export const convertToISOFormat = (dateString: string): string => {
  if (!dateString) return '';

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Parse the date
  const date = parseDate(dateString);
  if (!date) return dateString;

  // Convert to YYYY-MM-DD format
  return format(date, 'yyyy-MM-dd');
};

/**
 * Formats a time string to 12-hour format
 * @deprecated Use formatTimeFromTimestamp for timezone-aware formatting
 */
export const formatTimeString = (timeString: string | null): string => {
  if (!timeString) return '';

  // If it already includes AM/PM, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }

  // If it's in 24-hour format (HH:MM:SS or HH:MM)
  if (timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes.substring(0, 2)} ${ampm}`;
  }

  return timeString;
};

/**
 * Formats a timestamp to local time in 12-hour format
 * This function properly handles timezone conversion by using the timestamp
 * @param timestamp Unix timestamp in seconds
 * @param fallbackTimeString Fallback time string if timestamp is invalid
 */
export const formatTimeFromTimestamp = (timestamp: number | null | undefined, fallbackTimeString?: string | null): string => {
  // If we have a valid timestamp, use it for accurate timezone conversion
  if (timestamp && timestamp > 0) {
    try {
      const date = new Date(timestamp * 1000); // Convert to milliseconds
      if (isValid(date)) {
        return date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
    }
  }

  // Fallback to the original time string formatting
  if (fallbackTimeString) {
    return formatTimeString(fallbackTimeString);
  }

  return '';
};

/**
 * Formats a timestamp to local date in readable format
 * @param timestamp Unix timestamp in seconds
 * @param fallbackDateString Fallback date string if timestamp is invalid
 */
export const formatDateFromTimestamp = (timestamp: number | null | undefined, fallbackDateString?: string | null): string => {
  // If we have a valid timestamp, use it for accurate timezone conversion
  if (timestamp && timestamp > 0) {
    try {
      const date = new Date(timestamp * 1000); // Convert to milliseconds
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy');
      }
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
    }
  }

  // Fallback to the original date string formatting
  if (fallbackDateString) {
    return formatDateString(fallbackDateString);
  }

  return '';
};

/**
 * Formats an expiration date string to local timezone with date and time
 * @param expiresAt ISO date string from database
 * @param includeTime Whether to include time (default: true)
 */
export const formatExpirationDate = (expiresAt: string, includeTime: boolean = true): string => {
  if (!expiresAt) return '';

  try {
    const date = new Date(expiresAt);
    if (!isValid(date)) return expiresAt;

    if (includeTime) {
      // Format as "MMM d, yyyy at h:mm AM/PM" in user's local timezone
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      // Format as "MMM d, yyyy" in user's local timezone
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.warn('Error formatting expiration date:', error);
    return expiresAt;
  }
};

/**
 * Formats an expiration date with the time portion styled for React components
 * @param expiresAt ISO date string from database
 * @returns Object with date and time parts for styling
 */
export const formatExpirationDateParts = (expiresAt: string): { dateLabel: string; timePart: string } => {
  if (!expiresAt) return { dateLabel: '', timePart: '' };

  try {
    const date = new Date(expiresAt);
    if (!isValid(date)) return { dateLabel: expiresAt, timePart: '' };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const expiryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let dateLabel: string;

    if (expiryDate.getTime() === today.getTime()) {
      dateLabel = 'today';
    } else if (expiryDate.getTime() === tomorrow.getTime()) {
      dateLabel = 'tomorrow';
    } else {
      // For dates beyond tomorrow, show the actual date
      dateLabel = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    const timePart = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return { dateLabel, timePart };
  } catch (error) {
    console.warn('Error formatting expiration date parts:', error);
    return { dateLabel: expiresAt, timePart: '' };
  }
};