import { ordinalWeeksRule } from '../../src/rules/ordinal-weeks';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Ordinal Weeks Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(ordinalWeeksRule);
  });

  describe('with Monday as week start', () => {
    const prefs = { referenceDate, weekStartDay: 1 as const };

    describe('forward ordinals', () => {
      it('should parse first week of month', () => {
        const result = parser.parse('first week of March', prefs);
        // Should be March 4 (first Monday)
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-04');
      });

      it('should parse third week of month', () => {
        const result = parser.parse('third week of March', prefs);
        // Should be March 18
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-18');
      });

      it('should handle numeric ordinals', () => {
        const result = parser.parse('2nd week of March', prefs);
        // Should be March 11
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-11');
      });
    });

    describe('backward ordinals', () => {
      it('should parse last week of month', () => {
        const result = parser.parse('last week of March', prefs);
        // Should be March 25 (last Monday)
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-25');
      });

      it('should parse second to last week', () => {
        const result = parser.parse('second to last week of March', prefs);
        // Should be March 18
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-18');
      });
    });

    describe('edge cases', () => {
      it('should handle months with partial weeks', () => {
        const result = parser.parse('first week of April', prefs);
        // Should be April 1
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-04-01');
      });

      it('should handle fifth week when it exists', () => {
        // July 2024 has 5 Mondays
        const result = parser.parse('fifth week of July', prefs);
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-07-29');
      });

      it('should return null for fifth week when it doesn\'t exist', () => {
        // June 2024 has only 4 Mondays
        const result = parser.parse('fifth week of June', prefs);
        expect(result).toBeNull();
      });
    });
  });

  describe('with Sunday as week start', () => {
    const prefs = { referenceDate, weekStartDay: 0 as const };

    it('should parse first week with Sunday start', () => {
      const result = parser.parse('first week of March', prefs);
      // Should be March 3 (first Sunday)
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-03');
    });

    it('should parse last week with Sunday start', () => {
      const result = parser.parse('last week of March', prefs);
      // Should be March 31 (last Sunday)
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-31');
    });
  });
}); 