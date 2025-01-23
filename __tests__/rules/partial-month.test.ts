import { DateTime } from 'luxon';
import { partialMonthRule } from '../../src/rules/partial-month';
import { DateParsePreferences } from '../../src/types/types';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return partialMonthRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Partial Month Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  test('early month', () => {
    const input = 'early march';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: 11 });
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toISO()).toBe('2024-03-01T00:00:00.000Z');
      expect(value.end.toISO()).toBe('2024-03-10T23:59:59.999Z');
      
      expect(result?.metadata?.rangeType).toBe('partialMonth');
      expect(result?.metadata?.originalText).toBe('early march');
    }
  });

  test('mid month', () => {
    const input = 'mid march';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: 9 });
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toISO()).toBe('2024-03-11T00:00:00.000Z');
      expect(value.end.toISO()).toBe('2024-03-20T23:59:59.999Z');
      
      expect(result?.metadata?.rangeType).toBe('partialMonth');
      expect(result?.metadata?.originalText).toBe('mid march');
    }
  });

  test('late month', () => {
    const input = 'late march';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: 10 });
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toISO()).toBe('2024-03-21T00:00:00.000Z');
      expect(value.end.toISO()).toBe('2024-03-31T23:59:59.999Z');
      
      expect(result?.metadata?.rangeType).toBe('partialMonth');
      expect(result?.metadata?.originalText).toBe('late march');
    }
  });

  test('timezone handling', () => {
    const input = 'early march';
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
      expect(nyValue.start.toISO()).toBe('2024-03-01T00:00:00.000-05:00');
      expect(nyValue.end.toISO()).toBe('2024-03-10T23:59:59.999-04:00');
      
      // Test with Tokyo timezone
      const tokyoPrefs = { ...preferences, timeZone: 'Asia/Tokyo' };
      const tokyoResult = pattern.parse(matches, tokyoPrefs);
      expect(tokyoResult).not.toBeNull();
      
      const tokyoValue = tokyoResult?.value as { start: DateTime; end: DateTime };
      expect(tokyoValue.start.zoneName).toBe('Asia/Tokyo');
      expect(tokyoValue.start.toISO()).toBe('2024-03-01T00:00:00.000+09:00');
      expect(tokyoValue.end.toISO()).toBe('2024-03-10T23:59:59.999+09:00');
    }
  });
}); 