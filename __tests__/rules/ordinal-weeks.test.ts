import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { ordinalWeeksRule } from '../../src/rules/ordinal-weeks';

describe('Ordinal Weeks Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('first week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('first week of March'));
    const result = pattern?.parse(pattern.regex.exec('first week of March')!, { referenceDate });
    expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
  });

  test('last week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('last week of March'));
    const result = pattern?.parse(pattern.regex.exec('last week of March')!, { referenceDate });
    expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-25');
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
  });

  test('ordinal variations', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, ordinalWeeksRule);

    const variations = [
      { input: 'first week of March', expected: '2024-03-04' },
      { input: '1st week of March', expected: '2024-03-04' },
      { input: 'second week of March', expected: '2024-03-11' },
      { input: '2nd week of March', expected: '2024-03-11' }
    ];

    for (const { input, expected } of variations) {
      const pattern = state.rules[0].patterns.find(p => p.regex.test(input));
      const result = pattern?.parse(pattern.regex.exec(input)!, { referenceDate });
      expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe(expected);
    }
  });

  test('week start preferences', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 1 }); // Monday
    state = registerRule(state, ordinalWeeksRule);

    let pattern = state.rules[0].patterns.find(p => p.regex.test('first week of March'));
    const mondayStart = pattern?.parse(pattern.regex.exec('first week of March')!, { referenceDate, weekStartsOn: 1 });
    expect(mondayStart?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
    expect(mondayStart?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');

    state = createParserState({ referenceDate, weekStartsOn: 0 }); // Sunday
    state = registerRule(state, ordinalWeeksRule);

    const sundayStart = pattern?.parse(pattern.regex.exec('first week of March')!, { referenceDate, weekStartsOn: 0 });
    expect(sundayStart?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-03');
    expect(sundayStart?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-09');
  });
}); 