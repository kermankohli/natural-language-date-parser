import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

type WeekStartDay = DateParsePreferences['weekStartsOn'];

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
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const currentDay = firstDay.getUTCDay();
  
  Logger.debug('Initial state', {
    date: firstDay.toISOString(),
    currentDay,
    weekStartDay,
    dayNames: {
      currentDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDay],
      weekStart: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekStartDay],
    }
  });

  // Calculate days to adjust
  const daysToAdjust = weekStartDay === 0
    ? (currentDay === 0 ? 0 : ((7 - currentDay) % 7))
    : ((weekStartDay - currentDay + 7) % 7);

  Logger.debug('Days calculation', {
    formula: weekStartDay === 0 
      ? `(7 - ${currentDay}) % 7`
      : `(${weekStartDay} - ${currentDay} + 7) % 7`,
    steps: {
      beforeModulo: weekStartDay === 0 ? (7 - currentDay) : (weekStartDay - currentDay + 7),
      afterModulo: daysToAdjust
    },
    targetDate: new Date(firstDay.getTime() + daysToAdjust * 24 * 60 * 60 * 1000).toISOString()
  });

  // Get to first week start
  const firstWeekStart = new Date(firstDay);
  const currentDate = firstWeekStart.getUTCDate();
  firstWeekStart.setUTCDate(currentDate + daysToAdjust);
  
  Logger.debug('Date adjustment details', {
    currentDate,
    daysToAdjust,
    newDate: currentDate + daysToAdjust,
    resultingDate: firstWeekStart.toISOString()
  });

  // Add weeks to get to nth week
  const result = new Date(firstWeekStart);
  const weeksToAdd = (n - 1) * 7;
  result.setUTCDate(result.getUTCDate() + weeksToAdd);
  
  Logger.debug('Week calculation steps', {
    firstWeekStart: firstWeekStart.toISOString(),
    weeksToAdd,
    finalDate: result.toISOString(),
    inMonth: result.getUTCMonth() === month - 1
  });

  return result.getUTCMonth() === month - 1 ? result : null;
}

function findNthWeekFromEnd(year: number, month: number, n: number, weekStartDay: NonNullable<WeekStartDay>): Date | null {
  const lastDay = new Date(Date.UTC(year, month, 0));
  const currentDay = lastDay.getUTCDay();
  
  // For Sunday start:
  // - Always go back one week if we're on the last day
  // - Then find previous week start
  const daysToSubtract = weekStartDay === 0
    ? (currentDay === 0 ? 7 : currentDay)  // Go back a week if Sunday
    : ((currentDay - weekStartDay + 7) % 7);

  Logger.debug('Finding last week start (detailed)', {
    inputs: {
      year,
      month,
      n,
      weekStartDay
    },
    lastDayCalc: {
      lastDay: lastDay.toISOString(),
      currentDay,
      formula: weekStartDay === 0 
        ? `currentDay === 0 ? ${7} : ${currentDay}`
        : `((${currentDay} - ${weekStartDay} + 7) % 7)`,
      daysToSubtract
    }
  });

  // Get to last week start
  const lastWeekStart = new Date(lastDay);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - daysToSubtract);
  
  // Subtract weeks to get to nth from last week
  const result = new Date(lastWeekStart);
  const weeksToSubtract = (Math.abs(n) - 1) * 7;
  result.setUTCDate(result.getUTCDate() - weeksToSubtract);
  
  Logger.debug('Week calculation steps (from end)', {
    lastWeekStart: lastWeekStart.toISOString(),
    weeksToSubtract,
    finalDate: result.toISOString(),
    inMonth: result.getUTCMonth() === month - 1
  });

  return result.getUTCMonth() === month - 1 ? result : null;
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
    const { ordinal, month } = intermediate.captures || {};
    if (!ordinal || !month) return null;
    
    const weekStartsOn = prefs.weekStartsOn ?? 1;
    
    Logger.debug('Preference details', {
      rawPrefs: prefs,
      weekStartsOn,
      weekStartDay: prefs.weekStartsOn,  // Check both properties
      defaulted: !prefs.weekStartsOn
    });

    const year = prefs.referenceDate?.getUTCFullYear() || new Date().getUTCFullYear();
    const monthNum = MONTHS[month as keyof typeof MONTHS];
    
    Logger.debug('Interpreting ordinal week', {
      ordinal,
      month,
      year,
      monthNum,
      weekStartsOn
    });

    const ordinalNum = getOrdinalNumber(ordinal);
    let start: Date | null;

    if (ordinalNum > 0) {
      // Forward ordinal (first, second, etc.)
      start = findNthWeekStart(year, monthNum, ordinalNum, weekStartsOn);
    } else {
      // Backward ordinal (last, second to last, etc.)
      start = findNthWeekFromEnd(year, monthNum, ordinalNum, weekStartsOn);
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
      text: intermediate.tokens?.[0] || intermediate.text || ''
    };
  }
}; 