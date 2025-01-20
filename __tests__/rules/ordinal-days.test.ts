import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { ordinalDaysRule } from '../../src/rules/ordinal-days';

describe('Ordinal Days Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse ordinal days of month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    const firstOfMarch = parse(state, '1st of March');
    expect(firstOfMarch?.start.toISOString().slice(0, 10)).toBe('2024-03-01');

    const fifteenthOfMarch = parse(state, '15th of March');
    expect(fifteenthOfMarch?.start.toISOString().slice(0, 10)).toBe('2024-03-15');
  });

  it('should handle different ordinal formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    const formats = [
      '1st of March',
      'March 1st',
      'the 1st of March',
      '1st March'
    ];

    formats.forEach(format => {
      const result = parse(state, format);
      expect(result?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
    });
  });

  it('should handle invalid dates', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    expect(parse(state, '31st of February')).toBeNull();
    expect(parse(state, '32nd of March')).toBeNull();
  });

  it('should handle different month formats', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    const fullName = parse(state, '15th of March');
    expect(fullName?.start.toISOString().slice(0, 10)).toBe('2024-03-15');

    const abbreviated = parse(state, '15th of Mar');
    expect(abbreviated?.start.toISOString().slice(0, 10)).toBe('2024-03-15');
  });
}); 