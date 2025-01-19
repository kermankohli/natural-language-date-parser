import { PreferenceResolver } from '../src/resolver/preference-resolver';
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

      const resolver = new PreferenceResolver({ referenceDate });
      const result = resolver.resolve([dateResult, timeResult]);

      expect(result.start.toISOString()).toBe('2024-03-15T15:30:00.000Z');
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

      const mondayResolver = new PreferenceResolver({ 
        referenceDate, 
        weekStartsOn: 1  // Monday
      });
      expect(mondayResolver.resolve([result]).start.toISOString())
        .toBe('2024-03-18T00:00:00.000Z');

      const sundayResolver = new PreferenceResolver({ 
        referenceDate, 
        weekStartsOn: 0  // Sunday
      });
      expect(sundayResolver.resolve([result]).start.toISOString())
        .toBe('2024-03-17T00:00:00.000Z');
    });
  });
}); 