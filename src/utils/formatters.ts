/**
 * Data formatting utilities for consistent display across the application
 * Handles date/time formatting, number formatting, and text transformations optimized for mobile display
 */

/**
 * Formats timestamps for "last updated" displays
 * Shows relative time for recent updates, absolute time for older ones
 * Optimized for mobile screen space
 * 
 * @param date - Date to format
 * @returns Human-readable relative or absolute time string
 */
export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    // For older dates, show absolute date
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

/**
 * Formats dates for forecast displays
 * Shows "Today", "Tomorrow", or abbreviated day names
 * 
 * @param date - Date to format
 * @param includeDate - Whether to include month/day
 * @returns Formatted date string for forecast display
 */
export function formatForecastDate(date: Date, includeDate: boolean = false): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time components for accurate comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return includeDate ? `Today ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Today';
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return includeDate ? `Tomorrow ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Tomorrow';
  } else {
    // Show day name + date for other days
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    if (includeDate) {
      const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `${dayName} ${monthDay}`;
    }
    return dayName;
  }
}

/**
 * Formats pollen index values for display
 * Adds context to raw numbers (0-5 scale from Google API)
 * 
 * @param index - Pollen index (0-5)
 * @param includeScale - Whether to show the scale reference
 * @returns Formatted index string
 */
export function formatPollenIndex(index: number, includeScale: boolean = false): string {
  const rounded = Math.round(index * 10) / 10;
  
  if (includeScale) {
    return `${rounded}/5`;
  }
  
  return rounded.toString();
}

/**
 * Formats risk scores for display
 * Rounds to appropriate precision and adds context
 * 
 * @param score - Risk score
 * @param includeMax - Whether to show maximum possible score
 * @returns Formatted risk score string
 */
export function formatRiskScore(score: number, includeMax: boolean = false): string {
  const rounded = Math.round(score * 10) / 10;
  
  if (includeMax) {
    return `${rounded}/5.0`;
  }
  
  return rounded.toString();
}

/**
 * Formats percentage values consistently
 * @param value - Percentage value (0-100 or 0-1)
 * @param assumeDecimal - Whether input is 0-1 (true) or 0-100 (false)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, assumeDecimal: boolean = true): string {
  const percentage = assumeDecimal ? value * 100 : value;
  return `${Math.round(percentage)}%`;
}

/**
 * Formats sensitivity slider values for display
 * Converts 1-10 scale to user-friendly labels
 * 
 * @param value - Sensitivity value (1-10)
 * @returns Descriptive sensitivity level
 */
export function formatSensitivityLevel(value: number): string {
  if (value <= 2) return 'Very Low';
  if (value <= 4) return 'Low';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'High';
  return 'Very High';
}

/**
 * Formats location coordinates for display
 * Shows appropriate precision for mobile screens
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param precision - Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatCoordinates(latitude: number, longitude: number, precision: number = 4): string {
  const lat = latitude.toFixed(precision);
  const lng = longitude.toFixed(precision);
  return `${lat}, ${lng}`;
}

/**
 * Formats distance values with appropriate units
 * @param meters - Distance in meters
 * @returns Formatted distance string with units
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  
  const kilometers = meters / 1000;
  if (kilometers < 10) {
    return `${kilometers.toFixed(1)}km`;
  }
  
  return `${Math.round(kilometers)}km`;
}

/**
 * Formats time ranges for activity recommendations
 * @param startHour - Start hour (0-23)
 * @param endHour - End hour (0-23)
 * @returns Formatted time range string
 */
export function formatTimeRange(startHour: number, endHour: number): string {
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

/**
 * Capitalizes the first letter of a string
 * @param text - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Truncates text for mobile display with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats arrays for display in lists
 * Handles proper comma separation and "and" conjunction
 * 
 * @param items - Array of strings to format
 * @param maxItems - Maximum items to show before "and X more"
 * @returns Formatted list string
 */
export function formatList(items: string[], maxItems: number = 3): string {
  if (!items.length) return '';
  
  if (items.length === 1) return items[0];
  
  if (items.length <= maxItems) {
    if (items.length === 2) {
      return `${items[0]} and ${items[1]}`;
    }
    
    const allButLast = items.slice(0, -1).join(', ');
    const last = items[items.length - 1];
    return `${allButLast}, and ${last}`;
  }
  
  const shown = items.slice(0, maxItems).join(', ');
  const remaining = items.length - maxItems;
  return `${shown}, and ${remaining} more`;
}

/**
 * Formats health recommendations for display
 * Ensures proper sentence structure and removes duplicates
 * 
 * @param recommendations - Array of recommendation strings
 * @returns Cleaned and formatted recommendations
 */
export function formatRecommendations(recommendations: string[]): string[] {
  return recommendations
    .filter((rec, index, arr) => arr.indexOf(rec) === index) // Remove duplicates
    .map(rec => {
      // Ensure proper sentence capitalization and punctuation
      let formatted = rec.trim();
      if (formatted) {
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        if (!formatted.endsWith('.') && !formatted.endsWith('!')) {
          formatted += '.';
        }
      }
      return formatted;
    })
    .filter(rec => rec.length > 0); // Remove empty strings
}

/**
 * Formats error messages for user-friendly display
 * Removes technical details while preserving helpful information
 * 
 * @param error - Error message or Error object
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    // Clean up technical error messages
    let message = error.message;
    
    // Remove common technical prefixes
    message = message.replace(/^(Error:|TypeError:|NetworkError:)\s*/i, '');
    
    // Capitalize first letter
    message = capitalize(message);
    
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}