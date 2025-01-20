import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { relativeWeeksRule } from '../../src/rules/relative-weeks';

describe('Relative Weeks Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse this week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const result = parse(state, 'this week');
    expect(result?.type).toBe('range');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
    expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-17');
  });

  it('should parse next week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const result = parse(state, 'next week');
    expect(result?.type).toBe('range');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-18');
    expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-24');
  });

  it('should parse last week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const result = parse(state, 'last week');
    expect(result?.type).toBe('range');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-04');
    expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
  });

  it('should respect week start preference', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 1 }); // Monday
    state = registerRule(state, relativeWeeksRule);

    const mondayStart = parse(state, 'this week');
    expect(mondayStart?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
    expect(mondayStart?.end?.toISOString().slice(0, 10)).toBe('2024-03-17');

    state = createParserState({ referenceDate, weekStartsOn: 0 }); // Sunday
    state = registerRule(state, relativeWeeksRule);

    const sundayStart = parse(state, 'this week');
    expect(sundayStart?.start.toISOString().slice(0, 10)).toBe('2024-03-10');
    expect(sundayStart?.end?.toISOString().slice(0, 10)).toBe('2024-03-16');
  });
}); 