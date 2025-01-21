import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult, RuleModule, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';

function createDateResult(date: DateTime, preferences: DateParsePreferences): ParseResult {
  // If timezone is specified, convert to that timezone first
  // If no timezone is specified, use UTC
  const targetZone = preferences.timeZone || 'UTC';
  date = date.setZone(targetZone);
  
  // Convert back to UTC for storage
  const utcDate = date.toUTC();
  
  return {
    type: 'single',
    start: utcDate,
    confidence: 1,
    text: utcDate.toFormat('yyyy-MM-dd')
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
    regex: /(?:^|\s)next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      const weekday = matches[1].toLowerCase() as keyof typeof WEEKDAYS;
      const targetDay = WEEKDAYS[weekday];
      const date = (preferences.referenceDate || DateTime.now()).set({ weekday: targetDay });
      return createDateResult(date, preferences);
    }
  }
];

export const relativeDaysRule: RuleModule = {
  name: 'relative-days',
  patterns
}; 