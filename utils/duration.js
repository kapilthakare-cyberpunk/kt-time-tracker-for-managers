/**
 * Duration calculation utility for time tracking
 * Provides functions to calculate duration between timestamps
 */

/**
 * Calculate duration between two timestamps in 'HH:MM' format
 * @param {Date} start - Start timestamp
 * @param {Date} end - End timestamp
 * @returns {string} Duration in 'HH:MM' format
 * @throws {Error} If invalid Date objects are provided
 */
export function calculateDuration(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date)) {
    throw new Error('Invalid Date objects');
  }
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid Date objects - contains NaN');
  }
  
  if (end < start) {
    throw new Error('End time cannot be before start time');
  }
  
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Validate if a value is a valid Date object
 * @param {any} date - Value to validate
 * @returns {boolean} True if valid Date object
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse duration string (HH:MM) to minutes
 * @param {string} duration - Duration in 'HH:MM' format
 * @returns {number} Total minutes
 * @throws {Error} If invalid duration format
 */
export function parseDurationToMinutes(duration) {
  if (typeof duration !== 'string') {
    throw new Error('Duration must be a string');
  }
  
  const match = duration.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error('Invalid duration format. Expected HH:MM');
  }
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (minutes >= 60) {
    throw new Error('Minutes cannot be 60 or greater');
  }
  
  return hours * 60 + minutes;
}

/**
 * Convert minutes to duration string (HH:MM)
 * @param {number} totalMinutes - Total minutes
 * @returns {string} Duration in 'HH:MM' format
 */
export function minutesToDuration(totalMinutes) {
  if (typeof totalMinutes !== 'number' || totalMinutes < 0) {
    throw new Error('Total minutes must be a non-negative number');
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}