import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { relativeDaysRule } from '../../src/rules/relative-days';

describe('Relative Days Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  it('should parse today/tomorrow/yesterday', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeDaysRule);

    const today = parse(state, 'today');
    expect(today?.start.toISOString().slice(0, 10)).toBe('2024-03-14');

    const tomorrow = parse(state, 'tomorrow');
    expect(tomorrow?.start.toISOString().slice(0, 10)).toBe('2024-03-15');

    const yesterday = parse(state, 'yesterday');
    expect(yesterday?.start.toISOString().slice(0, 10)).toBe('2024-03-13');
  });

  it('should parse X days ago/from now', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeDaysRule);

    const threeDaysAgo = parse(state, '3 days ago');
    expect(threeDaysAgo?.start.toISOString().slice(0, 10)).toBe('2024-03-11');

    const threeDaysFromNow = parse(state, '3 days from now');
    expect(threeDaysFromNow?.start.toISOString().slice(0, 10)).toBe('2024-03-17');
  });

  it('should handle invalid inputs', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeDaysRule);

    expect(parse(state, '0 days ago')).toBeNull();
    expect(parse(state, '-3 days ago')).toBeNull();
  });
}); 