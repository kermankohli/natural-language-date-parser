import { dateTimeRule } from '../../src';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('DateTime Rule', () => {
  let parser: ParserEngine;

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(dateTimeRule);
  });

  describe('ISO format', () => {
    it('should parse ISO datetime with Z timezone', () => {
      const result = parser.parse('2024-03-20T15:30:00Z');
      expect(result?.start.toISOString()).toBe('2024-03-20T15:30:00.000Z');
    });

    it('should parse ISO datetime with positive timezone offset', () => {
      const result = parser.parse('2024-03-20T15:30:00+02:00');
      expect(result?.start.toISOString()).toBe('2024-03-20T13:30:00.000Z');
    });

    it('should parse ISO datetime with negative timezone offset', () => {
      const result = parser.parse('2024-03-20T15:30:00-05:00');
      expect(result?.start.toISOString()).toBe('2024-03-20T20:30:00.000Z');
    });

    it('should handle missing seconds', () => {
      const result = parser.parse('2024-03-20T15:30');
      expect(result?.start.toISOString()).toBe('2024-03-20T15:30:00.000Z');
    });

    it('should handle compact timezone format', () => {
      const result = parser.parse('2024-03-20T15:30+0200');
      expect(result?.start.toISOString()).toBe('2024-03-20T13:30:00.000Z');
    });
  });

  describe('Space-separated format', () => {
    it('should parse 24-hour time format', () => {
      const result = parser.parse('2024-03-20 23:30:00');
      expect(result?.start.toISOString()).toBe('2024-03-20T23:30:00.000Z');
    });

    it('should parse 12-hour time format', () => {
      const result = parser.parse('2024-03-20 11:30:00 PM');
      expect(result?.start.toISOString()).toBe('2024-03-20T23:30:00.000Z');
    });

    it('should parse AM times correctly', () => {
      const result = parser.parse('2024-03-20 11:30:00 AM');
      expect(result?.start.toISOString()).toBe('2024-03-20T11:30:00.000Z');
    });
  });

  describe('Validation', () => {
    it('should reject invalid times', () => {
      expect(parser.parse('2024-03-20T24:00:00')).toBeNull();
      expect(parser.parse('2024-03-20T12:60:00')).toBeNull();
      expect(parser.parse('2024-03-20T12:00:60')).toBeNull();
    });

    it('should reject invalid timezone offsets', () => {
      expect(parser.parse('2024-03-20T12:00:00+15:00')).toBeNull();
      expect(parser.parse('2024-03-20T12:00:00+00:60')).toBeNull();
    });

    it('should reject invalid 12-hour times', () => {
      expect(parser.parse('2024-03-20 13:00 PM')).toBeNull();
      expect(parser.parse('2024-03-20 00:00 PM')).toBeNull();
    });
  });
}); 