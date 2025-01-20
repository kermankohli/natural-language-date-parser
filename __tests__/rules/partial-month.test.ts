import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { partialMonthRule } from '../../src/rules/partial-month';

describe('Partial Month Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse early/mid/late month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, partialMonthRule);

    const early = parse(state, 'early March');
    expect(early?.type).toBe('range');
    expect(early?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
    expect(early?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');

    const mid = parse(state, 'mid March');
    expect(mid?.type).toBe('range');
    expect(mid?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
    expect(mid?.end?.toISOString().slice(0, 10)).toBe('2024-03-20');

    const late = parse(state, 'late March');
    expect(late?.type).toBe('range');
    expect(late?.start.toISOString().slice(0, 10)).toBe('2024-03-21');
    expect(late?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
  });

  it('should handle different month formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, partialMonthRule);

    const fullName = parse(state, 'early March');
    const abbreviated = parse(state, 'early Mar');

    expect(fullName?.start.toISOString().slice(0, 10))
      .toBe(abbreviated?.start.toISOString().slice(0, 10));
    expect(fullName?.end?.toISOString().slice(0, 10))
      .toBe(abbreviated?.end?.toISOString().slice(0, 10));
  });

  it('should handle different part formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, partialMonthRule);

    const formats = [
      'early March',
      'beginning of March',
      'start of March'
    ];

    formats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
    });
  });
}); 