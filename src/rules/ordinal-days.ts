import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { getOrdinalNumber } from '../utils/ordinal-utils';

const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  last: -1, penultimate: -2, ultimate: -1, 
  'second to last': -2, 'third to last': -3
};

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

const DAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

function findNthWeekday(year: number, month: number, n: number, targetDay: number): Date | null {
  // For negative n (last, second to last etc), convert to positive index
  if (n < 0) {
    // Get last day of month
    const lastDay = new Date(Date.UTC(year, month, 0));
    let count = 0;
    let current = new Date(lastDay);
    
    // Count backwards until we find enough occurrences
    while (current.getUTCMonth() === month - 1) {
      if (current.getUTCDay() === targetDay) {
        count++;
        if (count === Math.abs(n)) {
          return current;
        }
      }
      current.setUTCDate(current.getUTCDate() - 1);
    }
    return null;
  }

  // Rest of the existing function for positive n...
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  
  // Find first occurrence of target day
  let currentDay = firstDay.getUTCDay();
  const daysToAdd = targetDay >= currentDay 
    ? targetDay - currentDay 
    : 7 - (currentDay - targetDay);
  
  // Get to first occurrence
  const firstOccurrence = new Date(firstDay);
  firstOccurrence.setUTCDate(1 + daysToAdd);
  
  // Add weeks to get to nth occurrence
  const result = new Date(firstOccurrence);
  result.setUTCDate(result.getUTCDate() + ((n - 1) * 7));
  
  // If we've gone past the month, return null
  if (result.getUTCMonth() !== month - 1) {
    return null;
  }
  
  Logger.debug('Finding nth weekday', {
    year,
    month,
    n,
    targetDay,
    firstDay: firstDay.toISOString(),
    currentDay,
    daysToAdd,
    firstOccurrence: firstOccurrence.toISOString(),
    result: result.toISOString()
  });
  
  return result;
}

function findNthFromEnd(year: number, month: number, n: number): Date | null {
  Logger.debug('findNthFromEnd input', { year, month, n });
  
  // Get last day of month
  const lastDay = new Date(Date.UTC(year, month, 0));
  
  // Subtract n-1 days from the last day
  const result = new Date(lastDay);
  result.setUTCDate(lastDay.getUTCDate() - (Math.abs(n) - 1));
  
  Logger.debug('findNthFromEnd result', { 
    lastDay: lastDay.toISOString(),
    n: Math.abs(n),
    daysToSubtract: Math.abs(n) - 1,
    result: result.toISOString()
  });
  
  return result;
}

export const ordinalDaysRule: RuleModule = {
  name: 'ordinal-days',
  patterns: [
    {
      // "first Monday in March"
      name: 'day-of-month',
      regex: /^(?:the\s+)?(\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+(?:in|of)\s+(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        Logger.debug('Parsing weekday pattern', { matches: matches.map(m => m) });
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'day-of-month',
          captures: {
            ordinal: matches[1].toLowerCase(),
            dayOfWeek: matches[2].toLowerCase(),
            month: matches[3].toLowerCase()
          }
        };
      }
    },
    {
      // "penultimate day of the month"
      name: 'end-of-month',
      regex: /^(?:the\s+)?(last|penultimate|ultimate|second to last|third to last)\s+day\s+(?:of\s+)?(?:the\s+)?(?:month|(?:january|february|march|april|may|june|july|august|september|october|november|december))$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const monthMatch = matches[0].match(/(?:january|february|march|april|may|june|july|august|september|october|november|december)$/i);
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'end-of-month',
          captures: {
            ordinal: matches[1].toLowerCase(),
            month: monthMatch?.[0].toLowerCase() ?? 'month'  // Default to 'month' if no specific month
          }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const { ordinal, dayOfWeek, month } = intermediate.captures;
    const referenceDate = prefs.referenceDate || new Date();
    const year = referenceDate.getUTCFullYear();
    
    Logger.debug('Interpreting ordinal day', {
      ordinal,
      dayOfWeek,
      month,
      year
    });

    const ordinalNum = getOrdinalNumber(ordinal);
    let start: Date | null;

    if (intermediate.pattern === 'day-of-month') {
      const monthNum = MONTHS[month as keyof typeof MONTHS];
      const targetDay = DAYS[dayOfWeek as keyof typeof DAYS];
      start = findNthWeekday(year, monthNum, ordinalNum, targetDay);
    } else {
      // end-of-month pattern
      const currentMonth = month === 'month'
        ? referenceDate.getUTCMonth() + 1
        : MONTHS[month as keyof typeof MONTHS];
      start = findNthFromEnd(year, currentMonth, Math.abs(ordinalNum));
    }

    if (!start) {
      return null;
    }

    return {
      type: 'single',
      start,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 