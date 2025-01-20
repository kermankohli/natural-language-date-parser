import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { ordinalWeeksRule } from '../../src/rules/ordinal-weeks';

describe('Ordinal Weeks Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse first week of month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const result = parse(state, 'first week of March');
    expect(result?.type).toBe('range');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-04');
    expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
  });

  it('should parse last week of month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const result = parse(state, 'last week of March');
    expect(result?.type).toBe('range');
    expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-25');
    expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
  });

  it('should handle different ordinal formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const formats = [
      'first week of March',
      'the first week of March',
      '1st week of March'
    ];

    formats.forEach(format => {
      const result = parse(state, format);
      expect(result?.type).toBe('range');
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-04');
      expect(result?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');
    });
  });

  it('should handle different month formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const fullName = parse(state, 'first week of March');
    const abbreviated = parse(state, 'first week of Mar');

    expect(fullName?.start.toISOString().slice(0, 10))
      .toBe(abbreviated?.start.toISOString().slice(0, 10));
    expect(fullName?.end?.toISOString().slice(0, 10))
      .toBe(abbreviated?.end?.toISOString().slice(0, 10));
  });

  it('should respect week start preference', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 1 }); // Monday
    state = registerRule(state, ordinalWeeksRule);

    const mondayStart = parse(state, 'first week of March');
    expect(mondayStart?.start.toISOString().slice(0, 10)).toBe('2024-03-04');
    expect(mondayStart?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');

    state = createParserState({ referenceDate, weekStartsOn: 0 }); // Sunday
    state = registerRule(state, ordinalWeeksRule);

    const sundayStart = parse(state, 'first week of March');
    expect(sundayStart?.start.toISOString().slice(0, 10)).toBe('2024-03-03');
    expect(sundayStart?.end?.toISOString().slice(0, 10)).toBe('2024-03-09');
  });
}); 