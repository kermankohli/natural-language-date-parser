import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { absoluteDatesRule } from '../../src/rules/absolute-dates';
import { DateTime } from 'luxon';

describe('Absolute Dates Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  it('should parse ISO dates', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);
    const result = parse(state, '2024-03-20');

    expect(result?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  it('should parse dates with slashes', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);
    const result = parse(state, '03/20/2024');

    expect(result?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  it('should parse dates with times', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);
    const result = parse(state, '2024-03-20 15:30');

    expect(result?.start.toUTC().toISO()).toBe('2024-03-20T15:30:00.000Z');
  });

  it('should parse dates with timezones', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, absoluteDatesRule);
    const result = parse(state, '2024-03-20 15:30 +0200');

    expect(result?.start.toUTC().toISO()).toBe('2024-03-20T13:30:00.000Z');
  });
}); 