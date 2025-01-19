import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

type WeekStartDay = DateParsePreferences['weekStartDay'];

const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  last: -1, 'second to last': -2, 'third to last': -3
};

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function getOrdinalNumber(ordinal: string): number {
  // Handle numeric ordinals like "2nd", "3rd", etc.
  const numericMatch = ordinal.match(/^(\d+)(?:st|nd|rd|th)?$/i);
  if (numericMatch) {
    Logger.debug('Parsing numeric ordinal', {
      ordinal,
      match: numericMatch[1],
      result: parseInt(numericMatch[1], 10)
    });
    return parseInt(numericMatch[1], 10);
  }
  
  const result = ORDINALS[ordinal as keyof typeof ORDINALS] || 0;
  Logger.debug('Parsing word ordinal', {
    ordinal,
    result
  });
  return result;
}

function findNthWeekStart(year: number, month: number, n: number, weekStartDay: NonNullable<WeekStartDay>): Date | null {
  // Create first day of month
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  
  // Find first occurrence of week start day
  let currentDay = firstDay.getUTCDay();
  
  // Calculate days to add to get to first week start
  let daysToAdd: number;
  if (weekStartDay === 0) { // Sunday start
    daysToAdd = currentDay === 0 ? 0 : 7 - currentDay;
  } else { // Monday start
    daysToAdd = currentDay === 1 ? 0 : (currentDay === 0 ? -6 : 8 - currentDay);
  }
  
  // Get to first week start
  const firstWeekStart = new Date(firstDay);
  firstWeekStart.setUTCDate(1 + daysToAdd);
  
  // Add weeks to get to nth week
  const result = new Date(firstWeekStart);
  result.setUTCDate(result.getUTCDate() + ((n - 1) * 7));
  
  // If we've gone past the month, return null
  if (result.getUTCMonth() !== month - 1) {
    return null;
  }
  
  Logger.debug('Finding nth week start', {
    year,
    month,
    n,
    weekStartDay,
    firstDay: firstDay.toISOString(),
    currentDay,
    daysToAdd,
    firstWeekStart: firstWeekStart.toISOString(),
    result: result.toISOString()
  });
  
  return result;
}

function findNthWeekFromEnd(year: number, month: number, n: number, weekStartDay: NonNullable<WeekStartDay>): Date | null {
  // Get last day of month
  const lastDay = new Date(Date.UTC(year, month, 0));
  
  // Find last occurrence of week start day
  let currentDay = lastDay.getUTCDay();
  const daysToSubtract = currentDay >= weekStartDay 
    ? currentDay - weekStartDay 
    : currentDay - weekStartDay + 7;
  
  // Get to last week start
  const lastWeekStart = new Date(lastDay);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - daysToSubtract);
  
  // Subtract weeks to get to nth from last week
  const result = new Date(lastWeekStart);
  result.setUTCDate(result.getUTCDate() - ((Math.abs(n) - 1) * 7));
  
  // If we've gone before the month, return null
  if (result.getUTCMonth() !== month - 1) {
    return null;
  }
  
  return result;
}

interface WeekRange {
  start: Date;
  end: Date;
}

function getWeekRange(start: Date): WeekRange {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

export const ordinalWeeksRule: RuleModule = {
  name: 'ordinal-weeks',
  patterns: [
    {
      name: 'week-of-month',
      regex: /^(?:the\s+)?(\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|last|second to last|third to last)\s+week\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        Logger.debug('Parsing week pattern', { matches: matches.map(m => m) });
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'week-of-month',
          captures: {
            ordinal: matches[1].toLowerCase(),
            month: matches[2].toLowerCase(),
            returnRange: 'true'
          }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const weekStartDay = prefs.weekStartDay === undefined ? 1 : prefs.weekStartDay;
    const { ordinal, month } = intermediate.captures;
    
    // Get year from reference date or current year
    const referenceDate = prefs.referenceDate || new Date();
    const year = referenceDate.getUTCFullYear();
    const monthNum = MONTHS[month as keyof typeof MONTHS];
    
    Logger.debug('Interpreting ordinal week', {
      ordinal,
      month,
      year,
      monthNum,
      weekStartDay
    });

    const ordinalNum = getOrdinalNumber(ordinal);
    let start: Date | null;

    if (ordinalNum > 0) {
      // Forward ordinal (first, second, etc.)
      start = findNthWeekStart(year, monthNum, ordinalNum, weekStartDay);
    } else {
      // Backward ordinal (last, second to last, etc.)
      start = findNthWeekFromEnd(year, monthNum, ordinalNum, weekStartDay);
    }

    if (!start) {
      return null;
    }

    // Always return range for weeks
    const { start: rangeStart, end } = getWeekRange(start);
    return {
      type: 'range',
      start: rangeStart,
      end,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 