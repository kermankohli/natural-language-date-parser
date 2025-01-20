import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

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
  start: { start: 1, end: 10 },
  mid: { start: 11, end: 20 },
  middle: { start: 11, end: 20 },
  late: { start: 21, end: 31 },
  end: { start: 21, end: 31 }
};

function getLastDayOfMonth(year: number, month: number): number {
  // month is 1-12, but Date constructor wants 0-11, so we use month for next month's 0th day
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export const partialMonthRule: RuleModule = {
  name: 'partial-month',
  patterns: [
    {
      name: 'partial-month',
      regex: /^(?:the\s+)?(early|mid|late|beginning|middle|end|start)(?:\s+(?:of|in)\s+(?:the\s+)?|\s+)(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'range',
        tokens: [matches[0]],
        pattern: 'partial-month',
        captures: {
          part: matches[1].toLowerCase(),
          month: matches[2].toLowerCase()
        }
      })
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const { part, month } = intermediate.captures || {};
    if (!part || !month) return null;
    const referenceDate = prefs.referenceDate || new Date();
    const year = referenceDate.getUTCFullYear();
    const monthNum = MONTHS[month as keyof typeof MONTHS];
    const range = PART_RANGES[part as keyof typeof PART_RANGES];

    if (!monthNum || !range) return null;

    Logger.debug('Interpreting partial month', {
      part,
      month,
      year,
      monthNum,
      range
    });

    const start = new Date(Date.UTC(year, monthNum - 1, range.start));
    const lastDay = getLastDayOfMonth(year, monthNum);
    const endDay = Math.min(range.end, lastDay);
    const end = new Date(Date.UTC(year, monthNum - 1, endDay, 23, 59, 59, 999));

    return {
      type: 'range',
      start,
      end,
      confidence: 1.0,
      text: intermediate.tokens?.[0] || intermediate.text || ''
    };
  }
}; 