import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { ordinalDaysRule } from '../../src/rules/ordinal-days';

describe('Ordinal Days Rule', () => {
  const referenceDate = DateTime.fromISO('2023-03-14T12:00:00Z');

  test('ordinal days of month', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('1st of March'));
    const firstOfMarch = pattern?.parse(pattern.regex.exec('1st of March')!, { referenceDate });
    expect(firstOfMarch?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-01');

    const fifteenthPattern = state.rules[0].patterns.find(p => p.regex.test('15th of March'));
    const fifteenthOfMarch = fifteenthPattern?.parse(fifteenthPattern.regex.exec('15th of March')!, { referenceDate });
    expect(fifteenthOfMarch?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-15');

    const twentyThirdPattern = state.rules[0].patterns.find(p => p.regex.test('23rd of March'));
    const twentyThirdOfMarch = twentyThirdPattern?.parse(twentyThirdPattern.regex.exec('23rd of March')!, { referenceDate });
    expect(twentyThirdOfMarch?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-23');

    const thirtyFirstPattern = state.rules[0].patterns.find(p => p.regex.test('31st of March'));
    const thirtyFirstOfMarch = thirtyFirstPattern?.parse(thirtyFirstPattern.regex.exec('31st of March')!, { referenceDate });
    expect(thirtyFirstOfMarch?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-31');
  });

  test('timezone handling', () => {
    let state = createParserState({
      referenceDate,
      timeZone: 'America/New_York'
    });
    state = registerRule(state, ordinalDaysRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('15th of March'));
    const result = pattern?.parse(pattern.regex.exec('15th of March')!, { referenceDate, timeZone: 'America/New_York' });
    expect(result?.start?.toUTC().toISO()).toBe('2023-03-15T04:00:00.000Z');
  });

  test('ordinal variations', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    const variations = [
      { input: 'first of March', expected: '2023-03-01' },
      { input: '1st of March', expected: '2023-03-01' },
      { input: 'second of March', expected: '2023-03-02' },
      { input: '2nd of March', expected: '2023-03-02' },
      { input: 'third of March', expected: '2023-03-03' },
      { input: '3rd of March', expected: '2023-03-03' },
      { input: 'fourth of March', expected: '2023-03-04' },
      { input: '4th of March', expected: '2023-03-04' }
    ];

    for (const { input, expected } of variations) {
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe(expected);
    }
  });

  test('numeric ordinals', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);

    for (let day = 1; day <= 31; day++) {
      const input = `${day}${getOrdinalSuffix(day)} of March`;
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe(`2023-03-${day.toString().padStart(2, '0')}`);
    }
  });
});

function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 