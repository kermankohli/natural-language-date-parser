import { DateTime } from 'luxon';
import { ordinalWeeksRule } from '../../src/rules/ordinal-weeks';
import { DateParsePreferences } from '../../src/types/types';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return ordinalWeeksRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Ordinal Weeks Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  test('first week', () => {
    const input = 'first week of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('ordinalWeek');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
      expect(value.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
      
      expect(result?.metadata?.originalText).toBe(input);
    }
  });

  test('last week', () => {
    const input = 'last week of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('ordinalWeek');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-25');
      expect(value.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
      
      expect(result?.metadata?.originalText).toBe(input);
    }
  });

  test('ordinal variations', () => {
    const variations = [
      { input: 'first week of March', expected: '2024-03-04', length: 19 },
      { input: '1st week of March', expected: '2024-03-04', length: 17 },
      { input: 'second week of March', expected: '2024-03-11', length: 20 },
      { input: '2nd week of March', expected: '2024-03-11', length: 17 }
    ];

    for (const { input, expected, length } of variations) {
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: length });
        expect(result?.metadata?.rangeType).toBe('ordinalWeek');
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.toUTC().toISO()?.slice(0, 10)).toBe(expected);
        
        expect(result?.metadata?.originalText).toBe(input);
      }
    }
  });

  test('week start preferences', () => {
    const input = 'first week of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      // Test with Monday start
      const mondayPrefs = { ...preferences, weekStartsOn: 1 };
      const mondayResult = pattern.parse(matches, mondayPrefs);
      expect(mondayResult).not.toBeNull();
      expect(mondayResult?.type).toBe('range');
      expect(mondayResult?.span).toEqual({ start: 0, end: input.length });
      expect(mondayResult?.metadata?.rangeType).toBe('ordinalWeek');
      
      const mondayValue = mondayResult?.value as { start: DateTime; end: DateTime };
      expect(mondayValue.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
      expect(mondayValue.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
      
      expect(mondayResult?.metadata?.originalText).toBe(input);

      // Test with Sunday start
      const sundayPrefs = { ...preferences, weekStartsOn: 0 };
      const sundayResult = pattern.parse(matches, sundayPrefs);
      expect(sundayResult).not.toBeNull();
      expect(sundayResult?.type).toBe('range');
      expect(sundayResult?.span).toEqual({ start: 0, end: input.length });
      expect(sundayResult?.metadata?.rangeType).toBe('ordinalWeek');
      
      const sundayValue = sundayResult?.value as { start: DateTime; end: DateTime };
      expect(sundayValue.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-03');
      expect(sundayValue.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-09');
      
      expect(sundayResult?.metadata?.originalText).toBe(input);
    }
  });

  test('second to last week', () => {
    const input = 'second to last week of june';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('ordinalWeek');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-06-17');
      expect(value.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-06-23');
      
      expect(result?.metadata?.originalText).toBe(input);
    }
  });

  test('third to last week', () => {
    const input = 'third to last week of august';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.rangeType).toBe('ordinalWeek');
      
      const value = result?.value as { start: DateTime; end: DateTime };
      expect(value.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-08-12');
      expect(value.end.toUTC().toISO()?.slice(0, 10)).toBe('2024-08-18');
      
      expect(result?.metadata?.originalText).toBe(input);
    }
  });
}); 