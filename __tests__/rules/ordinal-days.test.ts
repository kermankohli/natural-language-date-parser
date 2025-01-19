import { ordinalDaysRule } from '../../src/rules/ordinal-days';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Ordinal Days Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(ordinalDaysRule);
  });

  describe('specific weekdays', () => {
    it('should parse first Monday of month', () => {
      const result = parser.parse('first Monday in March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-04');
    });

    it('should parse last Friday of month', () => {
      const result = parser.parse('last Friday in March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-29');
    });

    it('should parse third Wednesday of month', () => {
      const result = parser.parse('third Wednesday of March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-20');
    });

    it('should handle numeric ordinals', () => {
      const result = parser.parse('2nd Thursday in March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-14');
    });

    it('should return null for fifth Wednesday when it doesn\'t exist', () => {
      const result = parser.parse('fifth Wednesday in March', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('end of month references', () => {
    it('should parse last day of month', () => {
      const result = parser.parse('last day of the month', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-31');
    });

    it('should parse penultimate day', () => {
      const result = parser.parse('penultimate day of month', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-30');
    });

    it('should parse second to last day', () => {
      const result = parser.parse('second to last day of the month', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-30');
    });

    it('should parse third to last day', () => {
      const result = parser.parse('third to last day of month', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-29');
    });
  });

  describe('edge cases', () => {
    it('should handle months with different lengths', () => {
      const result = parser.parse('last day of February', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-02-29'); // Leap year
    });

    it('should handle case variations', () => {
      const variations = [
        'First MONDAY in March',
        'LAST day of month',
        'Third WEDNESDAY of March'
      ];
      variations.forEach(input => {
        expect(parser.parse(input, { referenceDate })).not.toBeNull();
      });
    });
  });
}); 