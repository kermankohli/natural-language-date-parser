import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

type WeekStartDay = DateParsePreferences['weekStartsOn'];

/**
 * Convert any Date to pure UTC midnight (00:00:00.000Z).
 * This prevents local time offsets from skewing the day-of-week.
 */
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() // Force to the same YYYY-MM-DD but at 00:00:00 UTC
  ));
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

function getWeekStart(date: Date, weekStartsOn: NonNullable<WeekStartDay>): Date {
  const utcDate = toUtcMidnight(date);
  const currentDay = utcDate.getUTCDay();
  
  // For Sunday start (0):
  // - If today is Sunday, start today
  // - Otherwise, go back to last Sunday
  const daysToSubtract = weekStartsOn === 0
    ? (currentDay === 0 ? 0 : currentDay)  // Go back to last Sunday
    : (currentDay === 0 ? 6 : currentDay - 1);  // Go back to last Monday

  Logger.debug('Calculated days to subtract', { daysToSubtract });

  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - daysToSubtract);

  Logger.debug('Week start result', {
    weekStart: weekStart.toISOString()
  });

  return weekStart;
}

function getWeekRange(date: Date, weekStartsOn: NonNullable<WeekStartDay>): WeekRange {
  const start = getWeekStart(date, weekStartsOn);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

interface WeekCaptures {
  offset: string;
  returnRange?: 'true' | 'false';  // Control range vs single
}

export const relativeWeeksRule: RuleModule = {
  name: 'relative-weeks',
  patterns: [
    {
      name: 'this-week',
      regex: /^this\s+week$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['this week'],
        pattern: 'this-week',
        captures: { 
          offset: '0',
          returnRange: 'true'  // Full week range
        }
      })
    },
    {
      name: 'next-week',
      regex: /^next\s+week$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['next week'],
        pattern: 'next-week',
        captures: { 
          offset: '1',
          returnRange: 'true'  // Full week range
        }
      })
    },
    {
      name: 'week-after-next',
      regex: /^(the\s+)?week\s+after\s+next$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['week after next'],
        pattern: 'week-after-next',
        captures: { offset: '2', returnRange: 'true' }
      })
    },
    {
      name: 'last-week',
      regex: /^last\s+week$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['last week'],
        pattern: 'last-week',
        captures: { offset: '-1', returnRange: 'true' }
      })
    },
    {
      name: 'n-weeks-from-now',
      regex: /^(\d+)\s+weeks?\s+from\s+(?:now|today)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const [, weeks] = matches;
        return {
          type: 'relative',
          tokens: [matches[0]],
          pattern: 'n-weeks-from-now',
          captures: { offset: weeks, returnRange: 'true' }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const { offset, returnRange } = intermediate.captures || {};
    if (!offset) return null;

    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum)) return null;

    const shouldReturnRange = returnRange === 'true';

    const referenceDate = prefs.referenceDate || new Date();
    const weekStartsOn = prefs.weekStartsOn ?? 1;

    // First find start of current week
    const thisWeekStart = getWeekStart(referenceDate, weekStartsOn);
    
    // Then add the offset weeks
    const targetDate = addWeeks(thisWeekStart, offsetNum);

    if (shouldReturnRange) {
      const end = new Date(targetDate);
      end.setUTCDate(end.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      
      return {
        type: 'range',
        start: targetDate,
        end,
        confidence: 1.0,
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    }

    return {
      type: 'single',
      start: targetDate,
      confidence: 1.0,
      text: intermediate.tokens?.[0] || intermediate.text || ''
    };
  }
};
