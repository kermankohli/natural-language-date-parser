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

function getPeriodRange(part: string, period: string, referenceDate: Date): { start: Date; end: Date } {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  if (period === 'year') {
    if (part === 'beginning') {
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year, 2, 31))
      };
    } else if (part === 'middle') {
      return {
        start: new Date(Date.UTC(year, 4, 1)),
        end: new Date(Date.UTC(year, 7, 31))
      };
    } else { // end
      return {
        start: new Date(Date.UTC(year, 8, 1)),
        end: new Date(Date.UTC(year, 11, 31))
      };
    }
  } else if (period === 'month') {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    if (part === 'beginning') {
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month, 10))
      };
    } else if (part === 'middle') {
      return {
        start: new Date(Date.UTC(year, month, 11)),
        end: new Date(Date.UTC(year, month, 20))
      };
    } else { // end
      return {
        start: new Date(Date.UTC(year, month, 21)),
        end: new Date(Date.UTC(year, month, daysInMonth))
      };
    }
  } else { // week
    const dayOfWeek = referenceDate.getUTCDay();
    const startOfWeek = new Date(Date.UTC(year, month, referenceDate.getUTCDate() - dayOfWeek));
    const endOfWeek = new Date(Date.UTC(year, month, referenceDate.getUTCDate() + (6 - dayOfWeek)));

    if (part === 'beginning') {
      return {
        start: startOfWeek,
        end: new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 2))
      };
    } else if (part === 'middle') {
      return {
        start: new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 2)),
        end: new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 4))
      };
    } else { // end
      return {
        start: new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 4)),
        end: endOfWeek
      };
    }
  }
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
      regex: /^(?:the\s+)?(beginning|middle|mid|end|start|early|late)(?:\s+(?:of|in)\s+(?:the\s+)?|\s+|\-)(year|month|week)(?:\s+end)?$|^(year|month|week)[-\s](beginning|middle|mid|end|start|early|late)$/i,
      parse: (matches: RegExpMatchArray, preferences: DateParsePreferences): IntermediateParse | null => {
        const [fullMatch, part1, period1, period2, part2] = matches;
        let part = part1 || part2;
        let period = period1 || period2;

        // Handle null matches
        if (!part || !period) return null;

        // Normalize parts
        let normalizedPart = part.toLowerCase();
        if (normalizedPart === 'start' || normalizedPart === 'early') normalizedPart = 'beginning';
        if (normalizedPart === 'mid') normalizedPart = 'middle';
        if (normalizedPart === 'late') normalizedPart = 'end';

        const { start, end } = getPeriodRange(normalizedPart, period.toLowerCase(), preferences.referenceDate || new Date());
        
        return {
          type: 'range',
          start,
          end,
          text: fullMatch,
          confidence: 1.0,
          pattern: 'period-part',
          captures: {
            part: normalizedPart,
            period: period.toLowerCase()
          }
        };
      }
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
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    if (intermediate.pattern?.includes('offset')) {
      const offset = parseInt(intermediate.captures?.offset || '0');
      if (isNaN(offset)) return null;
      const { start, end } = getWeekendRange(prefs.referenceDate || new Date(), offset);
      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    } else if (intermediate.pattern === 'half-month') {
      const { half, month } = intermediate.captures || {};
      if (!half || !month) return null;
      const monthNum = MONTHS[month as keyof typeof MONTHS];
      const year = prefs.referenceDate?.getUTCFullYear() || new Date().getUTCFullYear();
      
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
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    } else if (intermediate.pattern === 'period-part') {
      const { part, period } = intermediate.captures || {};
      if (!part || !period) return null;

      // Only accept valid periods
      if (!['year', 'month', 'week'].includes(period)) return null;

      const { start, end } = getPeriodRange(part, period, prefs.referenceDate || new Date());
      
      return {
        type: 'range',
        start,
        end,
        confidence: 1.0,
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    } else if (intermediate.pattern === 'days-of-month') {
      const { position, count, month } = intermediate.captures || {};
      if (!position || !count || !month) return null;
      let year = prefs.referenceDate?.getUTCFullYear() || new Date().getUTCFullYear();
      let monthNum = month === 'next month' 
        ? (prefs.referenceDate?.getUTCMonth() ?? new Date().getUTCMonth()) + 2 
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
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    } else if (intermediate.pattern === 'month-parts') {
      const { part, month } = intermediate.captures || {};
      if (!part || !month) return null;
      const year = prefs.referenceDate?.getUTCFullYear() || new Date().getUTCFullYear();
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
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    } else if (intermediate.pattern === 'multiple-weekends') {
      const offset = parseInt(intermediate.captures?.offset || '0');
      const count = parseInt(intermediate.captures?.count || '0');
      if (isNaN(offset) || isNaN(count)) return null;
      return {
        type: 'range',
        ...getMultipleWeekendRange(prefs.referenceDate || new Date(), offset, count),
        confidence: 1.0,
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    }
    
    throw new Error('Unknown pattern');
  }
}; 