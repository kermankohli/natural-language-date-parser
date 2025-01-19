import { relativeDaysRule } from '../../src/rules/relative-days';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Relative Days Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(relativeDaysRule);
  });

  it('should parse today', () => {
    const result = parser.parse('today', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-15');
  });

  it('should parse tomorrow variations', () => {
    const variations = ['tomorrow', 'the day after today'];
    variations.forEach(input => {
      const result = parser.parse(input, { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-16');
    });
  });

  it('should parse yesterday variations', () => {
    const variations = ['yesterday', 'the day before today'];
    variations.forEach(input => {
      const result = parser.parse(input, { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-14');
    });
  });

  it('should parse day after tomorrow variations', () => {
    const variations = ['the day after tomorrow', '2 days from now', '2 days from today'];
    variations.forEach(input => {
      const result = parser.parse(input, { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-17');
    });
  });

  it('should parse day before yesterday variations', () => {
    const variations = ['the day before yesterday', '2 days ago'];
    variations.forEach(input => {
      const result = parser.parse(input, { referenceDate });
      expect(result?.start.toISOString().slice(0, 10))
        .toBe('2024-03-13');
    });
  });

  it('should parse N days from now', () => {
    const result = parser.parse('5 days from now', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-20');
  });

  it('should parse N days from today', () => {
    const result = parser.parse('5 days from today', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-20');
  });
}); 