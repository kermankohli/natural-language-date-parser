import { relativeDatesRule } from '../../src/rules/relative-dates';
import { ParserEngine } from '../../src/parser/parser-engine';

describe('Relative Dates Rule', () => {
  let parser: ParserEngine;
  const referenceDate = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(relativeDatesRule);
  });

  it('should parse today', () => {
    const result = parser.parse('today', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-15');
  });

  it('should parse tomorrow', () => {
    const result = parser.parse('tomorrow', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-16');
  });

  it('should parse yesterday', () => {
    const result = parser.parse('yesterday', { referenceDate });
    expect(result?.start.toISOString().slice(0, 10))
      .toBe('2024-03-14');
  });
}); 