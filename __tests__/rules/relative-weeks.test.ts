import { relativeWeeksRule } from '../../src/rules/relative-weeks';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Relative Weeks Rule', () => {
  let parser: ParserEngine;
  // Thursday, March 14, 2024
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(relativeWeeksRule);
  });

  describe('with Monday as week start', () => {
    const prefs = { referenceDate, weekStartDay: 1 as const };

    it('should parse this week', () => {
      const result = parser.parse('this week', prefs);
      // Should return Monday, March 11
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-11');
    });

    it('should parse next week', () => {
      const result = parser.parse('next week', prefs);
      // Should return Monday, March 18
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-18');
    });

    it('should parse week after next', () => {
      const variations = ['week after next', 'the week after next'];
      variations.forEach(input => {
        const result = parser.parse(input, prefs);
        // Should return Monday, March 25
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2024-03-25');
      });
    });

    it('should parse last week', () => {
      const result = parser.parse('last week', prefs);
      // Should return Monday, March 4
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-04');
    });

    it('should parse N weeks from now', () => {
      const result = parser.parse('3 weeks from now', prefs);
      // Should return Monday, April 1
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-04-01');
    });

    it('should return full week range', () => {
      const result = parser.parse('this week', prefs);
      expect(result?.type).toBe('range');
      // Monday 00:00:00
      expect(result?.start.toISOString()).toBe('2024-03-11T00:00:00.000Z');
      // Sunday 23:59:59.999
      expect(result?.end?.toISOString()).toBe('2024-03-17T23:59:59.999Z');
    });

    it('should handle week boundaries correctly', () => {
      const result = parser.parse('next week', prefs);
      expect(result?.type).toBe('range');
      // Monday 00:00:00
      expect(result?.start.toISOString()).toBe('2024-03-18T00:00:00.000Z');
      // Sunday 23:59:59.999
      expect(result?.end?.toISOString()).toBe('2024-03-24T23:59:59.999Z');
    });
  });

  describe('with Sunday as week start', () => {
    const prefs = { referenceDate, weekStartDay: 0 as const };

    it('should parse this week', () => {
      const result = parser.parse('this week', prefs);
      // Should return Sunday, March 10
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-10');
    });

    it('should parse next week', () => {
      const result = parser.parse('next week', prefs);
      // Should return Sunday, March 17
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-17');
    });
  });
}); 