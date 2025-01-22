import { DateTime } from 'luxon';
import { DateParsePreferences, TimeOfDayPreferences } from '../../src/types/types';
import { timeOfDayRule, DEFAULT_TIME_OF_DAY_PREFERENCES } from '../../src/rules/time-of-day';
import { createParserState, registerRule } from '../../src/parser/parser-engine';

describe('Time of Day Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');
  const preferences: DateParsePreferences = { referenceDate };

  describe('basic time of day parsing', () => {
    test('morning should use default preferences', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('morning')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.end);
    });

    test('afternoon should use default preferences', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('afternoon')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.end);
    });

    test('evening should use default preferences', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('evening')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.end);
    });

    test('night should handle crossing midnight', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('night')!, preferences);
      
      expect(result).not.toBeNull();
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.night.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.night.end);
      if (result && result.start && result.end) {
        expect(result.end.day).toBe(result.start.day + 1); // Should be next day
      }
    });
  });

  describe('modifiers', () => {
    test('early morning should use early morning range', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('early morning')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.early.end);
    });

    test('mid afternoon should use mid afternoon range', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('mid afternoon')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.afternoon.mid.end);
    });

    test('late evening should use late evening range', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('late evening')!, preferences);
      
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.evening.late.end);
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
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('morning')!, {
        ...preferences,
        timeOfDay: customPreferences
      });
      
      expect(result?.start.hour).toBe(customPreferences.morning.start);
      expect(result?.end?.hour).toBe(customPreferences.morning.end);
    });

    test('should use custom preferences for modifiers', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('early morning')!, {
        ...preferences,
        timeOfDay: customPreferences
      });
      
      expect(result?.start.hour).toBe(customPreferences.morning.early.start);
      expect(result?.end?.hour).toBe(customPreferences.morning.early.end);
    });
  });

  describe('timezone handling', () => {
    test('should respect timezone preferences', () => {
      let state = createParserState({ referenceDate });
      state = registerRule(state, timeOfDayRule);

      const pattern = state.rules[0].patterns[0];
      const result = pattern.parse(pattern.regex.exec('morning')!, {
        ...preferences,
        timeZone: 'America/New_York'
      });
      
      expect(result?.start.zoneName).toBe('America/New_York');
      expect(result?.start.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.start);
      expect(result?.end?.hour).toBe(DEFAULT_TIME_OF_DAY_PREFERENCES.morning.end);
    });
  });
}); 