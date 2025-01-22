import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult, RuleModule, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';

function createDateResult(date: DateTime, preferences: DateParsePreferences): ParseResult {
  // If timezone is specified, convert to that timezone
  // If no timezone is specified, use UTC
  const targetZone = preferences.timeZone || 'UTC';
  
  // Convert to target timezone preserving the absolute time
  let result = date.setZone(targetZone);
  
  return {
    type: 'single',
    start: result,
    confidence: 1,
    text: result.toFormat('yyyy-MM-dd')
  };
}

const WEEKDAYS = {
  'sunday': 7, 'sun': 7,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6
} as const;

const patterns: Pattern[] = [
  {
    regex: /(?:^|\s)today(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const date = preferences.referenceDate || DateTime.now();
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)tomorrow(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const date = (preferences.referenceDate || DateTime.now()).plus({ days: 1 });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)yesterday(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const date = (preferences.referenceDate || DateTime.now()).minus({ days: 1 });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)(\d+)\s+days?\s+from\s+(?:now|today)(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const [_, days] = matches;
      const date = (preferences.referenceDate || DateTime.now()).plus({ days: parseInt(days) });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)(\d+)\s+days?\s+ago(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const [_, days] = matches;
      const date = (preferences.referenceDate || DateTime.now()).minus({ days: parseInt(days) });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)(the day after tomorrow|2 days from (?:now|today))(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const date = (preferences.referenceDate || DateTime.now()).plus({ days: 2 });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)(the day before yesterday|2 days ago)(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const date = (preferences.referenceDate || DateTime.now()).minus({ days: 2 });
      return createDateResult(date, preferences);
    }
  },
  {
    regex: /(?:^|\s)upcoming\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const weekday = matches[1].toLowerCase() as keyof typeof WEEKDAYS;
      const targetDay = WEEKDAYS[weekday];
      const date = (preferences.referenceDate || DateTime.now());
      
      // Get the next occurrence of the target weekday
      let result = date.set({ weekday: targetDay });
      
      // For "upcoming", if the target day is more than 3 days away,
      // we want the immediate occurrence, even if it's in the past
      // This handles cases like "upcoming Tuesday" on a Monday
      if (result > date && result.diff(date, 'days').days > 3) {
        result = result.minus({ weeks: 1 });
      } else if (result <= date) {
        result = result.plus({ weeks: 1 });
      }
      
      return createDateResult(result, preferences);
    }
  },
  {
    regex: /(?:^|\s)next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const weekday = matches[1].toLowerCase() as keyof typeof WEEKDAYS;
      const targetDay = WEEKDAYS[weekday];
      const date = (preferences.referenceDate || DateTime.now());
      
      // Get the next occurrence of the target weekday
      let result = date.set({ weekday: targetDay });
      // For "next", we always want next week's occurrence
      result = result.plus({ weeks: 1 });
      
      return createDateResult(result, preferences);
    }
  }
];

export const relativeDaysRule: RuleModule = {
  name: 'relative-days',
  patterns
}; 