import { absoluteDatesRule } from '../../src/rules/absolute-dates';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Absolute Dates Rule', () => {
  let parser: ParserEngine;

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(absoluteDatesRule);
  });

  describe('ISO format dates', () => {
    it('should parse standard ISO format (YYYY-MM-DD)', () => {
      const result = parser.parse('2024-03-20');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse basic ISO format (YYYYMMDD)', () => {
      const result = parser.parse('20240320');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });
  });

  describe('slash-separated dates', () => {
    it('should parse YMD format (YYYY/MM/DD)', () => {
      const result = parser.parse('2024/03/20');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse MDY format (MM/DD/YYYY)', () => {
      const result = parser.parse('03/20/2024');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse DMY format (DD/MM/YYYY)', () => {
      const result = parser.parse('20/03/2024');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });
  });

  describe('dot-separated dates', () => {
    it('should parse YMD format (YYYY.MM.DD)', () => {
      const result = parser.parse('2024.03.20');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse DMY format (DD.MM.YYYY)', () => {
      const result = parser.parse('20.03.2024');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });
  });

  describe('dash-separated dates', () => {
    it('should parse YMD format (YYYY-MM-DD)', () => {
      const result = parser.parse('2024-03-20');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse MDY format (MM-DD-YYYY)', () => {
      const result = parser.parse('03-20-2024');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });

    it('should parse DMY format (DD-MM-YYYY)', () => {
      const result = parser.parse('20-03-2024');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle month boundaries', () => {
      expect(parser.parse('2024-01-01')?.start.toISOString().slice(0, 10)).toBe('2024-01-01');
      expect(parser.parse('2024-12-31')?.start.toISOString().slice(0, 10)).toBe('2024-12-31');
    });

    it('should validate month lengths', () => {
      expect(parser.parse('2024-04-31')).toBeNull();  // April has 30 days
      expect(parser.parse('2024-06-31')).toBeNull();  // June has 30 days
      expect(parser.parse('2024-09-31')).toBeNull();  // September has 30 days
      expect(parser.parse('2024-11-31')).toBeNull();  // November has 30 days
    });

    it('should handle leap years', () => {
      expect(parser.parse('2024-02-29')?.start.toISOString().slice(0, 10)).toBe('2024-02-29');
      expect(parser.parse('2023-02-29')).toBeNull();  // Not a leap year
      expect(parser.parse('2000-02-29')?.start.toISOString().slice(0, 10)).toBe('2000-02-29');  // Century leap year
      expect(parser.parse('2100-02-29')).toBeNull();  // Century non-leap year
    });

    it('should handle special years', () => {
      expect(parser.parse('0000-01-01')).toBeNull();  // Year 0 doesn't exist
      expect(parser.parse('1000-01-01')?.start.toISOString().slice(0, 10)).toBe('1000-01-01');
      expect(parser.parse('9999-12-31')?.start.toISOString().slice(0, 10)).toBe('9999-12-31');
    });
  });

  describe('invalid formats', () => {
    it('should reject mixed separators', () => {
      expect(parser.parse('2024-03/20')).toBeNull();
      expect(parser.parse('2024/03-20')).toBeNull();
    });

    it('should reject invalid characters', () => {
      expect(parser.parse('2024-O3-20')).toBeNull();  // Letter O instead of zero
      expect(parser.parse('2024-03-2O')).toBeNull();  // Letter O instead of zero
    });

    it('should reject missing leading zeros', () => {
      expect(parser.parse('2024-3-20')).toBeNull();
      expect(parser.parse('2024-03-2')).toBeNull();
    });

    it('should reject out of range values', () => {
      expect(parser.parse('2024-00-20')).toBeNull();  // Month 0
      expect(parser.parse('2024-13-20')).toBeNull();  // Month 13
      expect(parser.parse('2024-03-00')).toBeNull();  // Day 0
      expect(parser.parse('2024-03-32')).toBeNull();  // Day 32
    });
  });

  describe('confidence levels', () => {
    it('should have maximum confidence for unambiguous formats', () => {
      const result = parser.parse('2024-03-20');
      expect(result?.confidence).toBe(1.0);
    });
  });

  describe('Month name formats', () => {
    it('should parse month-first format with full month names', () => {
      const variations = [
        'January 5, 2025',
        'January 5 2025',
        'January 5th, 2025',
        'January 5th 2025'
      ];
      variations.forEach(input => {
        const result = parser.parse(input);
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2025-01-05');
      });
    });

    it('should parse month-first format with abbreviated month names', () => {
      const variations = [
        'Jan 5, 2025',
        'Jan 5 2025',
        'Jan 5th, 2025',
        'Jan 5th 2025'
      ];
      variations.forEach(input => {
        const result = parser.parse(input);
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2025-01-05');
      });
    });

    it('should parse day-first format', () => {
      const variations = [
        '5 January 2025',
        '5th January 2025',
        '5 Jan 2025',
        '5th Jan 2025'
      ];
      variations.forEach(input => {
        const result = parser.parse(input);
        expect(result?.start.toISOString().slice(0, 10))
          .toBe('2025-01-05');
      });
    });

    it('should use current year when year is omitted', () => {
      const currentYear = new Date().getFullYear();
      const variations = [
        'January 5',
        'Jan 5',
        '5 January',
        '5th Jan'
      ];
      variations.forEach(input => {
        const result = parser.parse(input);
        expect(result?.start.toISOString().slice(0, 10))
          .toBe(`${currentYear}-01-05`);
      });
    });
  });
}); 