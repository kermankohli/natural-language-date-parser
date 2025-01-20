import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { getOrdinalNumber } from '../utils/ordinal-utils';

const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  last: -1, penultimate: -2, ultimate: -1, 
  'second to last': -2, 'third to last': -3
};

const MONTHS = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sep': 9, 'sept': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12
};

const DAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

const WEEKDAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

function findNthWeekday(year: number, month: number, weekday: number, n: number): Date | null {
  Logger.debug('Finding nth weekday', { year, month, weekday, n });
  
  const date = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  
  if (n > 0) {
    // Find first occurrence of weekday
    while (date.getUTCDay() !== weekday) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    
    // Calculate how many occurrences exist in this month
    const firstOccurrence = date.getUTCDate();
    const maxOccurrences = Math.floor((lastDay - firstOccurrence) / 7) + 1;
    
    // If requested occurrence doesn't exist, return null
    if (n > maxOccurrences) {
      Logger.debug('Requested occurrence does not exist', {
        n,
        maxOccurrences,
        firstOccurrence,
        lastDay
      });
      return null;
    }
    
    // Add weeks to get to nth occurrence
    date.setUTCDate(date.getUTCDate() + (n - 1) * 7);
  } else {
    // For negative indices (e.g., last, second to last)
    date.setUTCMonth(month, 0); // Go to last day of target month
    
    // Find last occurrence of weekday
    while (date.getUTCDay() !== weekday) {
      date.setUTCDate(date.getUTCDate() - 1);
    }
    
    // Calculate how many occurrences exist in this month
    const lastOccurrence = date.getUTCDate();
    const maxOccurrences = Math.floor(lastOccurrence / 7) + 1;
    
    // If requested occurrence doesn't exist, return null
    if (Math.abs(n) > maxOccurrences) {
      Logger.debug('Requested occurrence does not exist', {
        n,
        maxOccurrences,
        lastOccurrence
      });
      return null;
    }
    
    // Subtract weeks to get to desired occurrence from the end
    date.setUTCDate(date.getUTCDate() + (n + 1) * 7);
    
    // If we've gone before the start of the month, return null
    if (date.getUTCMonth() !== month - 1) {
      return null;
    }
  }
  
  return date;
}

function findNthFromEnd(year: number, month: number, n: number): Date | null {
  Logger.debug('findNthFromEnd input', { year, month, n });
  
  // Get last day of month
  const lastDay = new Date(Date.UTC(year, month, 0));
  
  // Subtract n-1 days from the last day
  const result = new Date(lastDay);
  result.setUTCDate(lastDay.getUTCDate() - (Math.abs(n) - 1));
  
  // Validate the date is still in the correct month
  if (result.getUTCMonth() !== month - 1) {
    return null;
  }
  
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
      name: 'nth-weekday-in-month',
      regex: /^(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\s+(?:in|of)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const ordinal = matches[1].toLowerCase();
        const weekday = matches[2].toLowerCase();
        const month = matches[3].toLowerCase();
        
        let n: number;
        if (ordinal === 'last') {
          n = -1;
        } else {
          const parsed = parseInt(ordinal);
          if (!isNaN(parsed)) {
            n = parsed;
          } else {
            n = {
              'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5
            }[ordinal] || 1; // Default to 1 if not found
          }
        }
        
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'nth-weekday-in-month',
          captures: {
            n: n.toString(),
            weekday,
            month
          }
        };
      }
    },
    {
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
    },
    {
      name: 'nth-of-month',
      regex: /^(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?(?:day\s+of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        Logger.debug('Parsing nth of month', { matches: matches.map(m => m) });
        const [, day, month] = matches;
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'nth-of-month',
          captures: {
            day,
            month: month.toLowerCase()
          }
        };
      }
    },
    {
      name: 'month-nth',
      regex: /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        Logger.debug('Parsing month nth', { matches: matches.map(m => m) });
        const [, month, day] = matches;
        return {
          type: 'ordinal',
          tokens: [matches[0]],
          pattern: 'month-nth',
          captures: {
            day,
            month: month.toLowerCase()
          }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    if (!intermediate.captures) return null;

    const { day, month } = intermediate.captures;
    if (!day || !month) return null;

    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) return null;

    // Map abbreviated month names to full names using MONTHS object
    const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
    if (!monthNum) return null;

    // Use the reference date's year for validation
    const referenceYear = prefs.referenceDate?.getUTCFullYear() || new Date().getUTCFullYear();
    const targetYear = referenceYear;

    // For February, check if it's a leap year when day is 29
    if (monthNum === 2 && dayNum === 29) {
      const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
      if (!isLeapYear) {
        Logger.debug('Invalid date: February 29 in non-leap year', { targetYear });
        return null;
      }
    }

    // Validate the day number is valid for the given month and year
    const lastDayOfMonth = new Date(Date.UTC(targetYear, monthNum, 0)).getUTCDate();
    if (dayNum < 1 || dayNum > lastDayOfMonth) {
      Logger.debug('Invalid day for month', {
        day: dayNum,
        month: monthNum,
        year: targetYear,
        lastDayOfMonth
      });
      return null;
    }

    Logger.debug('Interpreting nth of month', {
      month: monthNum,
      day: dayNum,
      result: new Date(Date.UTC(targetYear, monthNum - 1, dayNum)).toISOString()
    });

    // Create the date
    const result = new Date(Date.UTC(targetYear, monthNum - 1, dayNum));

    return {
      type: 'single',
      start: result,
      confidence: 1.0,
      text: intermediate.tokens?.[0] || intermediate.text || ''
    };
  }
}; 