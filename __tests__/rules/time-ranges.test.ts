import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { timeRangesRule } from '../../src/rules/time-ranges';
import { DateParsePreferences } from '../../src/types/types';

describe('Time Ranges Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  test('basic time range parsing', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeRangesRule);

    const pattern = state.rules[0].patterns[0];
    const result = pattern.parse(pattern.regex.exec('3:30 PM to 5:00 PM')!, preferences);
    
    expect(result?.start.toUTC().hour).toBe(15);
    expect(result?.start.toUTC().minute).toBe(30);
    expect(result?.end?.toUTC().hour).toBe(17);
    expect(result?.end?.toUTC().minute).toBe(0);
  });

  test('24-hour format', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeRangesRule);

    const pattern = state.rules[0].patterns[0];
    const result = pattern.parse(pattern.regex.exec('15:30 to 17:00')!, preferences);
    
    expect(result?.start.toUTC().hour).toBe(15);
    expect(result?.start.toUTC().minute).toBe(30);
    expect(result?.end?.toUTC().hour).toBe(17);
    expect(result?.end?.toUTC().minute).toBe(0);
  });

  test('alternative formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeRangesRule);

    const pattern = state.rules[0].patterns[1];
    const result = pattern.parse(pattern.regex.exec('from 3 PM - 5 PM')!, preferences);
    
    expect(result?.start.toUTC().hour).toBe(15);
    expect(result?.start.toUTC().minute).toBe(0);
    expect(result?.end?.toUTC().hour).toBe(17);
    expect(result?.end?.toUTC().minute).toBe(0);
  });

  test('overnight ranges', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeRangesRule);

    const pattern = state.rules[0].patterns[0];
    const result = pattern.parse(pattern.regex.exec('10:00 PM to 2:00 AM')!, preferences);
    
    expect(result?.start.toUTC().hour).toBe(22);
    expect(result?.start.toUTC().minute).toBe(0);
    expect(result?.end?.toUTC().hour).toBe(2);
    expect(result?.end?.toUTC().minute).toBe(0);
    
    // End date should be the next day
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe(
      result?.start.toUTC().plus({ days: 1 }).toISO()?.slice(0, 10)
    );
  });

  test('timezone handling', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeRangesRule);

    const pattern = state.rules[0].patterns[0];
    const result = pattern.parse(pattern.regex.exec('3:30 PM to 5:00 PM')!, {
      ...preferences,
      timeZone: 'America/New_York'
    });
    
    expect(result?.start.zoneName).toBe('America/New_York');
    expect(result?.start.hour).toBe(15);
    expect(result?.start.minute).toBe(30);
    expect(result?.end?.hour).toBe(17);
    expect(result?.end?.minute).toBe(0);
  });
}); 