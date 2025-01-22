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

      const result = resolvePreferences(dateResult, { referenceDate}, timeResult);
      expect(result?.start.toISO()).toBe('2024-03-15T15:30:00.000Z');
    });
  });

  describe('timezone handling', () => {
    it('should preserve wall time when converting between timezones', () => {
      // Create a time that represents 3:30 PM NY time
      const utcTime: ParseResult = {
        type: 'single',
        start: DateTime.fromISO('2024-03-15T15:30:00-04:00', { zone: 'America/New_York' }),  // 3:30 PM NY
        confidence: 1.0,
        text: '[Test] 15:30 NY'  // Make it clear this is just test data
      };

      // When viewed in NY (UTC-4), should still show as 3:30 PM wall time
      const nyResult = resolvePreferences(utcTime, { 
        referenceDate,
        timeZone: 'America/New_York'
      });

      expect(nyResult?.start.hour).toBe(15);  // Should still be 3:30 PM wall time
      expect(nyResult?.start.toUTC().hour).toBe(19);  // But internally is 7:30 PM UTC

      // When viewed in Tokyo (UTC+9), should still show as 3:30 PM wall time
      const tokyoResult = resolvePreferences(utcTime, {
        referenceDate,
        timeZone: 'Asia/Tokyo'
      });
      
      expect(tokyoResult?.start.hour).toBe(15);  // Should still be 3:30 PM wall time
      expect(tokyoResult?.start.toUTC().hour).toBe(6);  // But internally is 6:30 AM UTC next day
      expect(tokyoResult?.start.day).toBe(15);  // Same day in Tokyo
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