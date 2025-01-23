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

    test('night should use default preferences', () => {
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
    // Create custom preferences that are offset by 1 hour from defaults
    const customPreferences: TimeOfDayPreferences = {
      morning: {
        start: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.start + 1,
        end: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.end + 1,
        early: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.end + 1 
        },
        mid: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.mid.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.mid.end + 1 
        },
        late: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.late.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.morning.late.end + 1 
        }
      },
      afternoon: {
        start: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.start + 1,
        end: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.end + 1,
        early: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.early.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.early.end + 1 
        },
        mid: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.end + 1 
        },
        late: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.late.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.late.end + 1 
        }
      },
      evening: {
        start: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.start + 1,
        end: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.end + 1,
        early: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.early.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.early.end + 1 
        },
        mid: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.mid.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.mid.end + 1 
        },
        late: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.end + 1 
        }
      },
      night: {
        start: DEFAULT_TIME_OF_DAY_PREFERENCES.night.start + 1,
        end: DEFAULT_TIME_OF_DAY_PREFERENCES.night.end + 1,
        early: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.night.early.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.night.early.end + 1 
        },
        mid: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.night.mid.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.night.mid.end + 1 
        },
        late: { 
          start: DEFAULT_TIME_OF_DAY_PREFERENCES.night.late.start + 1, 
          end: DEFAULT_TIME_OF_DAY_PREFERENCES.night.late.end + 1 
        }
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