import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { absoluteDatesRule } from '../../src/rules/absolute-dates';
import { DateTime } from 'luxon';

describe('Absolute Dates Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('should parse YYYY-MM-DD format', () => {
    const state = createParserState({});
    const stateWithRule = registerRule(state, absoluteDatesRule);
    const result = parse(stateWithRule, '2024-03-20');
    expect(result).toBeDefined();
    expect((result!.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  test('should parse MM/DD/YYYY format', () => {
    const state = createParserState({});
    const stateWithRule = registerRule(state, absoluteDatesRule);
    const result = parse(stateWithRule, '03/20/2024');
    expect(result).toBeDefined();
    expect((result!.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  test('should parse YYYY-MM-DD HH:mm format', () => {
    const state = createParserState({});
    const stateWithRule = registerRule(state, absoluteDatesRule);
    const result = parse(stateWithRule, '2024-03-20 15:30');
    expect(result).toBeDefined();
    expect((result!.value as DateTime).toUTC().toISO()).toBe('2024-03-20T15:30:00.000Z');
  });

  test('should handle timezone', () => {
    const state = createParserState({ timeZone: 'America/New_York' });
    const stateWithRule = registerRule(state, absoluteDatesRule);
    const result = parse(stateWithRule, '2024-03-20 15:30');
    expect(result).toBeDefined();
    expect((result!.value as DateTime).toUTC().toISO()).toBe('2024-03-20T19:30:00.000Z');
  });

  test('should parse date with pattern', () => {
    const state = createParserState({});
    const stateWithRule = registerRule(state, absoluteDatesRule);
    const input = '2024-03-14';
    const pattern = absoluteDatesRule.patterns[0];
    const matches = pattern.regex.exec(input);

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect(result?.metadata?.dateType).toBe('absolute');
      
      const value = result?.value as DateTime;
      expect(value.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-14');
      
      expect(result?.metadata?.originalText).toBe(input);
    }
  });
}); 