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

function createDateComponent(
  date: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  return {
    type: 'date',
    value: date,
    span,
    confidence: 1.0,
    metadata: {
      isOrdinal: true,
      originalText
    }
  };
}

export const ordinalDaysRule: RuleModule = {
  name: 'ordinal-days',
  patterns: [
    {
      // Pattern for "1st of March", "first of March", etc.
      regex: /^(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|first|second|third|fourth|fifth|last|second\s+to\s+last|third\s+to\s+last)\s+(?:day\s+)?(?:of\s+)?(?:the\s+)?(?:month\s+(?:of\s+)?)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing ordinal day', { matches });
        const [fullMatch, ordinalOrNumber, month] = matches;
        
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

        const referenceYear = preferences.referenceDate?.year || new Date().getUTCFullYear();
        
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

        return createDateComponent(result, { start: 0, end: fullMatch.length }, fullMatch, preferences);
      }
    },
    {
      // Pattern for "March 1st", "March first", etc.
      regex: /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)?|first|second|third|fourth|fifth|last|second\s+to\s+last|third\s+to\s+last)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing month first ordinal day', { matches });
        const [fullMatch, month, dayNumber] = matches;
        
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

        const referenceYear = preferences.referenceDate?.year || new Date().getUTCFullYear();
        
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

        return createDateComponent(result, { start: 0, end: fullMatch.length }, fullMatch, preferences);
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

    return createDateComponent(result, { start: 0, end: intermediate.text?.length || 0 }, intermediate.text || '', prefs);
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

  return createDateComponent(start, { start: 0, end: fullMatch.length }, fullMatch, preferences);
} 