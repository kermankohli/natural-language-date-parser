import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { dateOnlyRule } from '../../src/rules/date-only';
import { DateParsePreferences, Pattern } from '../../src/types/types';

function findPatternForInput(input: string, preferences: DateParsePreferences): { pattern: Pattern; matches: RegExpExecArray } | null {
  const state = registerRule(createParserState(preferences), dateOnlyRule);
  const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
  if (!pattern) return null;
  const matches = pattern.regex.exec(input);
  if (!matches) return null;
  return { pattern, matches };
}

describe('Date Only Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T00:00:00Z');

  test('basic date parsing', () => {
    const input = '2024-03-20';
    const match = findPatternForInput(input, { referenceDate });
    expect(match).toBeTruthy();
    
    const result = match!.pattern.parse(match!.matches, { referenceDate });
    expect(result).toBeTruthy();
    expect(result!.type).toBe('date');
    expect(result!.span).toEqual({ start: 0, end: input.length });
    expect(result!.metadata?.isAbsolute).toBe(true);
    expect(result!.metadata?.originalText).toBe(input);
    expect((result!.value as DateTime).toISO()?.slice(0, 10)).toBe('2024-03-20');

    const input2 = '2024-12-31';
    const match2 = findPatternForInput(input2, { referenceDate });
    expect(match2).toBeTruthy();
    
    const result2 = match2!.pattern.parse(match2!.matches, { referenceDate });
    expect(result2).toBeTruthy();
    expect(result2!.type).toBe('date');
    expect(result2!.span).toEqual({ start: 0, end: input2.length });
    expect(result2!.metadata?.isAbsolute).toBe(true);
    expect(result2!.metadata?.originalText).toBe(input2);
    expect((result2!.value as DateTime).toISO()?.slice(0, 10)).toBe('2024-12-31');

    const input3 = '2025-01-01';
    const match3 = findPatternForInput(input3, { referenceDate });
    expect(match3).toBeTruthy();
    
    const result3 = match3!.pattern.parse(match3!.matches, { referenceDate });
    expect(result3).toBeTruthy();
    expect(result3!.type).toBe('date');
    expect(result3!.span).toEqual({ start: 0, end: input3.length });
    expect(result3!.metadata?.isAbsolute).toBe(true);
    expect(result3!.metadata?.originalText).toBe(input3);
    expect((result3!.value as DateTime).toISO()?.slice(0, 10)).toBe('2025-01-01');
  });

  test('timezone handling', () => {
    const input = '2024-03-20';
    const match = findPatternForInput(input, { referenceDate });
    expect(match).toBeTruthy();
    
    const result = match!.pattern.parse(match!.matches, { referenceDate, timeZone: 'America/New_York' });
    expect(result).toBeTruthy();
    expect(result!.type).toBe('date');
    expect(result!.span).toEqual({ start: 0, end: input.length });
    expect(result!.metadata?.isAbsolute).toBe(true);
    expect(result!.metadata?.originalText).toBe(input);
    expect((result!.value as DateTime).toUTC().toISO()).toBe('2024-03-20T04:00:00.000Z');
  });

  test('invalid dates', () => {
    const invalidInputs = ['2024-13-01', '2024-04-31', '2024-02-30'];
    
    for (const input of invalidInputs) {
      const match = findPatternForInput(input, { referenceDate });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate });
      expect(result).toBeNull();
    }
  });
}); 