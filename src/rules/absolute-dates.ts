import { RuleModule, IntermediateParse, ParseResult } from '../types/types';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';
import { Logger } from '../utils/Logger';

// Common absolute date patterns with optional time components
const DATE_PATTERNS = {
  ISO_DATE: /^(\d{4})-(\d{2})-(\d{2})$/,
  ISO_DATETIME: /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}(?::?\d{2})?)?$/,
  ISO_BASIC: /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(?:(\d{2}))?(Z|[+-]\d{2}\d{2})?)?$/,
  SLASH_YMD: /^(\d{4})\/(\d{2})\/(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  SLASH_MDY: /^(\d{2})\/(\d{2})\/(\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  SLASH_DMY: /^(\d{2})\/(\d{2})\/(\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  DOT_YMD: /^(\d{4})\.(\d{2})\.(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  DOT_DMY: /^(\d{2})\.(\d{2})\.(\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  DASH_YMD: /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  DASH_MDY: /^(\d{2})-(\d{2})-(\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/,
  DASH_DMY: /^(\d{2})-(\d{2})-(\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/
};

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

const ABSOLUTE_PATTERNS = {
  ISO: /^(\d{4})-(\d{2})-(\d{2})$/,
  MONTH_FIRST: /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/i,
  DAY_FIRST: /^(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*,?\s*(\d{4})?$/i
};

function isValidDate(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): boolean {
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  return date.getUTCFullYear() === year &&
         date.getUTCMonth() === month - 1 &&
         date.getUTCDate() === day &&
         date.getUTCHours() === hours &&
         date.getUTCMinutes() === minutes &&
         date.getUTCSeconds() === seconds;
}

function createDateParser(format: 'YMD' | 'MDY' | 'DMY') {
  return (matches: RegExpMatchArray): IntermediateParse | null => {
    Logger.debug('Parsing date', {
      format,
      matches: matches.map(m => m),
    });
    
    let year: number, month: number, day: number;
    
    // Parse date components based on format
    switch (format) {
      case 'YMD':
        [, year, month, day] = matches.map(Number);
        break;
      case 'MDY':
        [, month, day, year] = matches.map(Number);
        break;
      case 'DMY':
        [, day, month, year] = matches.map(Number);
        break;
    }

    // Parse time if present
    let timeComponents = { hours: 0, minutes: 0, seconds: 0, offsetMinutes: 0 };
    if (matches[4] && matches[5]) {
      const timeStr = [
        matches[4],
        matches[5],
        matches[6] || '00'
      ].join(':');
      
      // Add timezone if present
      const timeWithTz = matches[7] ? `${timeStr}${matches[7]}` : timeStr;
      
      Logger.debug('Parsing time component', { timeWithTz });
      const parsed = parseTimeString(timeWithTz);
      Logger.debug('Time parse result', { parsed });
      if (parsed) timeComponents = parsed;
    }

    if (!isValidDate(year, month, day, timeComponents.hours, timeComponents.minutes, timeComponents.seconds)) {
      Logger.debug('Invalid date components', { year, month, day, ...timeComponents });
      return null;
    }

    return {
      type: 'absolute',
      tokens: [matches[0]],
      pattern: `absolute-${format.toLowerCase()}`,
      captures: {
        year: year.toString(),
        month: month.toString().padStart(2, '0'),
        day: day.toString().padStart(2, '0'),
        ...timeComponentsToString(timeComponents)
      }
    };
  };
}

function parseMonthName(monthStr: string): number {
  const month = MONTHS[monthStr.toLowerCase() as keyof typeof MONTHS];
  return month || 0;
}

function createMonthNameParser(format: 'MonthFirst' | 'DayFirst') {
  return (matches: RegExpMatchArray): IntermediateParse | null => {
    Logger.debug('Parsing month name date', {
      format,
      matches: matches.map(m => m),
    });
    
    let year: number, month: number, day: number;
    const currentYear = new Date().getFullYear();
    
    if (format === 'MonthFirst') {
      month = parseMonthName(matches[1]);
      day = parseInt(matches[2]);
      year = matches[3] ? parseInt(matches[3]) : currentYear;
    } else {
      day = parseInt(matches[1]);
      month = parseMonthName(matches[2]);
      year = matches[3] ? parseInt(matches[3]) : currentYear;
    }

    if (!isValidDate(year, month, day)) {
      Logger.debug('Invalid date components', { year, month, day });
      return null;
    }

    return {
      type: 'absolute',
      tokens: [matches[0]],
      pattern: `absolute-${format.toLowerCase()}`,
      captures: {
        year: year.toString(),
        month: month.toString().padStart(2, '0'),
        day: day.toString().padStart(2, '0'),
        hours: '0',
        minutes: '0',
        seconds: '0',
        offsetMinutes: '0'
      }
    };
  };
}

export const absoluteDatesRule: RuleModule = {
  name: 'absolute-dates',
  patterns: [
    {
      name: 'iso-datetime',
      regex: DATE_PATTERNS.ISO_DATETIME,
      parse: createDateParser('YMD')
    },
    {
      name: 'iso-date',
      regex: DATE_PATTERNS.ISO_DATE,
      parse: createDateParser('YMD')
    },
    {
      name: 'iso-basic',
      regex: DATE_PATTERNS.ISO_BASIC,
      parse: createDateParser('YMD')
    },
    {
      name: 'slash-ymd',
      regex: DATE_PATTERNS.SLASH_YMD,
      parse: createDateParser('YMD')
    },
    {
      name: 'slash-mdy',
      regex: DATE_PATTERNS.SLASH_MDY,
      parse: createDateParser('MDY')
    },
    {
      name: 'slash-dmy',
      regex: DATE_PATTERNS.SLASH_DMY,
      parse: createDateParser('DMY')
    },
    {
      name: 'dot-ymd',
      regex: DATE_PATTERNS.DOT_YMD,
      parse: createDateParser('YMD')
    },
    {
      name: 'dot-dmy',
      regex: DATE_PATTERNS.DOT_DMY,
      parse: createDateParser('DMY')
    },
    {
      name: 'dash-ymd',
      regex: DATE_PATTERNS.DASH_YMD,
      parse: createDateParser('YMD')
    },
    {
      name: 'dash-mdy',
      regex: DATE_PATTERNS.DASH_MDY,
      parse: createDateParser('MDY')
    },
    {
      name: 'dash-dmy',
      regex: DATE_PATTERNS.DASH_DMY,
      parse: createDateParser('DMY')
    },
    {
      name: 'month-first',
      regex: ABSOLUTE_PATTERNS.MONTH_FIRST,
      parse: createMonthNameParser('MonthFirst')
    },
    {
      name: 'day-first',
      regex: ABSOLUTE_PATTERNS.DAY_FIRST,
      parse: createMonthNameParser('DayFirst')
    }
  ],
  interpret: (intermediate: IntermediateParse): ParseResult => {
    const { year, month, day, hours, minutes, seconds, offsetMinutes } = intermediate.captures;
    
    Logger.debug('Interpreting date components', {
      year, month, day, hours, minutes, seconds, offsetMinutes
    });

    // Create date in UTC
    const date = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours || '0'),
      parseInt(minutes || '0'),
      parseInt(seconds || '0')
    ));

    Logger.debug('Created UTC date', { 
      initial: date.toISOString() 
    });

    // Apply timezone offset if present
    const offset = parseInt(offsetMinutes || '0');
    if (offset !== 0) {
      date.setMinutes(date.getMinutes() - offset);
      Logger.debug('Applied timezone offset', { 
        offset,
        final: date.toISOString()
      });
    }

    return {
      type: 'single',
      start: date,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 