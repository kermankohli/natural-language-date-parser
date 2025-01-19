import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function getWeekendRange(referenceDate: Date, offset: number): { start: Date, end: Date } {
  // Find next Saturday
  const start = new Date(referenceDate);
  const currentDay = start.getUTCDay();
  
  // Calculate days until next Saturday
  let daysToSaturday = (6 - currentDay) % 7;
  if (daysToSaturday === 0 && offset > 0) {
    daysToSaturday = 7; // If today is Saturday and we want next weekend
  }
  daysToSaturday += offset * 7;
  
  start.setUTCDate(start.getUTCDate() + daysToSaturday);
  start.setUTCHours(0, 0, 0, 0);
  
  // End is Sunday
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(23, 59, 59, 999);
  
  Logger.debug('Interpreting weekend', {
    referenceDate: referenceDate.toISOString(),
    offset,
    start: start.toISOString(),
    end: end.toISOString()
  });
  
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

function getPeriodRange(referenceDate: Date, part: string, period: string): { start: Date, end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);
  
  // Reset time components
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  
  if (period === 'year') {
    const year = start.getUTCFullYear();
    if (part === 'beginning') {
      start.setUTCMonth(0, 1);
      end.setUTCMonth(3, 30);
    } else if (part === 'middle') {
      start.setUTCMonth(4, 1);
      end.setUTCMonth(7, 31);
    } else { // end
      start.setUTCMonth(8, 1);
      end.setUTCMonth(11, 31);
    }
  } else if (period === 'month') {
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const third = Math.floor(lastDay / 3);
    
    if (part === 'beginning') {
      start.setUTCDate(1);
      end.setUTCDate(third);
    } else if (part === 'middle') {
      start.setUTCDate(third + 1);
      end.setUTCDate(third * 2);
    } else { // end
      start.setUTCDate(third * 2 + 1);
      end.setUTCDate(lastDay);
    }
  } else if (period === 'week') {
    const dayOfWeek = start.getUTCDay();
    if (part === 'beginning') {
      start.setUTCDate(start.getUTCDate() - dayOfWeek);
      end.setUTCDate(end.getUTCDate() - dayOfWeek + 2);
    } else if (part === 'middle') {
      start.setUTCDate(start.getUTCDate() - dayOfWeek + 3);
      end.setUTCDate(end.getUTCDate() - dayOfWeek + 4);
    } else { // end
      start.setUTCDate(start.getUTCDate() - dayOfWeek + 5);
      end.setUTCDate(end.getUTCDate() - dayOfWeek + 6);
    }
  }
  
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
          offset: matches[1].toLowerCase() === 'next' || 
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
      // "beginning of year", "middle of month", "end of week"
      name: 'period-part',
      regex: /^(beginning|middle|end)\s+of\s+(year|month|week)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'period-part',
        captures: {
          part: matches[1].toLowerCase(),
          period: matches[2].toLowerCase()
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
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult => {
    const referenceDate = prefs.referenceDate || new Date();
    
    if (intermediate.pattern === 'weekend') {
      const offset = parseInt(intermediate.captures.offset);
      const { start, end } = getWeekendRange(referenceDate, offset);
      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'half-month') {
      const { half, month } = intermediate.captures;
      const monthNum = MONTHS[month as keyof typeof MONTHS];
      const year = referenceDate.getUTCFullYear();
      
      // Get last day of month
      const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
      const midPoint = Math.floor(lastDay / 2);
      
      const start = new Date(Date.UTC(year, monthNum - 1, half === 'first' ? 1 : midPoint + 1));
      const end = new Date(Date.UTC(year, monthNum - 1, half === 'first' ? midPoint : lastDay));
      end.setUTCHours(23, 59, 59, 999);
      
      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'period-part') {
      const { part, period } = intermediate.captures;
      const { start, end } = getPeriodRange(referenceDate, part, period);
      
      return {
        type: 'range',
        start,
        end,
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
    } else if (intermediate.pattern === 'multiple-weekends') {
      const offset = parseInt(intermediate.captures.offset);
      const count = parseInt(intermediate.captures.count);
      return {
        type: 'range',
        ...getMultipleWeekendRange(referenceDate, offset, count),
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    }
    
    throw new Error('Unknown pattern');
  }
}; 