import { DateTime } from 'luxon';
import { createParserState } from '../../src/parser/parser-engine';
import { parse } from '../../src/rules/date-only';
import { DateParsePreferences } from '../../src/types/types';

describe('Date Only Rule', () => {
  let state: any;

  test('basic date parsing', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    state = { preferences, rules: [] };

    console.log('Date Parsing', parse(state, '2024-03-20'))
    expect(parse(state, '2024-03-20')?.start?.toISO()?.slice(0, 10)).toBe('2024-03-20');

    expect(parse(state, '2024-12-31')?.start?.toISO()?.slice(0, 10)).toBe('2024-12-31');

    expect(parse(state, '2025-01-01')?.start?.toISO()?.slice(0, 10)).toBe('2025-01-01');
  });

  test('timezone handling', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    state = { preferences, rules: [] };

    const result = parse(state, '2024-03-20', { timeZone: 'America/New_York' });
    expect(result?.start.toUTC().toISO()).toBe('2024-03-20T04:00:00.000Z');
  });

  test('invalid dates', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    state = { preferences, rules: [] };

    expect(parse(state, '2024-13-01')).toBeNull();
    expect(parse(state, '2024-04-31')).toBeNull();
    expect(parse(state, '2024-02-30')).toBeNull();
  });
}); 