import { DateTime } from 'luxon';
import { timeRangesRule } from '../../src/rules/time-ranges';
import { DateParsePreferences } from '../../src/types/types';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return timeRangesRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Time Ranges Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  test('basic time range parsing', () => {
    const input = '3:30 PM to 5:00 PM';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: 18 });
      expect(result?.metadata?.rangeType).toBe('time');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.hour).toBe(15);
      expect(value.start.minute).toBe(30);
      expect(value.end.hour).toBe(17);
      expect(value.end.minute).toBe(0);
      
      expect(result?.metadata?.originalText).toBe('3:30 PM to 5:00 PM');
    }
  });

  test('24-hour format', () => {
    const input = '15:30 to 17:00';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.hour).toBe(15);
      expect(value.start.minute).toBe(30);
      expect(value.start.second).toBe(0);
      expect(value.start.millisecond).toBe(0);
      
      expect(value.end.hour).toBe(17);
      expect(value.end.minute).toBe(0);
      expect(value.end.second).toBe(0);
      expect(value.end.millisecond).toBe(0);
      
      expect(result?.metadata?.rangeType).toBe('time');
      expect(result?.metadata?.originalText).toBe('15:30 to 17:00');
    }
  });

  test('timezone handling', () => {
    const input = '3:30 PM to 5:00 PM';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      // Test with New York timezone
      const nyPrefs = { ...preferences, timeZone: 'America/New_York' };
      const nyResult = pattern.parse(matches, nyPrefs);
      expect(nyResult).not.toBeNull();
      
      const nyValue = nyResult?.value as { start: DateTime; end: DateTime };
      expect(nyValue.start.zoneName).toBe('America/New_York');
      expect(nyValue.start.hour).toBe(15);
      expect(nyValue.start.minute).toBe(30);
      
      // Test with Tokyo timezone
      const tokyoPrefs = { ...preferences, timeZone: 'Asia/Tokyo' };
      const tokyoResult = pattern.parse(matches, tokyoPrefs);
      expect(tokyoResult).not.toBeNull();
      
      const tokyoValue = tokyoResult?.value as { start: DateTime; end: DateTime };
      expect(tokyoValue.start.zoneName).toBe('Asia/Tokyo');
      expect(tokyoValue.start.hour).toBe(15);
      expect(tokyoValue.start.minute).toBe(30);
    }
  });

  test('alternative formats', () => {
    const input = 'from 3 PM - 5 PM';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('time');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.hour).toBe(15);
      expect(value.start.minute).toBe(0);
      expect(value.end.hour).toBe(17);
      expect(value.end.minute).toBe(0);
      
      expect(result?.metadata?.originalText).toBe('from 3 PM - 5 PM');
    }
  });

  test('overnight ranges', () => {
    const input = '10:00 PM to 2:00 AM';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('time');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.hour).toBe(22);
      expect(value.start.minute).toBe(0);
      expect(value.end.hour).toBe(2);
      expect(value.end.minute).toBe(0);
      
      // End date should be the next day
      expect(value.end.toISO()?.slice(0, 10)).toBe(
        value.start.plus({ days: 1 }).toISO()?.slice(0, 10)
      );
      
      expect(result?.metadata?.originalText).toBe('10:00 PM to 2:00 AM');
    }
  });

  test('invalid ranges', () => {
    // Test invalid hours
    const input1 = '25:00 to 26:00';
    const pattern1 = findPatternForInput(input1);
    const matches1 = pattern1?.regex.exec(input1);
    if (matches1 && pattern1) {
      const result = pattern1.parse(matches1, preferences);
      expect(result).toBeNull();
    }

    // Test invalid minutes
    const input2 = '12:60 to 13:60';
    const pattern2 = findPatternForInput(input2);
    const matches2 = pattern2?.regex.exec(input2);
    if (matches2 && pattern2) {
      const result = pattern2.parse(matches2, preferences);
      expect(result).toBeNull();
    }

    // Test invalid 12-hour format
    const input3 = '13:00 PM to 14:00 PM';
    const pattern3 = findPatternForInput(input3);
    const matches3 = pattern3?.regex.exec(input3);
    if (matches3 && pattern3) {
      const result = pattern3.parse(matches3, preferences);
      expect(result).toBeNull();
    }
  });
}); 