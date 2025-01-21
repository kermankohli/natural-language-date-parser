import { RuleModule, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

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

export const partialMonthRule: RuleModule = {
  name: 'partial-month',
  patterns: [
    {
      regex: /^(early|beginning|mid|middle|late|end)\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        Logger.debug('Parsing partial month', { matches, preferences });

        const [, part, month] = matches;
        if (!part || !month) {
          Logger.debug('Missing part or month', { part, month });
          return null;
        }

        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) {
          Logger.debug('Invalid month', { month });
          return null;
        }

        const referenceYear = preferences.referenceDate?.year || DateTime.now().year;
        const range = PART_RANGES[part.toLowerCase() as keyof typeof PART_RANGES];
        if (!range) {
          Logger.debug('Invalid part', { part });
          return null;
        }

        // Create dates in the target timezone if specified
        const targetZone = preferences.timeZone || 'UTC';
        Logger.debug('Using timezone', { targetZone });

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

        return {
          type: 'range',
          start: start.toUTC(),
          end: end.toUTC(),
          confidence: 1.0,
          text: matches[0]
        };
      }
    }
  ]
}; 