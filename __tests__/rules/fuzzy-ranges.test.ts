import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { fuzzyRangesRule } from '../../src/rules/fuzzy-ranges';

describe('Fuzzy Ranges Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('beginning of year/month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const yearPattern = state.rules[0].patterns.find(p => p.regex.test('beginning of the year'));
    const beginningOfYear = yearPattern?.parse(yearPattern.regex.exec('beginning of the year')!, { referenceDate });
    expect(beginningOfYear?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-01');
    expect(beginningOfYear?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');

    const monthPattern = state.rules[0].patterns.find(p => p.regex.test('beginning of the month'));
    const beginningOfMonth = monthPattern?.parse(monthPattern.regex.exec('beginning of the month')!, { referenceDate });
    expect(beginningOfMonth?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-01');
    expect(beginningOfMonth?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
  });

  test('middle of year/month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const yearPattern = state.rules[0].patterns.find(p => p.regex.test('middle of the year'));
    const middleOfYear = yearPattern?.parse(yearPattern.regex.exec('middle of the year')!, { referenceDate });
    expect(middleOfYear?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-05-01');
    expect(middleOfYear?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-08-31');

    const monthPattern = state.rules[0].patterns.find(p => p.regex.test('middle of the month'));
    const middleOfMonth = monthPattern?.parse(monthPattern.regex.exec('middle of the month')!, { referenceDate });
    expect(middleOfMonth?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect(middleOfMonth?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
  });

  test('end of year/month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const yearPattern = state.rules[0].patterns.find(p => p.regex.test('end of the year'));
    const endOfYear = yearPattern?.parse(yearPattern.regex.exec('end of the year')!, { referenceDate });
    expect(endOfYear?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-09-01');
    expect(endOfYear?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-12-31');

    const monthPattern = state.rules[0].patterns.find(p => p.regex.test('end of the month'));
    const endOfMonth = monthPattern?.parse(monthPattern.regex.exec('end of the month')!, { referenceDate });
    expect(endOfMonth?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-21');
    expect(endOfMonth?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
  });

  test('format variations', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, fuzzyRangesRule);

    const yearVariations = [
      'beginning of the year',
      'beginning of year',
      'start of the year',
      'start of year'
    ];

    for (const input of yearVariations) {
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-01');
      expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
    }

    const monthVariations = [
      'middle of the month',
      'middle of month',
      'mid month',
      'mid-month'
    ];

    for (const input of monthVariations) {
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
      expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
    }
  });
}); 