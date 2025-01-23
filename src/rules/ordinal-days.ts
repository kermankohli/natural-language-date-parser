import { RuleModule, IntermediateParse, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { getOrdinalNumber } from '../utils/ordinal-utils';
import { DateTime } from 'luxon';
import { ParseComponent } from '../resolver/resolution-engine';

const ORDINALS: { [key: string]: number } = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  last: -1, penultimate: -2, ultimate: -1, 
  'second to last': -2, 'third to last': -3
};

const MONTHS_ARRAY = [
  'january', 'jan',
  'february', 'feb',
  'march', 'mar',
  'april', 'apr',
  'may',
  'june', 'jun',
  'july', 'jul',
  'august', 'aug',
  'september', 'sep',
  'october', 'oct',
  'november', 'nov',
  'december', 'dec'
];

const createOrdinalDayComponent = (
  date: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences,
  rangeEnd?: DateTime
): ParseComponent => {
  // Only use reference year if the date's year is the current year
  const currentYear = DateTime.now().year;
  const dateYear = date.year;
  const referenceYear = preferences.referenceDate?.year || currentYear;
  
  // If the date already has a specific year (not current year), keep it
  const finalYear = dateYear !== currentYear ? dateYear : referenceYear;
  const dateWithCorrectYear = date.set({ year: finalYear });

  const isRange = rangeEnd !== undefined;

  return {
    type: isRange ? 'range' : 'date',
    span,
    value: isRange ? { start: dateWithCorrectYear, end: rangeEnd } : dateWithCorrectYear,
    confidence: 1,
    metadata: {
      originalText,
      dateType: 'ordinal',
      rangeType: isRange ? 'ordinalWeek' : undefined
    }
  };
};

// Default range for "after" expressions (1 month)
const DEFAULT_AFTER_RANGE_MONTHS = 1;

const findNextOccurrence = (day: number, month: number | null, referenceDate: DateTime, after: boolean): { start: DateTime, end: DateTime } => {
  // First, create the target date in the current year
  let targetDate = referenceDate.set({ day });
  if (month !== null) {
    targetDate = targetDate.set({ month });
    
    // If the date is in the past and a specific month was given, move to next year
    if (targetDate < referenceDate) {
      targetDate = targetDate.plus({ years: 1 });
    }
  } else {
    // For month-less dates, if target is in past, move to next month
    if (targetDate < referenceDate) {
      targetDate = targetDate.plus({ months: 1 });
    }
  }

  // Now create the range based on whether it's a before/after expression
  if (after) {
    // For "after" expressions, range is [target_date -> target_date + 1 month]
    return {
      start: targetDate,
      end: targetDate.plus({ months: DEFAULT_AFTER_RANGE_MONTHS })
    };
  } else {
    // For "before" expressions, range is [reference_date -> target_date]
    return {
      start: referenceDate,
      end: targetDate
    };
  }
};

