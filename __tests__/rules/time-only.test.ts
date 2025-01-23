import { DateTime } from 'luxon';
import { timeOnlyRule } from '../../src/rules/time-only';
import { DateParsePreferences } from '../../src/types/types';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return timeOnlyRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Time Only Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  test('basic time parsing', () => {
    const input = '15:30';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('time');
      expect(result?.span).toEqual({ start: 0, end: 5 });
      expect((result?.value as DateTime).hour).toBe(15);
      expect((result?.value as DateTime).minute).toBe(30);
      expect(result?.metadata?.originalText).toBe('15:30');
    }
  });

  test('noon and midnight', () => {
    // Test noon
    const noonInput = 'noon';
    const noonPattern = findPatternForInput(noonInput);
    expect(noonPattern).toBeDefined();

    const noonMatches = noonPattern?.regex.exec(noonInput);
    expect(noonMatches).not.toBeNull();

    if (noonMatches && noonPattern) {
      const noon = noonPattern.parse(noonMatches, preferences);
      expect(noon?.type).toBe('time');
      expect(noon?.span).toEqual({ start: 0, end: 4 });
      expect((noon?.value as DateTime).hour).toBe(12);
      expect((noon?.value as DateTime).minute).toBe(0);
      expect(noon?.metadata?.originalText).toBe('noon');
    }

    // Test midnight
    const midnightInput = 'midnight';
    const midnightPattern = findPatternForInput(midnightInput);
    expect(midnightPattern).toBeDefined();

    const midnightMatches = midnightPattern?.regex.exec(midnightInput);
    expect(midnightMatches).not.toBeNull();

    if (midnightMatches && midnightPattern) {
      const midnight = midnightPattern.parse(midnightMatches, preferences);
      expect(midnight?.type).toBe('time');
      expect(midnight?.span).toEqual({ start: 0, end: 8 });
      expect((midnight?.value as DateTime).hour).toBe(0);
      expect((midnight?.value as DateTime).minute).toBe(0);
      expect(midnight?.metadata?.originalText).toBe('midnight');
    }
  });

  test('12-hour format', () => {
    // Test AM
    const amInput = '9:30 AM';
    const amPattern = findPatternForInput(amInput);
    expect(amPattern).toBeDefined();

    const amMatches = amPattern?.regex.exec(amInput);
    expect(amMatches).not.toBeNull();

    if (amMatches && amPattern) {
      const am = amPattern.parse(amMatches, preferences);
      expect(am?.type).toBe('time');
      expect(am?.span).toEqual({ start: 0, end: 7 });
      expect((am?.value as DateTime).hour).toBe(9);
      expect((am?.value as DateTime).minute).toBe(30);
      expect(am?.metadata?.originalText).toBe('9:30 AM');
    }

    // Test PM
    const pmInput = '9:30 PM';
    const pmPattern = findPatternForInput(pmInput);
    expect(pmPattern).toBeDefined();

    const pmMatches = pmPattern?.regex.exec(pmInput);
    expect(pmMatches).not.toBeNull();

    if (pmMatches && pmPattern) {
      const pm = pmPattern.parse(pmMatches, preferences);
      expect(pm?.type).toBe('time');
      expect(pm?.span).toEqual({ start: 0, end: 7 });
      expect((pm?.value as DateTime).hour).toBe(21);
      expect((pm?.value as DateTime).minute).toBe(30);
      expect(pm?.metadata?.originalText).toBe('9:30 PM');
    }
  });

  test('time with "at" prefix', () => {
    const input = 'at 3:30 PM';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, preferences);
      expect(result?.type).toBe('time');
      expect(result?.span).toEqual({ start: 0, end: 10 });
      expect((result?.value as DateTime).hour).toBe(15);
      expect((result?.value as DateTime).minute).toBe(30);
      expect(result?.metadata?.originalText).toBe('at 3:30 PM');
    }
  });

  test('invalid times', () => {
    // Test invalid hour
    const input1 = '25:00';
    const pattern1 = findPatternForInput(input1);
    const matches1 = pattern1?.regex.exec(input1);
    if (matches1 && pattern1) {
      const result = pattern1.parse(matches1, preferences);
      expect(result).toBeNull();
    }

    // Test invalid minutes
    const input2 = '12:60';
    const pattern2 = findPatternForInput(input2);
    const matches2 = pattern2?.regex.exec(input2);
    if (matches2 && pattern2) {
      const result = pattern2.parse(matches2, preferences);
      expect(result).toBeNull();
    }

    // Test invalid 12-hour format
    const input3 = '13:00 PM';
    const pattern3 = findPatternForInput(input3);
    const matches3 = pattern3?.regex.exec(input3);
    if (matches3 && pattern3) {
      const result = pattern3.parse(matches3, preferences);
      expect(result).toBeNull();
    }
  });
}); 