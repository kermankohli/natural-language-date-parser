import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

const MONTHS = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sep': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12
} as const;

function parseMonthName(monthStr: string): number {
  const month = MONTHS[monthStr.toLowerCase() as keyof typeof MONTHS];
  return month || 0;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= lastDay;
}

function createDateParser(format: string) {
  return (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
    const [_, ...parts] = matches;
    let year: number, month: number, day: number;

    switch (format) {
      case 'YMD':
        [year, month, day] = parts.map(p => parseInt(p));
        break;
      case 'MDY':
        [month, day, year] = parts.map(p => parseInt(p));
        break;
      case 'DMY':
        [day, month, year] = parts.map(p => parseInt(p));
        break;
      default:
        return null;
    }

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const date = DateTime.utc(year, month, day);
    if (!date.isValid) {
      return null;
    }

    return {
      type: 'single',
      start: date,
      confidence: 1,
      text: matches[0]
    };
  };
}

function createMonthNameParser(format: 'MonthFirst' | 'DayFirst') {
  return (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
    Logger.debug('Parsing month name date', {
      format,
      matches: matches.map(m => m),
    });
    
    let year: number, month: number, day: number;
    const currentYear = preferences.referenceDate?.toUTC().year || new Date().getUTCFullYear();
    
    if (format === 'MonthFirst') {
      month = parseMonthName(matches[1]);
      day = parseInt(matches[2]);
      year = matches[3] ? parseInt(matches[3]) : currentYear;
    } else {
      day = parseInt(matches[1]);
      month = parseMonthName(matches[2]);
      year = matches[3] ? parseInt(matches[3]) : currentYear;
    }

    if (!isValidDate(year, month, day)) {
      Logger.debug('Invalid date components', { year, month, day });
      return null;
    }

    const result = DateTime.utc(year, month, day);
    return {
      type: 'single',
      start: result,
      confidence: 1.0,
      text: matches[0]
    };
  };
}

const patterns: Pattern[] = [
  {
    regex: /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?(?:\s*([+-]\d{4})?)?$/,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, year, month, day, hours, minutes, timezone] = matches;
      
      // Create base date in UTC
      let date = DateTime.utc(
        parseInt(year),
        parseInt(month),
        parseInt(day)
      );

      // Add time if provided
      if (hours && minutes) {
        date = date.set({
          hour: parseInt(hours),
          minute: parseInt(minutes)
        });
      }

      // Handle timezone if provided
      if (timezone) {
        // Convert timezone offset from ±HHMM to ±HH:MM format
        const formattedTz = timezone.replace(/([+-])(\d{2})(\d{2})/, '$1$2:$3');
        date = date.setZone(formattedTz, { keepLocalTime: true });
      } else if (preferences.timeZone) {
        // If no explicit timezone but preferences has one
        date = date.setZone(preferences.timeZone, { keepLocalTime: true });
      }

      // Convert to UTC for storage
      const utcDate = date.toUTC();

      if (!utcDate.isValid) {
        return null;
      }

      return {
        type: 'single',
        start: utcDate,
        confidence: 1,
        text: matches[0]
      };
    }
  },
  {
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?(?:\s*([+-]\d{4})?)?$/,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, month, day, year, hours, minutes, timezone] = matches;
      let parsedYear = parseInt(year);
      
      // Handle 2-digit years
      if (parsedYear < 100) {
        parsedYear += parsedYear < 50 ? 2000 : 1900;
      }

      // Create base date in UTC
      let date = DateTime.utc(
        parsedYear,
        parseInt(month),
        parseInt(day)
      );

      // Add time if provided
      if (hours && minutes) {
        date = date.set({
          hour: parseInt(hours),
          minute: parseInt(minutes)
        });
      }

      // Handle timezone if provided
      if (timezone) {
        // Convert timezone offset from ±HHMM to ±HH:MM format
        const formattedTz = timezone.replace(/([+-])(\d{2})(\d{2})/, '$1$2:$3');
        date = date.setZone(formattedTz, { keepLocalTime: true });
      } else if (preferences.timeZone) {
        // If no explicit timezone but preferences has one
        date = date.setZone(preferences.timeZone, { keepLocalTime: true });
      }

      // Convert to UTC for storage
      const utcDate = date.toUTC();

      if (!utcDate.isValid) {
        return null;
      }

      return {
        type: 'single',
        start: utcDate,
        confidence: 1,
        text: matches[0]
      };
    }
  }
];

export const absoluteDatesRule: RuleModule = {
  name: 'absolute-dates',
  patterns
}; 