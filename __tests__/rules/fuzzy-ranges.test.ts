import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { fuzzyRangesRule } from '../../src/rules/fuzzy-ranges';
import { DateParsePreferences, Pattern } from '../../src/types/types';

function findPatternForInput(input: string, preferences: DateParsePreferences): { pattern: Pattern; matches: RegExpExecArray } | null {
  const state = registerRule(createParserState(preferences), fuzzyRangesRule);
  const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
  if (!pattern) return null;
  const matches = pattern.regex.exec(input);
  if (!matches) return null;
  return { pattern, matches };
}

describe('Fuzzy Ranges Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('beginning of year/month', () => {
    const yearInput = 'beginning of the year';
    const yearMatch = findPatternForInput(yearInput, { referenceDate });
    expect(yearMatch).toBeTruthy();
    
    const yearResult = yearMatch!.pattern.parse(yearMatch!.matches, { referenceDate });
    expect(yearResult).toBeTruthy();
    expect(yearResult!.type).toBe('range');
    expect(yearResult!.span).toEqual({ start: 0, end: yearInput.length });
    expect(yearResult!.metadata?.isFuzzyRange).toBe(true);
    expect(yearResult!.metadata?.originalText).toBe(yearInput);
    expect((yearResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-01');
    expect((yearResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');

    const monthInput = 'beginning of the month';
    const monthMatch = findPatternForInput(monthInput, { referenceDate });
    expect(monthMatch).toBeTruthy();
    
    const monthResult = monthMatch!.pattern.parse(monthMatch!.matches, { referenceDate });
    expect(monthResult).toBeTruthy();
    expect(monthResult!.type).toBe('range');
    expect(monthResult!.span).toEqual({ start: 0, end: monthInput.length });
    expect(monthResult!.metadata?.isFuzzyRange).toBe(true);
    expect(monthResult!.metadata?.originalText).toBe(monthInput);
    expect((monthResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-01');
    expect((monthResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
  });

  test('middle of year/month', () => {
    const yearInput = 'middle of the year';
    const yearMatch = findPatternForInput(yearInput, { referenceDate });
    expect(yearMatch).toBeTruthy();
    
    const yearResult = yearMatch!.pattern.parse(yearMatch!.matches, { referenceDate });
    expect(yearResult).toBeTruthy();
    expect(yearResult!.type).toBe('range');
    expect(yearResult!.span).toEqual({ start: 0, end: yearInput.length });
    expect(yearResult!.metadata?.isFuzzyRange).toBe(true);
    expect(yearResult!.metadata?.originalText).toBe(yearInput);
    expect((yearResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-05-01');
    expect((yearResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-08-31');

    const monthInput = 'middle of the month';
    const monthMatch = findPatternForInput(monthInput, { referenceDate });
    expect(monthMatch).toBeTruthy();
    
    const monthResult = monthMatch!.pattern.parse(monthMatch!.matches, { referenceDate });
    expect(monthResult).toBeTruthy();
    expect(monthResult!.type).toBe('range');
    expect(monthResult!.span).toEqual({ start: 0, end: monthInput.length });
    expect(monthResult!.metadata?.isFuzzyRange).toBe(true);
    expect(monthResult!.metadata?.originalText).toBe(monthInput);
    expect((monthResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect((monthResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  test('end of year/month', () => {
    const yearInput = 'end of the year';
    const yearMatch = findPatternForInput(yearInput, { referenceDate });
    expect(yearMatch).toBeTruthy();
    
    const yearResult = yearMatch!.pattern.parse(yearMatch!.matches, { referenceDate });
    expect(yearResult).toBeTruthy();
    expect(yearResult!.type).toBe('range');
    expect(yearResult!.span).toEqual({ start: 0, end: yearInput.length });
    expect(yearResult!.metadata?.isFuzzyRange).toBe(true);
    expect(yearResult!.metadata?.originalText).toBe(yearInput);
    expect((yearResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-09-01');
    expect((yearResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-12-31');

    const monthInput = 'end of the month';
    const monthMatch = findPatternForInput(monthInput, { referenceDate });
    expect(monthMatch).toBeTruthy();
    
    const monthResult = monthMatch!.pattern.parse(monthMatch!.matches, { referenceDate });
    expect(monthResult).toBeTruthy();
    expect(monthResult!.type).toBe('range');
    expect(monthResult!.span).toEqual({ start: 0, end: monthInput.length });
    expect(monthResult!.metadata?.isFuzzyRange).toBe(true);
    expect(monthResult!.metadata?.originalText).toBe(monthInput);
    expect((monthResult!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-21');
    expect((monthResult!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
  });

  test('format variations', () => {
    const yearVariations = [
      'beginning of the year',
      'beginning of year',
      'start of the year',
      'start of year'
    ];

    for (const input of yearVariations) {
      const match = findPatternForInput(input, { referenceDate });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate });
      expect(result).toBeTruthy();
      expect(result!.type).toBe('range');
      expect(result!.span).toEqual({ start: 0, end: input.length });
      expect(result!.metadata?.isFuzzyRange).toBe(true);
      expect(result!.metadata?.originalText).toBe(input);
      expect((result!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-01');
      expect((result!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
    }

    const monthVariations = [
      'middle of the month',
      'middle of month',
      'mid month',
      'mid-month'
    ];

    for (const input of monthVariations) {
      const match = findPatternForInput(input, { referenceDate });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate });
      expect(result).toBeTruthy();
      expect(result!.type).toBe('range');
      expect(result!.span).toEqual({ start: 0, end: input.length });
      expect(result!.metadata?.isFuzzyRange).toBe(true);
      expect(result!.metadata?.originalText).toBe(input);
      expect((result!.value as any).start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
      expect((result!.value as any).end.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
    }
  });

  describe('weekend parsing', () => {
    test('this weekend', () => {
      const input = 'this weekend';
      const match = findPatternForInput(input, { referenceDate });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate });
      expect(result).toBeTruthy();
      expect(result!.type).toBe('range');
      expect(result!.span).toEqual({ start: 0, end: input.length });
      expect(result!.metadata?.isFuzzyRange).toBe(true);
      expect(result!.metadata?.originalText).toBe(input);
      expect((result!.value as any).start.toISO()?.slice(0, 10)).toBe('2024-03-16');
      expect((result!.value as any).end.toISO()?.slice(0, 10)).toBe('2024-03-17');
    });

    test('next weekend', () => {
      const input = 'next weekend';
      const match = findPatternForInput(input, { referenceDate });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate });
      expect(result).toBeTruthy();
      expect(result!.type).toBe('range');
      expect(result!.span).toEqual({ start: 0, end: input.length });
      expect(result!.metadata?.isFuzzyRange).toBe(true);
      expect(result!.metadata?.originalText).toBe(input);
      expect((result!.value as any).start.toISO()?.slice(0, 10)).toBe('2024-03-23');
      expect((result!.value as any).end.toISO()?.slice(0, 10)).toBe('2024-03-24');
    });

    test('weekends in New York timezone', () => {
      const input = 'this weekend';
      const match = findPatternForInput(input, { referenceDate, timeZone: 'America/New_York' });
      expect(match).toBeTruthy();
      
      const result = match!.pattern.parse(match!.matches, { referenceDate, timeZone: 'America/New_York' });
      expect(result).toBeTruthy();
      expect(result!.type).toBe('range');
      expect(result!.span).toEqual({ start: 0, end: input.length });
      expect(result!.metadata?.isFuzzyRange).toBe(true);
      expect(result!.metadata?.originalText).toBe(input);
      expect((result!.value as any).start.toISO()).toBe('2024-03-16T00:00:00.000+08:00');
      expect((result!.value as any).end.toISO()).toBe('2024-03-17T23:59:59.999+08:00');

      const nextInput = 'next weekend';
      const nextMatch = findPatternForInput(nextInput, { referenceDate, timeZone: 'America/New_York' });
      expect(nextMatch).toBeTruthy();
      
      const nextResult = nextMatch!.pattern.parse(nextMatch!.matches, { referenceDate, timeZone: 'America/New_York' });
      expect(nextResult).toBeTruthy();
      expect(nextResult!.type).toBe('range');
      expect(nextResult!.span).toEqual({ start: 0, end: nextInput.length });
      expect(nextResult!.metadata?.isFuzzyRange).toBe(true);
      expect(nextResult!.metadata?.originalText).toBe(nextInput);
      expect((nextResult!.value as any).start.toISO()).toBe('2024-03-23T00:00:00.000+08:00');
      expect((nextResult!.value as any).end.toISO()).toBe('2024-03-24T23:59:59.999+08:00');
    });
  });
}); 