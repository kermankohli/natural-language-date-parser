import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { DateTime } from 'luxon';

function getWeekRange(date: DateTime, weekStartsOn: number = 0): { start: DateTime; end: DateTime } {
  // Luxon uses 1-7 (Monday=1, Sunday=7)
  // Calculate days to subtract to get to the start of the week
  const daysToSubtract = ((date.weekday - weekStartsOn + 7) % 7);
  
  // Get start and end of week
  const start = date.minus({ days: daysToSubtract }).startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');

  return { start, end };
}

const patterns: Pattern[] = [
  {
    regex: /^(this|next|last)\s+week$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, modifier] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn;

      let targetDate = referenceDate;
      switch (modifier.toLowerCase()) {
        case 'next':
          targetDate = referenceDate.plus({ weeks: 1 });
          break;
        case 'last':
          targetDate = referenceDate.minus({ weeks: 1 });
          break;
      }

      const { start, end } = getWeekRange(targetDate, weekStartsOn);

      return {
        type: 'range',
        start,
        end,
        confidence: 1,
        text: matches[0]
      };
    }
  },
  {
    regex: /^(the\s+)?week\s+after\s+next$/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      const targetDate = referenceDate.plus({ weeks: 2 });
      const { start, end } = getWeekRange(targetDate, weekStartsOn);

      return {
        type: 'range',
        start,
        end,
        confidence: 1,
        text: 'week after next'
      };
    }
  },
  {
    regex: /^(\d+)\s+weeks?\s+(from\s+now|ago)$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, count, direction] = matches;
      const weeks = parseInt(count);
      if (isNaN(weeks)) return null;

      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      const targetDate = direction.includes('ago')
        ? referenceDate.minus({ weeks })
        : referenceDate.plus({ weeks });

      const { start, end } = getWeekRange(targetDate, weekStartsOn);
      return {
        type: 'range',
        start,
        end,
        confidence: 1,
        text: matches[0]
      };
    }
  },
  {
    regex: /^upcoming\s+week$/i,
    parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      // "Upcoming week" always means next week, just like "upcoming Wednesday" means next Wednesday
      const targetDate = referenceDate.plus({ weeks: 1 });
      
      const { start, end } = getWeekRange(targetDate, weekStartsOn);

      return {
        type: 'range',
        start,
        end,
        confidence: 1,
        text: 'upcoming week'
      };
    }
  }
];

export const relativeWeeksRule: RuleModule = {
  name: 'relative-weeks',
  patterns
};
