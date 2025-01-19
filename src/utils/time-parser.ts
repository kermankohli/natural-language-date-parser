import { Logger } from './Logger';

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  offsetMinutes: number;
}

export type TimeComponentStrings = Record<keyof TimeComponents, string>;

export function parseTimeString(
  timeStr: string, 
  options: { allow12Hour?: boolean } = {}
): TimeComponents | null {
  Logger.debug('Parsing time string', { timeStr, options });

  const TIME_24H = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(Z|[+-]\d{1,2}(?::?\d{2})?)?$/i;
  const TIME_12H = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)(?:\s*(Z|[+-]\d{1,2}(?::?\d{2})?)?)?$/i;

  let match = timeStr.match(TIME_24H);
  let is12Hour = false;
  
  if (!match && options.allow12Hour) {
    match = timeStr.match(TIME_12H);
    is12Hour = !!match;
  }

  if (!match) return null;

  // Parse basic components
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = match[3] ? parseInt(match[3]) : 0;
  let offsetMinutes = 0;

  // Basic validation
  if (minutes >= 60 || seconds >= 60) return null;

  // Handle 12-hour format first
  if (is12Hour) {
    const meridiem = match[4].toLowerCase();
    if (hours > 12) return null;  // 13:00 PM is invalid
    if (hours === 0 && meridiem === 'pm') return null; // 00:00 PM is invalid
    
    if (meridiem === 'pm') {
      hours = hours === 12 ? 12 : hours + 12;
    } else { // am
      hours = hours === 12 ? 0 : hours;
    }
  } else {
    // 24-hour validation
    if (hours >= 24) return null;
  }

  // Handle timezone
  const timezone = is12Hour ? match[5] : match[4];
  if (timezone) {
    if (timezone.toUpperCase() === 'Z') {
      offsetMinutes = 0;
    } else {
      const tzMatch = timezone.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
      if (tzMatch) {
        const [, sign, tzHours, tzMinutes = '0'] = tzMatch;
        const tzH = parseInt(tzHours);
        const tzM = parseInt(tzMinutes);

        // Validate timezone components
        if (tzH > 14 || tzM >= 60) return null;
        
        const offset = tzH * 60 + tzM;
        // For UTC conversion: 
        // If local is ahead (+), subtract to get UTC
        // If local is behind (-), add to get UTC
        offsetMinutes = sign === '+' ? offset : -offset;
      }
    }
  }

  return { hours, minutes, seconds, offsetMinutes };
}

export function timeComponentsToString(components: TimeComponents): TimeComponentStrings {
  return {
    hours: components.hours.toString().padStart(2, '0'),
    minutes: components.minutes.toString().padStart(2, '0'),
    seconds: components.seconds.toString().padStart(2, '0'),
    offsetMinutes: components.offsetMinutes.toString()
  };
} 