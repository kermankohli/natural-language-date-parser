import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult, RuleModule, Pattern } from '../types/types';

export function parse(state: { preferences: DateParsePreferences }, input: string, preferences?: DateParsePreferences): ParseResult | null {
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const matches = input.match(datePattern);
  if (!matches) return null;

  const [_, year, month, day] = matches;
  const date = DateTime.utc(
    parseInt(year),
    parseInt(month),
    parseInt(day)
  ).setZone(preferences?.timeZone, { keepLocalTime: true });

  if (!date.isValid) {
    return null;
  }

  return {
    type: 'single',
    start: date,
    confidence: 1,
    text: matches[0]
  };
}

const patterns: Pattern[] = [
  {
    regex: /^(\d{4})-(\d{2})-(\d{2})$/,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
      const [_, year, month, day] = matches;
      const date = DateTime.utc(
        parseInt(year),
        parseInt(month),
        parseInt(day)
      );

      if (!date.isValid) {
        return null;
      }

      return {
        type: 'single',
        start: date,
        confidence: 1,
        text: matches[0]
      };
    }
  }
];

export const dateOnlyRule: RuleModule = {
  name: 'date-only',
  patterns
}; 