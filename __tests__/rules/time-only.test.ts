import { DateTime } from 'luxon';
import { createParserState } from '../../src/parser/parser-engine';
import { parse } from '../../src/rules/time-only';
import { DateParsePreferences } from '../../src/types/types';

describe('Time Only Rule', () => {
  test('basic time parsing', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    let state = { preferences, rules: [] };

    const result = parse(state, '15:30');
    expect(result?.start.hour).toBe(15);
    expect(result?.start.minute).toBe(30);
  });

  test('noon and midnight', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    let state = { preferences, rules: [] };

    const noon = parse(state, 'noon');
    expect(noon?.start.hour).toBe(12);
    expect(noon?.start.minute).toBe(0);

    const midnight = parse(state, 'midnight');
    expect(midnight?.start.hour).toBe(0);
    expect(midnight?.start.minute).toBe(0);
  });

  test('12-hour format', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    let state = { preferences, rules: [] };

    const am = parse(state, '9:30 AM');
    expect(am?.start.hour).toBe(9);
    expect(am?.start.minute).toBe(30);

    const pm = parse(state, '9:30 PM');
    expect(pm?.start.hour).toBe(21);
    expect(pm?.start.minute).toBe(30);
  });

  test('timezone handling', () => {
    const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
    const preferences: DateParsePreferences = { referenceDate };
    let state = { preferences, rules: [] };

    const result = parse(state, '15:30', { timeZone: 'America/New_York' });
    expect(result?.start.hour).toBe(15);
    expect(result?.start.minute).toBe(30);
  });
}); 