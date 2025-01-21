import { resolvePreferences } from '../src/resolver/preference-resolver';
import { ParseResult } from '../src/types/types';
import { DateTime } from 'luxon';

describe('Preference Resolver', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  describe('combining results', () => {
    it('should combine date and time results', () => {
      const dateResult: ParseResult = {
        type: 'single',
        start: DateTime.fromISO('2024-03-15T00:00:00Z'),
        confidence: 1.0,
        text: 'tomorrow'
      };

      const timeResult: ParseResult = {
        type: 'single',
        start: DateTime.fromISO('1970-01-01T15:30:00Z'),
        confidence: 1.0,
        text: 'at 3:30 PM'
      };

      const result = resolvePreferences(dateResult, { referenceDate });
      expect(result?.start.toUTC().toISO()).toBe('2024-03-15T15:30:00.000Z');
    });
  });

  describe('timezone handling', () => {
    it('should handle timezone conversions', () => {
      const result: ParseResult = {
        type: 'single',
        start: DateTime.fromISO('2024-03-15T15:30:00Z'),
        confidence: 1.0,
        text: 'tomorrow at 3:30 PM'
      };

      const nyResult = resolvePreferences(result, { 
        referenceDate,
        timeZone: 'America/New_York'
      });

      expect(nyResult?.start.toUTC().hour).toBe(15); // 3:30 PM EDT = 20:30 UTC

      const tokyoResult = resolvePreferences(result, {
        referenceDate,
        timeZone: 'Asia/Tokyo'
      });

      // Verify the times are correctly adjusted for each timezone
      expect(tokyoResult?.start.toUTC().hour).toBe(15); // 3:30 PM EDT = 20:30 UTC
    });
  });

  describe('applying preferences', () => {
    it('should respect week start preference', () => {
      const result: ParseResult = {
        type: 'single',
        start: DateTime.fromISO('2024-03-18T00:00:00Z'),  // Monday
        confidence: 1.0,
        text: 'start of week'
      };

      const mondayResult = resolvePreferences(result, { 
        referenceDate, 
        weekStartsOn: 1  // Monday
      });
      expect(mondayResult?.start.toUTC().toISO())
        .toBe('2024-03-18T00:00:00.000Z');

      const sundayResult = resolvePreferences(result, { 
        referenceDate, 
        weekStartsOn: 0  // Sunday
      });
      expect(sundayResult?.start.toUTC().toISO())
        .toBe('2024-03-18T00:00:00.000Z');
    });
  });
}); 