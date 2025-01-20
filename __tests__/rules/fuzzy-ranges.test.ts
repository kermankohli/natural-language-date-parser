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
    expect(beginningOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-01-10');

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
    expect(middleOfYear?.start.toISOString().slice(0, 10)).toBe('2024-06-11');
    expect(middleOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-06-20');

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
    expect(endOfYear?.start.toISOString().slice(0, 10)).toBe('2024-12-21');
    expect(endOfYear?.end?.toISOString().slice(0, 10)).toBe('2024-12-31');

    const endOfMonth = parse(state, 'end of month');
    expect(endOfMonth?.type).toBe('range');
    expect(endOfMonth?.start.toISOString().slice(0, 10)).toBe('2024-03-21');
    expect(endOfMonth?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
  });

  it('should handle different period formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const formats = [
      'beginning of year',
      'start of year',
      'early year',
      'the beginning of the year'
    ];

    formats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-01-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-01-10');
    });
  });
}); 