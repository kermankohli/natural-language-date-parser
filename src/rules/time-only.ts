import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences, ParserState, Pattern } from '../types/types';
import { DateTime } from 'luxon';

function createTimeResult(hour: number, minute: number, preferences?: DateParsePreferences): ParseResult {
  const referenceDate = preferences?.referenceDate || DateTime.now();
  let start = DateTime.fromObject({
    year: referenceDate.year,
    month: referenceDate.month,
    day: referenceDate.day,
    hour,
    minute
  }, { zone: 'UTC' });

  return {
    type: 'single',
    start,
    confidence: 1,
    text: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  };
}

const patterns: Pattern[] = [
  {
    regex: /(?:^|\s)(?:at\s+)?(\d{1,2}):(\d{2})(?:\s*(AM|PM))?(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      let [_, hours, minutes, meridiem] = matches;
      let hour = parseInt(hours);
      const minute = parseInt(minutes);

      if (minute >= 60) return null;

      if (meridiem) {
        if (hour > 12) return null;
        if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
      } else {
        if (hour >= 24) return null;
      }

      return createTimeResult(hour, minute, preferences);
    }
  },
  {
    regex: /(?:^|\s)(?:at\s+)?(\d{1,2})(?:\s*)(AM|PM)(?:\s|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      let [_, hours, meridiem] = matches;
      let hour = parseInt(hours);

      if (hour > 12) return null;
      if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;

      return createTimeResult(hour, 0, preferences);
    }
  },
  {
    regex: /(?:^|\s)(?:at\s+)?noon(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      return createTimeResult(12, 0, preferences);
    }
  },
  {
    regex: /(?:^|\s)(?:at\s+)?midnight(?:\s|$)/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult => {
      return createTimeResult(0, 0, preferences);
    }
  }
];

export const timeOnlyRule: RuleModule = {
  name: 'time-only',
  patterns
};

export function parse(state: ParserState, input: string, preferences?: DateParsePreferences): ParseResult | null {
  const timePattern = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;
  const match = input.match(timePattern);

  if (!match) {
    if (input.toLowerCase() === 'noon') {
      return createTimeResult(12, 0, preferences);
    }
    if (input.toLowerCase() === 'midnight') {
      return createTimeResult(0, 0, preferences);
    }
    return null;
  }

  let [_, hours, minutes, meridiem] = match;
  let hour = parseInt(hours);
  const minute = parseInt(minutes);

  if (minute >= 60) return null;

  if (meridiem) {
    if (hour > 12) return null;
    if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
  } else {
    if (hour >= 24) return null;
  }

  return createTimeResult(hour, minute, preferences);
} 