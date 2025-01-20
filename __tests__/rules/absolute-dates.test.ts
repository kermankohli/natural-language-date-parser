import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { absoluteDatesRule } from '../../src/rules/absolute-dates';

describe('Absolute Dates Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z');
  
  it('should parse ISO dates', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);

    const result = parse(state, '2024-03-20');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
  });

  it('should parse dates with slashes', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);

    const result = parse(state, '03/20/2024');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-20');
  });

  it('should parse ISO datetime', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);

    const result = parse(state, '2024-03-20T15:30:00Z');
    expect(result?.start.toISOString()).toBe('2024-03-20T15:30:00.000Z');
  });

  it('should handle invalid dates', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);

    expect(parse(state, '2024-13-20')).toBeNull(); // Invalid month
    expect(parse(state, '2024-02-30')).toBeNull(); // Invalid day
  });
}); 