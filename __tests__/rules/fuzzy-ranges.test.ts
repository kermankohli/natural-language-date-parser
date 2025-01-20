import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { fuzzyRangesRule } from '../../src/rules/fuzzy-ranges';

describe('Fuzzy Ranges Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse beginning of period', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const beginningOfYear = parse(state, 'beginning of year');
    expect(beginningOfYear?.type).toBe('range');
    expect(beginningOfYear?.start.toISOString().slice(0, 10)).toBe('2024-01-01');
    expect(beginningOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');

    const beginningOfMonth = parse(state, 'beginning of month');
    expect(beginningOfMonth?.type).toBe('range');
    expect(beginningOfMonth?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
    expect(beginningOfMonth?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
  });

  it('should parse middle of period', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const middleOfYear = parse(state, 'middle of year');
    expect(middleOfYear?.type).toBe('range');
    expect(middleOfYear?.start.toISOString().slice(0, 10)).toBe('2024-05-01');
    expect(middleOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-08-31');

    const middleOfMonth = parse(state, 'middle of month');
    expect(middleOfMonth?.type).toBe('range');
    expect(middleOfMonth?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
    expect(middleOfMonth?.end?.toISOString().slice(0, 10)).toBe('2024-03-20');
  });

  it('should parse end of period', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const endOfYear = parse(state, 'end of year');
    expect(endOfYear?.type).toBe('range');
    expect(endOfYear?.start.toISOString().slice(0, 10)).toBe('2024-09-01');
    expect(endOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-12-31');

    const endOfMonth = parse(state, 'end of month');
    expect(endOfMonth?.type).toBe('range');
    expect(endOfMonth?.start.toISOString().slice(0, 10)).toBe('2024-03-21');
    expect(endOfMonth?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
  });

  it('should handle different period formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    // Test beginning/start variations
    const beginningFormats = [
      'beginning of year',
      'start of year',
      'early year',
      'the beginning of the year',
      'beginning of the year',
      'start of the year',
      'early in the year'
    ];

    beginningFormats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-01-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
    });

    // Test middle variations
    const middleFormats = [
      'middle of year',
      'mid year',
      'mid-year',
      'the middle of the year',
      'middle of the year',
      'mid of year',
      'mid of the year'
    ];

    middleFormats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-05-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-08-31');
    });

    // Test end variations
    const endFormats = [
      'end of year',
      'late year',
      'the end of the year',
      'end of the year',
      'late in the year',
      'year end',
      'year-end'
    ];

    endFormats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-09-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-12-31');
    });

    // Test with different periods
    const periods = ['year', 'month', 'week'];
    const parts = ['beginning', 'middle', 'end'];

    periods.forEach(period => {
      parts.forEach(part => {
        const variations = [
          `${part} of ${period}`,
          `the ${part} of the ${period}`,
          `${part} of the ${period}`,
          `${part} ${period}`,
          period === 'year' ? `${part}-${period}` : null,
          period === 'year' ? `${period}-${part}` : null
        ].filter(Boolean);

        variations.forEach(format => {
          const result = parse(state, format!);
          expect(result?.type).toBe('range');
          expect(result?.start).toBeTruthy();
          expect(result?.end).toBeTruthy();
        });
      });
    });
  });
}); 