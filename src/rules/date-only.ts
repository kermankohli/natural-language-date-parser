import { DateTime } from 'luxon';
import { DateParsePreferences, RuleModule, Pattern } from '../types/types';
import { ParseComponent } from '../resolver/resolution-engine';

function createDateComponent(
  date: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences?: DateParsePreferences
): ParseComponent {
  const targetZone = preferences?.timeZone || preferences?.referenceDate?.zoneName || 'UTC';
  const finalDate = date.setZone(targetZone, { keepLocalTime: true });

  return {
    type: 'date',
    value: finalDate,
    span,
    confidence: 1.0,
    metadata: {
      originalText,
      dateType: 'absolute'
    }
  };
}

export function parse(state: { preferences: DateParsePreferences }, input: string, preferences?: DateParsePreferences): ParseComponent | null {
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const matches = input.match(datePattern);
  if (!matches) return null;

  const [_, year, month, day] = matches;
  const date = DateTime.utc(
    parseInt(year),
    parseInt(month),
    parseInt(day)
  );

  if (!date.isValid) {
    return null;
  }

  return createDateComponent(date, { start: 0, end: matches[0].length }, matches[0], preferences);
}

const patterns: Pattern[] = [
  {
    regex: /^(\d{4})-(\d{2})-(\d{2})$/,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [_, year, month, day] = matches;
      const date = DateTime.utc(
        parseInt(year),
        parseInt(month),
        parseInt(day)
      );

      if (!date.isValid) {
        return null;
      }

      return createDateComponent(date, { start: 0, end: matches[0].length }, matches[0], preferences);
    }
  }
];

export const dateOnlyRule: RuleModule = {
  name: 'date-only',
  patterns
}; 