import { RuleModule, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
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
      regex: /^(?:the\s+)?(early|beginning|mid|middle|late|end)(?:\s+(?:of|in)\s+)?(?:the\s+)?(?:month\s+(?:of\s+)?)?(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [, part, month] = matches;
        if (!part || !month) return null;

        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) return null;

        const referenceYear = preferences.referenceDate?.year || DateTime.now().year;
        const range = PART_RANGES[part.toLowerCase() as keyof typeof PART_RANGES];
        if (!range) return null;

        const start = DateTime.utc(referenceYear, monthNum, range.start);
        const end = DateTime.utc(referenceYear, monthNum, range.end).endOf('day');

        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    }
  ]
}; 