import { RuleModule, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function getWeekendRange(referenceDate: DateTime, offset: number): { start: DateTime, end: DateTime } {
  // Find next Saturday
  const start = referenceDate.startOf('day');
  const currentDay = start.weekday % 7;
  
  // Calculate days until next Saturday
  let daysToSaturday = (6 - currentDay) % 7;
  if (daysToSaturday === 0 && offset > 0) {
    daysToSaturday = 7; // If today is Saturday and we want next weekend
  }
  daysToSaturday += offset * 7;
  
  const weekendStart = start.plus({ days: daysToSaturday });
  const weekendEnd = weekendStart.plus({ days: 1 }).endOf('day');
  
  Logger.debug('Interpreting weekend', {
    referenceDate: referenceDate.toISO(),
    offset,
    start: weekendStart.toISO(),
    end: weekendEnd.toISO()
  });
  
  return { start: weekendStart, end: weekendEnd };
}

function getHalfMonthRange(year: number, month: number, isSecondHalf: boolean): { start: DateTime, end: DateTime } {
  const start = DateTime.utc(year, month, isSecondHalf ? 16 : 1);
  const lastDay = DateTime.utc(year, month + 1, 1).minus({ days: 1 }).day;
  const end = DateTime.utc(year, month, isSecondHalf ? lastDay : 15).endOf('day');
  return { start, end };
}

function getMultipleWeekendRange(referenceDate: DateTime, offset: number, count: number): { start: DateTime, end: DateTime } {
  // Get first weekend
  const { start } = getWeekendRange(referenceDate, offset);
  
  // Get last weekend by adding (count-1) weeks to first weekend
  const end = start.plus({ weeks: count - 1, days: 1 }).endOf('day');
  
  return { start, end };
}

function getPeriodRange(part: string, period: string, referenceDate: DateTime): { start: DateTime; end: DateTime } {
  const year = referenceDate.year;
  const month = referenceDate.month;

  if (period === 'year') {
    if (part === 'beginning') {
      return {
        start: DateTime.utc(year, 1, 1),
        end: DateTime.utc(year, 3, 31).endOf('day')
      };
    } else if (part === 'middle') {
      return {
        start: DateTime.utc(year, 5, 1),
        end: DateTime.utc(year, 8, 31).endOf('day')
      };
    } else { // end
      return {
        start: DateTime.utc(year, 9, 1),
        end: DateTime.utc(year, 12, 31).endOf('day')
      };
    }
  } else if (period === 'month') {
    const daysInMonth = DateTime.utc(year, month + 1, 1).minus({ days: 1 }).day;
    if (part === 'beginning') {
      return {
        start: DateTime.utc(year, month, 1),
        end: DateTime.utc(year, month, 10).endOf('day')
      };
    } else if (part === 'middle') {
      return {
        start: DateTime.utc(year, month, 11),
        end: DateTime.utc(year, month, 20).endOf('day')
      };
    } else { // end
      return {
        start: DateTime.utc(year, month, 21),
        end: DateTime.utc(year, month, daysInMonth).endOf('day')
      };
    }
  } else { // week
    const startOfWeek = referenceDate.startOf('week');
    const endOfWeek = startOfWeek.endOf('week');

    if (part === 'beginning') {
      return {
        start: startOfWeek,
        end: startOfWeek.plus({ days: 2 }).endOf('day')
      };
    } else if (part === 'middle') {
      return {
        start: startOfWeek.plus({ days: 2 }),
        end: startOfWeek.plus({ days: 4 }).endOf('day')
      };
    } else { // end
      return {
        start: startOfWeek.plus({ days: 4 }),
        end: endOfWeek
      };
    }
  }
}

export const fuzzyRangesRule: RuleModule = {
  name: 'fuzzy-ranges',
  patterns: [
    {
      regex: /^(this|next|the following)\s+weekend$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const offset = matches[1].toLowerCase() === 'next' || 
                      matches[1].toLowerCase() === 'the following' ? 1 : 0;
        const { start, end } = getWeekendRange(preferences.referenceDate || DateTime.now(), offset);
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    },
    {
      regex: /^(first|second)\s+half\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [, half, month] = matches;
        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) return null;

        const year = preferences.referenceDate?.year || DateTime.now().year;
        const { start, end } = getHalfMonthRange(year, monthNum, half.toLowerCase() === 'second');
        
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    },
    {
      regex: /^(?:the\s+)?(beginning|middle|mid|end|start|early|late)(?:\s+(?:of|in)\s+(?:the\s+)?|\s+|\-)(?:year|month|week)(?:\s+end)?$|^(year|month|week)[-\s](beginning|middle|mid|end|start|early|late)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [fullMatch, part1, period1, period2, part2] = matches;
        let part = part1 || part2;
        let period = period1 || period2;

        if (!part || !period) return null;

        let normalizedPart = part.toLowerCase();
        if (normalizedPart === 'start' || normalizedPart === 'early') normalizedPart = 'beginning';
        if (normalizedPart === 'mid') normalizedPart = 'middle';
        if (normalizedPart === 'late') normalizedPart = 'end';

        const { start, end } = getPeriodRange(normalizedPart, period.toLowerCase(), preferences.referenceDate || DateTime.now());
        
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: fullMatch
        };
      }
    },
    {
      regex: /^(?:the\s+)?(beginning|middle|mid|end|start|early|late)(?:\s+(?:of|in)\s+(?:the\s+)?|\s+|\-)(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [fullMatch, part, month] = matches;
        if (!part || !month) return null;

        let normalizedPart = part.toLowerCase();
        if (normalizedPart === 'start' || normalizedPart === 'early') normalizedPart = 'beginning';
        if (normalizedPart === 'mid') normalizedPart = 'middle';
        if (normalizedPart === 'late') normalizedPart = 'end';

        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) return null;

        const year = preferences.referenceDate?.year || DateTime.now().year;
        const monthStart = DateTime.utc(year, monthNum, 1);
        
        let start: DateTime, end: DateTime;
        if (normalizedPart === 'beginning') {
          start = monthStart;
          end = monthStart.plus({ days: 9 }).endOf('day');
        } else if (normalizedPart === 'middle') {
          start = monthStart.plus({ days: 10 });
          end = monthStart.plus({ days: 19 }).endOf('day');
        } else { // end
          start = monthStart.plus({ days: 20 }); // This will be the 21st (1 + 20)
          end = monthStart.endOf('month');
        }
        
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: fullMatch
        };
      }
    },
    {
      regex: /^(first|last)\s+(\d+)\s+days\s+(?:of\s+)?(next\s+month|(?:january|february|march|april|may|june|july|august|september|october|november|december))$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [, position, count, month] = matches;
        if (!position || !count || !month) return null;

        const numDays = parseInt(count, 10);
        if (isNaN(numDays)) return null;

        const referenceDate = preferences.referenceDate || DateTime.now();
        let targetMonth: number;
        let targetYear = referenceDate.year;

        if (month === 'next month') {
          targetMonth = referenceDate.month + 1;
          if (targetMonth > 12) {
            targetMonth = 1;
            targetYear++;
          }
        } else {
          targetMonth = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
          if (!targetMonth) return null;
        }

        const monthStart = DateTime.utc(targetYear, targetMonth, 1);
        const monthEnd = monthStart.endOf('month');

        let start: DateTime, end: DateTime;
        if (position === 'first') {
          start = monthStart;
          end = monthStart.plus({ days: numDays - 1 }).endOf('day');
        } else {
          start = monthEnd.minus({ days: numDays - 1 }).startOf('day');
          end = monthEnd;
        }

        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    },
    {
      regex: /^(?:next|following)\s+(\d+)\s+weekends$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const count = parseInt(matches[1], 10);
        if (isNaN(count)) return null;

        const { start, end } = getMultipleWeekendRange(preferences.referenceDate || DateTime.now(), 1, count);
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    },
    {
      regex: /^(?:the\s+)?(beginning|middle|mid|end|start|early|late)(?:\s+(?:of|in)\s+(?:the\s+)?|\s+|\-)(next\s+month)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [fullMatch, part] = matches;
        if (!part) return null;

        let normalizedPart = part.toLowerCase();
        if (normalizedPart === 'start' || normalizedPart === 'early') normalizedPart = 'beginning';
        if (normalizedPart === 'mid') normalizedPart = 'middle';
        if (normalizedPart === 'late') normalizedPart = 'end';

        const referenceDate = preferences.referenceDate || DateTime.now();
        let targetMonth = referenceDate.month + 1;
        let targetYear = referenceDate.year;
        
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear++;
        }

        const monthStart = preferences.timeZone
          ? DateTime.fromObject(
              { year: targetYear, month: targetMonth, day: 1 },
              { zone: preferences.timeZone }
            )
          : DateTime.utc(targetYear, targetMonth, 1);
        
        let start: DateTime, end: DateTime;
        if (normalizedPart === 'beginning') {
          start = monthStart;
          end = monthStart.plus({ days: 9 }).endOf('day');
        } else if (normalizedPart === 'middle') {
          start = monthStart.plus({ days: 10 });
          end = monthStart.plus({ days: 19 }).endOf('day');
        } else { // end
          start = monthStart.plus({ days: 20 }); // This will be the 21st (1 + 20)
          end = monthStart.endOf('month');
        }

        Logger.debug('Parsing next month fuzzy range', {
          part: normalizedPart,
          targetMonth,
          targetYear,
          start: start.toISO(),
          end: end.toISO()
        });
        
        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: fullMatch
        };
      }
    }
  ]
}; 