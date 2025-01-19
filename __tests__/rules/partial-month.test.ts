import { partialMonthRule } from '../../src/rules/partial-month';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Partial Month Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(partialMonthRule);
  });

  describe('basic parsing', () => {
    it('should parse early month', () => {
      const result = parser.parse('early March', { referenceDate });
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
    });

    it('should parse mid month', () => {
      const result = parser.parse('mid March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse late month', () => {
      const result = parser.parse('late March', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-21');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
    });
  });

  describe('edge cases', () => {
    it('should handle months with different lengths', () => {
      const result = parser.parse('late February', { referenceDate });
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-02-21');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-02-29');
    });

    it('should handle case variations', () => {
      const variations = [
        'EARLY March',
        'mid MARCH',
        'Late march'
      ];
      variations.forEach(input => {
        expect(parser.parse(input, { referenceDate })).not.toBeNull();
      });
    });
  });
}); 