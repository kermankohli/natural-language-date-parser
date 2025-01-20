import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { timeOnlyRule } from '../../src/rules/time-only';

describe('Time Only Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z');

  it('should parse simple time expressions', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeOnlyRule);

    const result = parse(state, 'at 3:30 PM');
    expect(result?.type).toBe('single');
    expect(result?.start.getUTCHours()).toBe(15);
    expect(result?.start.getUTCMinutes()).toBe(30);
  });

  it('should parse special times', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeOnlyRule);

    const noon = parse(state, 'at noon');
    expect(noon?.start.getUTCHours()).toBe(12);
    expect(noon?.start.getUTCMinutes()).toBe(0);

    const midnight = parse(state, 'at midnight');
    expect(midnight?.start.getUTCHours()).toBe(0);
    expect(midnight?.start.getUTCMinutes()).toBe(0);
  });

  it('should handle 12-hour format', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeOnlyRule);

    const am = parse(state, 'at 9:30 AM');
    expect(am?.start.getUTCHours()).toBe(9);
    expect(am?.start.getUTCMinutes()).toBe(30);

    const pm = parse(state, 'at 9:30 PM');
    expect(pm?.start.getUTCHours()).toBe(21);
    expect(pm?.start.getUTCMinutes()).toBe(30);
  });

  it('should handle 24-hour format', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeOnlyRule);

    const result = parse(state, 'at 15:30');
    expect(result?.start.getUTCHours()).toBe(15);
    expect(result?.start.getUTCMinutes()).toBe(30);
  });

  it('should handle invalid times', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, timeOnlyRule);

    expect(parse(state, 'at 25:00')).toBeNull();
    expect(parse(state, 'at 12:60')).toBeNull();
    expect(parse(state, 'at 13:00 PM')).toBeNull();
  });
}); 