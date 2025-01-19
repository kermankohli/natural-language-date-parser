import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function getWeekendRange(referenceDate: Date, offset: number): { start: Date, end: Date } {
  const start = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  
  const currentDay = start.getUTCDay();
  const daysToSaturday = (6 - currentDay) % 7;
  
  // Move to next Saturday
  start.setUTCDate(start.getUTCDate() + daysToSaturday + (offset * 7));
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
}

function getHalfMonthRange(year: number, month: number, isSecondHalf: boolean): { start: Date, end: Date } {
  const start = new Date(Date.UTC(year, month - 1, isSecondHalf ? 16 : 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = new Date(Date.UTC(year, month - 1, isSecondHalf ? lastDay : 15, 23, 59, 59, 999));
  return { start, end };
}

function getMultipleWeekendRange(referenceDate: Date, offset: number, count: number): { start: Date, end: Date } {
  // Get first weekend
  const { start } = getWeekendRange(referenceDate, offset);
  
  // Get last weekend by adding (count-1) weeks to first weekend
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + ((count - 1) * 7) + 1);  // +1 for Sunday
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
}

export const fuzzyRangesRule: RuleModule = {
  name: 'fuzzy-ranges',
  patterns: [
    {
      // "next weekend", "this weekend"
      name: 'weekend',
      regex: /^(this|next|the following)\s+weekend$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'weekend',
        captures: {
          offset: matches[1].toLowerCase() === 'next' ? '1' : 
                 matches[1].toLowerCase() === 'the following' ? '1' : '0'
        }
      })
    },
    {
      // "first half of April", "second half of April"
      name: 'half-month',
      regex: /^(first|second)\s+half\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'half-month',
        captures: {
          half: matches[1].toLowerCase(),
          month: matches[2].toLowerCase()
        }
      })
    },
    {
      // "next 2 weekends", "following 3 weekends"
      name: 'multiple-weekends',
      regex: /^(?:next|following)\s+(\d+)\s+weekends$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'multiple-weekends',
        captures: {
          count: matches[1],
          offset: '1'  // Always start from next weekend
        }
      })
    },
    {
      // "first 3 days of next month"
      name: 'days-of-month',
      regex: /^(first|last)\s+(\d+)\s+days\s+(?:of\s+)?(next\s+month|(?:january|february|march|april|may|june|july|august|september|october|november|december))$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'days-of-month',
        captures: {
          position: matches[1].toLowerCase(),
          count: matches[2],
          month: matches[3].toLowerCase()
        }
      })
    },
    {
      // "beginning of April", "end of March"
      name: 'month-parts',
      regex: /^(beginning|end)\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'month-parts',
        captures: {
          part: matches[1].toLowerCase(),
          month: matches[2].toLowerCase()
        }
      })
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult => {
    const referenceDate = prefs.referenceDate || new Date();
    
    if (intermediate.pattern === 'weekend') {
      const offset = parseInt(intermediate.captures.offset, 10);
      const { start, end } = getWeekendRange(referenceDate, offset);
      
      Logger.debug('Interpreting weekend', {
        referenceDate: referenceDate.toISOString(),
        offset,
        start: start.toISOString(),
        end: end.toISOString()
      });

      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'half-month') {
      const { half, month } = intermediate.captures;
      const year = referenceDate.getUTCFullYear();
      const monthNum = MONTHS[month as keyof typeof MONTHS];
      const isSecondHalf = half === 'second';
      
      const { start, end } = getHalfMonthRange(year, monthNum, isSecondHalf);
      
      Logger.debug('Interpreting half month', {
        half,
        month,
        year,
        monthNum,
        start: start.toISOString(),
        end: end.toISOString()
      });

      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'multiple-weekends') {
      const offset = parseInt(intermediate.captures.offset, 10);
      const count = parseInt(intermediate.captures.count, 10);
      return {
        type: 'range',
        ...getMultipleWeekendRange(referenceDate, offset, count),
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'days-of-month') {
      const { position, count, month } = intermediate.captures;
      let year = referenceDate.getUTCFullYear();
      let monthNum = month === 'next month' 
        ? referenceDate.getUTCMonth() + 2 
        : MONTHS[month as keyof typeof MONTHS];
      
      // Handle year rollover
      if (monthNum > 12) {
        monthNum = 1;
        year++;
      }

      const numDays = parseInt(count, 10);
      
      let startDate: Date;
      let endDate: Date;
      
      if (position === 'first') {
        startDate = new Date(Date.UTC(year, monthNum - 1, 1));
        endDate = new Date(Date.UTC(year, monthNum - 1, numDays));
      } else if (position === 'last') {
        const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
        startDate = new Date(Date.UTC(year, monthNum - 1, lastDay - numDays + 1));
        endDate = new Date(Date.UTC(year, monthNum - 1, lastDay));
      } else {
        throw new Error('Invalid position');
      }
      
      endDate.setUTCHours(23, 59, 59, 999);

      Logger.debug('Interpreting days of month', {
        position,
        count,
        month,
        year,
        monthNum,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      return {
        type: 'range',
        start: startDate,
        end: endDate,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'month-parts') {
      const { part, month } = intermediate.captures;
      const year = referenceDate.getUTCFullYear();
      const monthNum = MONTHS[month as keyof typeof MONTHS];
      
      let startDate: Date;
      let endDate: Date;
      
      if (part === 'beginning') {
        startDate = new Date(Date.UTC(year, monthNum - 1, 1));
        endDate = new Date(Date.UTC(year, monthNum - 1, 5, 23, 59, 59, 999));
      } else {
        const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
        startDate = new Date(Date.UTC(year, monthNum - 1, lastDay - 5));
        endDate = new Date(Date.UTC(year, monthNum - 1, lastDay, 23, 59, 59, 999));
      }
      
      Logger.debug('Interpreting month parts', {
        part,
        month,
        year,
        monthNum,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      return {
        type: 'range',
        start: startDate,
        end: endDate,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    }

    throw new Error(`Unknown pattern: ${intermediate.pattern}`);  // Default return
  }
}; 