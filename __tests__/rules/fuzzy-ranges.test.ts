import { fuzzyRangesRule } from '../../src/rules/fuzzy-ranges';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Fuzzy Ranges Rule', () => {
  let parser: ParserEngine;
  // Thursday, March 14, 2024
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(fuzzyRangesRule);
  });

  describe('weekends', () => {
    it('should parse this weekend', () => {
      const result = parser.parse('this weekend', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-16T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-03-17T23:59:59.999Z');
    });

    it('should parse next weekend', () => {
      const result = parser.parse('next weekend', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-23T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-03-24T23:59:59.999Z');
    });
  });

  describe('half months', () => {
    it('should parse first half of month', () => {
      const result = parser.parse('first half of April', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-04-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-04-15');
    });

    it('should parse second half of month', () => {
      const result = parser.parse('second half of April', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-04-16');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-04-30');
    });
  });

  describe('multiple weekends', () => {
    it('should parse next 2 weekends', () => {
      const result = parser.parse('next 2 weekends', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-23T00:00:00.000Z');  // First weekend
      expect(result?.end?.toISOString()).toBe('2024-03-31T23:59:59.999Z');   // End of second weekend
    });

    it('should parse following 3 weekends', () => {
      const result = parser.parse('following 3 weekends', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-23T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-04-07T23:59:59.999Z');
    });
  });

  describe('days of month', () => {
    it('should parse first 3 days of next month', () => {
      const result = parser.parse('first 3 days of next month', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-04-01T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-04-03T23:59:59.999Z');
    });

    it('should parse last 5 days of month', () => {
      const result = parser.parse('last 5 days of March', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-27T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-03-31T23:59:59.999Z');
    });
  });

  describe('month parts', () => {
    it('should parse beginning of month', () => {
      const result = parser.parse('beginning of April', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-04-01T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-04-05T23:59:59.999Z');
    });

    it('should parse end of month', () => {
      const result = parser.parse('end of March', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-26T00:00:00.000Z');
      expect(result?.end?.toISOString()).toBe('2024-03-31T23:59:59.999Z');
    });
  });
}); 