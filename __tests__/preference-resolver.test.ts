import { resolvePreferences } from '../src/resolver/preference-resolver';
import { ParseResult } from '../src/types/types';

describe('Preference Resolver', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  describe('combining results', () => {
    it('should combine date and time results', () => {
      const dateResult: ParseResult = {
        type: 'single',
        start: new Date('2024-03-15T00:00:00Z'),
        confidence: 1.0,
        text: 'tomorrow'
      };

      const timeResult: ParseResult = {
        type: 'single',
        start: new Date('1970-01-01T15:30:00Z'),
        confidence: 1.0,
        text: 'at 3:30 PM'
      };

      const result = resolvePreferences([dateResult, timeResult], { referenceDate });
      expect(result.start.toISOString()).toBe('2024-03-15T15:30:00.000Z');
    });
  });

  describe('timezone handling', () => {
    it('should handle timezone conversions', () => {
      const result: ParseResult = {
        type: 'single',
        start: new Date('2024-03-15T15:30:00Z'),
        confidence: 1.0,
        text: 'tomorrow at 3:30 PM'
      };

      const nyResult = resolvePreferences(result, { 
        referenceDate,
        timeZone: 'America/New_York'
      });

      const tokyoResult = resolvePreferences(result, {
        referenceDate,
        timeZone: 'Asia/Tokyo'
      });

      // Verify the times are correctly adjusted for each timezone
      expect(nyResult.start.getUTCHours()).toBe(20); // 3:30 PM EDT = 20:30 UTC
      expect(tokyoResult.start.getUTCHours()).toBe(6); // 3:30 PM JST = 06:30 UTC
    });
  });

  describe('applying preferences', () => {
    it('should respect week start preference', () => {
      const result: ParseResult = {
        type: 'single',
        start: new Date('2024-03-18T00:00:00Z'),  // Monday
        confidence: 1.0,
        text: 'start of week'
      };

      const mondayResult = resolvePreferences(result, { 
        referenceDate, 
        weekStartsOn: 1  // Monday
      });
      expect(mondayResult.start.toISOString())
        .toBe('2024-03-18T00:00:00.000Z');

      const sundayResult = resolvePreferences(result, { 
        referenceDate, 
        weekStartsOn: 0  // Sunday
      });
      expect(sundayResult.start.toISOString())
        .toBe('2024-03-18T00:00:00.000Z');
    });
  });
}); 