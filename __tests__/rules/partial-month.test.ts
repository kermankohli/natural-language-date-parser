import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { partialMonthRule } from '../../src/rules/partial-month';

describe('Partial Month Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('early/mid/late month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, partialMonthRule);

    const earlyPattern = state.rules[0].patterns.find(p => p.regex.test('early March'));
    const early = earlyPattern?.parse(earlyPattern.regex.exec('early March')!, { referenceDate });
    expect(early?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-01');
    expect(early?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');

    const midPattern = state.rules[0].patterns.find(p => p.regex.test('mid March'));
    const mid = midPattern?.parse(midPattern.regex.exec('mid March')!, { referenceDate });
    expect(mid?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect(mid?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');

    const latePattern = state.rules[0].patterns.find(p => p.regex.test('late March'));
    const late = latePattern?.parse(latePattern.regex.exec('late March')!, { referenceDate });
    expect(late?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-21');
    expect(late?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
  });

  test('month format variations', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, partialMonthRule);

    const variations = [
      { input: 'early March', expected: '2024-03-01' },
      { input: 'early Mar', expected: '2024-03-01' },
      { input: 'early MARCH', expected: '2024-03-01' },
      { input: 'early march', expected: '2024-03-01' }
    ];

    for (const { input, expected } of variations) {
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe(expected);
    }
  });

  test('timezone handling', () => {
    let state = createParserState({
      referenceDate,
      timeZone: 'America/New_York'
    });
    state = registerRule(state, partialMonthRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('early March'));
    const result = pattern?.parse(pattern.regex.exec('early March')!, { referenceDate, timeZone: 'America/New_York' });
    expect(result?.start?.toUTC().toISO()).toBe('2024-03-01T05:00:00.000Z');
  });
}); 