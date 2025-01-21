import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';
type WeekStartDay = DateParsePreferences['weekStartsOn'];

/**
 * Convert any Date to pure UTC midnight (00:00:00.000Z).
 * This prevents local time offsets from skewing the day-of-week.
 */
function toUtcMidnight(date: DateTime): DateTime {
  return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
}

interface WeekRange {
  start: Date;
  end: Date;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + (weeks * 7));
  return result;
}

function getWeekStart(date: DateTime, weekStartsOn: number = 0): DateTime {
  const currentDay = date.weekday % 7;
  const diff = (currentDay - weekStartsOn + 7) % 7;
  return date.minus({ days: diff });
}

function getWeekRange(date: DateTime, weekStartsOn: number = 0): { start: DateTime; end: DateTime } {
  const start = getWeekStart(date, weekStartsOn);
  const end = start.plus({ days: 6 });
  return { start, end };
}

interface WeekCaptures {
  offset: string;
  returnRange?: 'true' | 'false';  // Control range vs single
}

const patterns: Pattern[] = [
  {
    regex: /^(this|next|last)\s+week$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, modifier] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

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
  }
];

export const relativeWeeksRule: RuleModule = {
  name: 'relative-weeks',
  patterns
};