export const ordinalDaysRule: RuleModule = {
  name: 'ordinal-days',
  patterns: [
    {
      // Pattern for "1st of March", "first of March", etc.
      regex: /^(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|first|second|third|fourth|fifth|last|second\s+to\s+last|third\s+to\s+last)\s+(?:day\s+)?(?:of\s+)?(?:the\s+)?(?:month\s+(?:of\s+)?)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing ordinal day', { matches });
        const [fullMatch, ordinalOrNumber, month, year] = matches;
        
        let dayNum: number;
        if (ordinalOrNumber) {
          dayNum = parseInt(ordinalOrNumber, 10);
          if (isNaN(dayNum)) return null;
        } else {
          const ordinal = matches[0].split(' ')[0].toLowerCase();
          dayNum = ORDINALS[ordinal];
          if (!dayNum) return null;
        }

        const monthNum = Math.floor(MONTHS_ARRAY.indexOf(month.toLowerCase()) / 2) + 1;
        if (monthNum < 1 || monthNum > 12) return null;

        const referenceYear = year ? parseInt(year, 10) : preferences.referenceDate?.year || DateTime.now().year;
        
        // Create the date in the specified timezone
        const result = preferences.timeZone
          ? DateTime.fromObject(
              { year: referenceYear, month: monthNum, day: Math.abs(dayNum) },
              { zone: preferences.timeZone }
            )
          : DateTime.utc(referenceYear, monthNum, Math.abs(dayNum));
        
        if (!result.isValid) {
          Logger.debug('Invalid date created', { year: referenceYear, month: monthNum, day: dayNum });
          return null;
        }

        return createOrdinalDayComponent(result, { start: 0, end: fullMatch.length }, fullMatch, preferences);
      }
    },
    {
      // Pattern for "March 1st", "March first", etc.
      regex: /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)?|first|second|third|fourth|fifth|last|second\s+to\s+last|third\s+to\s+last)(?:\s+(\d{4}))?$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing month first ordinal day', { matches });
        const [fullMatch, month, dayNumber, year] = matches;
        
        let dayNum: number;
        if (dayNumber) {
          dayNum = parseInt(dayNumber, 10);
          if (isNaN(dayNum)) return null;
        } else {
          const ordinal = matches[0].split(' ').slice(-1)[0].toLowerCase();
          dayNum = ORDINALS[ordinal];
          if (!dayNum) return null;
        }

        const monthNum = Math.floor(MONTHS_ARRAY.indexOf(month.toLowerCase()) / 2) + 1;
        if (monthNum < 1 || monthNum > 12) return null;

        const referenceYear = year ? parseInt(year, 10) : preferences.referenceDate?.year || DateTime.now().year;
        
        // Create the date in the specified timezone
        const result = preferences.timeZone
          ? DateTime.fromObject(
              { year: referenceYear, month: monthNum, day: Math.abs(dayNum) },
              { zone: preferences.timeZone }
            )
          : DateTime.utc(referenceYear, monthNum, Math.abs(dayNum));
        
        if (!result.isValid) {
          Logger.debug('Invalid date created', { year: referenceYear, month: monthNum, day: dayNum });
          return null;
        }

        return createOrdinalDayComponent(result, { start: 0, end: fullMatch.length }, fullMatch, preferences);
      }
    },
    {
      // Pattern for relative ordinal expressions with more variations (before/until)
      regex: /^(?:(?:anytime\s+)?(?:from\s+(?:now|today)\s+)?(?:until|before|till|up\s+to))\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|first|second|third|fourth|fifth)(?:\s+(?:of\s+)?(?:the\s+)?(?:month\s+(?:of\s+)?)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing relative ordinal day (before)', { matches });
        const [fullMatch, ordinalOrNumber, month] = matches;
        
        let dayNum: number;
        if (ordinalOrNumber) {
          dayNum = parseInt(ordinalOrNumber, 10);
          if (isNaN(dayNum)) return null;
        } else {
          const ordinal = matches[0].split(' ')[1].toLowerCase();
          dayNum = ORDINALS[ordinal];
          if (!dayNum) return null;
        }

        let monthNum: number | null = null;
        if (month) {
          monthNum = Math.floor(MONTHS_ARRAY.indexOf(month.toLowerCase()) / 2) + 1;
          if (monthNum < 1 || monthNum > 12) return null;
        }

        const referenceDate = preferences.referenceDate || DateTime.now();
        const { start, end } = findNextOccurrence(dayNum, monthNum, referenceDate, false);
        
        if (!start.isValid || !end.isValid) {
          Logger.debug('Invalid date created', { dayNum, monthNum });
          return null;
        }

        return createOrdinalDayComponent(start, { start: 0, end: fullMatch.length }, fullMatch, preferences, end);
      }
    },
    {
      // Pattern for "after/starting from" expressions
      regex: /^(?:(?:anytime\s+)?(?:after|starting\s+from|from|beginning\s+from|starting|beginning)\s+(?:on|at|from)?)\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|first|second|third|fourth|fifth)(?:\s+(?:of\s+)?(?:the\s+)?(?:month\s+(?:of\s+)?)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing relative ordinal day (after)', { matches });
        const [fullMatch, ordinalOrNumber, month] = matches;
        
        let dayNum: number;
        if (ordinalOrNumber) {
          dayNum = parseInt(ordinalOrNumber, 10);
          if (isNaN(dayNum)) return null;
        } else {
          const ordinal = matches[0].split(' ')[1].toLowerCase();
          dayNum = ORDINALS[ordinal];
          if (!dayNum) return null;
        }

        let monthNum: number | null = null;
        if (month) {
          monthNum = Math.floor(MONTHS_ARRAY.indexOf(month.toLowerCase()) / 2) + 1;
          if (monthNum < 1 || monthNum > 12) return null;
        }

        const referenceDate = preferences.referenceDate || DateTime.now();
        const { start, end } = findNextOccurrence(dayNum, monthNum, referenceDate, true);
        
        if (!start.isValid || !end.isValid) {
          Logger.debug('Invalid date created', { dayNum, monthNum });
          return null;
        }

        return createOrdinalDayComponent(start, { start: 0, end: fullMatch.length }, fullMatch, preferences, end);
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseComponent | null => {
    if (!intermediate.captures) return null;

    const { day, month } = intermediate.captures;
    if (!day || !month) return null;

    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) return null;

    // Map abbreviated month names to full names using MONTHS object
    const monthNum = MONTHS_ARRAY.indexOf(month.toLowerCase()) + 1;
    if (!monthNum) return null;

    // Use the reference date's year for validation
    const referenceYear = prefs.referenceDate?.toUTC().year || new Date().getUTCFullYear();
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
    const result = DateTime.utc(targetYear, monthNum - 1, dayNum);

    return createOrdinalDayComponent(result, { start: 0, end: intermediate.text?.length || 0 }, intermediate.text || '', prefs);
  }
} as RuleModule;

export function parseOrdinalDay(matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null {
  const [fullMatch, ordinal, month] = matches;
  const ordinalNum = parseInt(ordinal);
  const monthNum = Math.floor(MONTHS_ARRAY.indexOf(month.toLowerCase()) / 2) + 1;

  if (ordinalNum < 1 || ordinalNum > 31 || monthNum < 1) {
    return null;
  }

  const year = preferences.referenceDate?.year || DateTime.now().year;
  const start = DateTime.utc(year, monthNum, ordinalNum);

  if (!start.isValid) {
    return null;
  }

  return createOrdinalDayComponent(start, { start: 0, end: fullMatch.length }, fullMatch, preferences);
} 