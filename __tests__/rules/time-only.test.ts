import { timeOnlyRule } from '../../src/rules/time-only';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Time Only Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-20T00:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(timeOnlyRule);
  });

  describe('24-hour format', () => {
    it('should parse simple 24-hour time', () => {
      const result = parser.parse('14:30', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T14:30:00.000Z');
    });

    it('should parse with seconds', () => {
      const result = parser.parse('14:30:45', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T14:30:45.000Z');
    });

    it('should parse with timezone', () => {
      const result = parser.parse('14:30Z', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T14:30:00.000Z');
    });

    it('should parse with timezone offset', () => {
      const result = parser.parse('14:30+02:00', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T12:30:00.000Z');
    });
  });

  describe('12-hour format', () => {
    it('should parse AM times', () => {
      const result = parser.parse('9:30 AM', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T09:30:00.000Z');
    });

    it('should parse PM times', () => {
      const result = parser.parse('2:30 PM', { referenceDate });
      expect(result?.start.toISOString()).toBe('2024-03-20T14:30:00.000Z');
    });

    it('should handle 12 AM/PM edge cases', () => {
      expect(parser.parse('12:00 AM', { referenceDate })?.start.toISOString())
        .toBe('2024-03-20T00:00:00.000Z');
      expect(parser.parse('12:00 PM', { referenceDate })?.start.toISOString())
        .toBe('2024-03-20T12:00:00.000Z');
    });
  });

  describe('validation', () => {
    it('should reject invalid hours', () => {
      expect(parser.parse('24:00')).toBeNull();
      expect(parser.parse('13:00 PM')).toBeNull();
    });

    it('should reject invalid minutes/seconds', () => {
      expect(parser.parse('12:60')).toBeNull();
      expect(parser.parse('12:00:60')).toBeNull();
    });
  });
}); 