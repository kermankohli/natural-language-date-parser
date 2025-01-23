import { RuleModule, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';
import { ParseComponent } from '../resolver/resolution-engine';

const MONTHS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
};

const PART_RANGES = {
  early: { start: 1, end: 10 },
  beginning: { start: 1, end: 10 },
  mid: { start: 11, end: 20 },
  middle: { start: 11, end: 20 },
  late: { start: 21, end: 31 },
  end: { start: 21, end: 31 }
};

function createPartialMonthComponent(
  start: DateTime,
  end: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  return {
    type: 'range',
    span,
    value: { start, end },
    confidence: 1,
    metadata: {
      originalText,
      rangeType: 'partialMonth'
    }
  };
}

export const partialMonthRule: RuleModule = {
  name: 'partial-month',
  patterns: [
    {
      regex: /^(early|beginning|mid|middle|late|end)\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        Logger.debug('Parsing partial month', { matches, preferences });

        const [fullMatch, part, month] = matches;
        if (!part || !month) {
          Logger.debug('Missing part or month', { part, month });
          return null;
        }

        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) {
          Logger.debug('Invalid month', { month });
          return null;
        }

        const range = PART_RANGES[part.toLowerCase() as keyof typeof PART_RANGES];
        if (!range) {
          Logger.debug('Invalid part', { part });
          return null;
        }

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        const referenceYear = preferences.referenceDate?.year || DateTime.now().year;
        const targetZone = preferences.timeZone || 'UTC';
        Logger.debug('Using timezone', { targetZone });

        if (preferences.timeZone) {
          // If timezone specified, create dates directly in target timezone
          const start = DateTime.fromObject(
            { year: referenceYear, month: monthNum, day: range.start },
            { zone: targetZone }
          ).startOf('day');
          
          const end = DateTime.fromObject(
            { year: referenceYear, month: monthNum, day: range.end },
            { zone: targetZone }
          ).endOf('day');

          Logger.debug('Created dates', { 
            start: start.toISO(),
            end: end.toISO()
          });

          return createPartialMonthComponent(
            start,
            end,
            { start: matchStart, end: matchEnd },
            fullMatch.trim(),
            preferences
          );
        } else {
          // Otherwise use UTC
          const start = DateTime.fromObject(
            { year: referenceYear, month: monthNum, day: range.start },
            { zone: 'UTC' }
          ).startOf('day');
          
          const end = DateTime.fromObject(
            { year: referenceYear, month: monthNum, day: range.end },
            { zone: 'UTC' }
          ).endOf('day');

          Logger.debug('Created dates', { 
            start: start.toISO(),
            end: end.toISO()
          });

          return createPartialMonthComponent(
            start,
            end,
            { start: matchStart, end: matchEnd },
            fullMatch.trim(),
            preferences
          );
        }
      }
    }
  ]
}; 