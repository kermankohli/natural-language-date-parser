import { DateTime } from 'luxon';
import { DateParsePreferences, TimeOfDayPreferences, Pattern } from '../../src/types/types';
import { timeOfDayRule, DEFAULT_TIME_OF_DAY_PREFERENCES } from '../../src/rules/time-of-day';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return timeOfDayRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Time of Day Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  describe('basic time of day parsing', () => {
    test('morning should use default preferences', () => {
      const input = 'morning';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 7 });
        expect(result?.metadata?.rangeType).toBe('timeOfDay');
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.end);
        
        expect(result?.metadata?.originalText).toBe('morning');
      }
    });

    test('afternoon should use default preferences', () => {
      const input = 'afternoon';
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
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.end);
        
        expect(result?.metadata?.originalText).toBe('afternoon');
      }
    });

    test('evening should use default preferences', () => {
      const input = 'evening';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 7 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.end);
        
        expect(result?.metadata?.originalText).toBe('evening');
      }
    });

    test('night should handle crossing midnight', () => {
      const input = 'night';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 5 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.night.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.night.end);
        
        // Should be next day
        expect(value.end.toISO()?.slice(0, 10)).toBe(
          value.start.plus({ days: 1 }).toISO()?.slice(0, 10)
        );
        
        expect(result?.metadata?.originalText).toBe('night');
      }
    });
  });

  describe('modifiers', () => {
    test('early morning should use early morning range', () => {
      const input = 'early morning';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 13 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.end);
        
        expect(result?.metadata?.originalText).toBe('early morning');
      }
    });

    test('mid afternoon should use mid afternoon range', () => {
      const input = 'mid afternoon';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 13 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.end);
        
        expect(result?.metadata?.originalText).toBe('mid afternoon');
      }
    });

    test('late evening should use late evening range', () => {
      const input = 'late evening';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, preferences);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 12 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.start);
        expect(value.end.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.end);
        
        expect(result?.metadata?.originalText).toBe('late evening');
      }
    });
  });

  describe('custom preferences', () => {
    const customPreferences: TimeOfDayPreferences = {
      morning: {
        start: 5,
        end: 11,
        early: { start: 5, end: 7 },
        mid: { start: 7, end: 9 },
        late: { start: 9, end: 11 }
      },
      afternoon: {
        start: 11,
        end: 16,
        early: { start: 11, end: 13 },
        mid: { start: 13, end: 14 },
        late: { start: 14, end: 16 }
      },
      evening: {
        start: 16,
        end: 20,
        early: { start: 16, end: 17 },
        mid: { start: 17, end: 18 },
        late: { start: 18, end: 20 }
      },
      night: {
        start: 20,
        end: 5,
        early: { start: 20, end: 22 },
        mid: { start: 22, end: 1 },
        late: { start: 1, end: 5 }
      }
    };

    test('should use custom preferences when provided', () => {
      const input = 'morning';
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, { ...preferences, timeOfDay: customPreferences });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('range');
        expect(result?.span).toEqual({ start: 0, end: 7 });
        
        const value = result?.value as { start: DateTime; end: DateTime };
        expect(value.start.hour).toBe(customPreferences.morning.start);
        expect(value.end.hour).toBe(customPreferences.morning.end);
        
        expect(result?.metadata?.originalText).toBe('morning');
      }
    });
  });
}); 