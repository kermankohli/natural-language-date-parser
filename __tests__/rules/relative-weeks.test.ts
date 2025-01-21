import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { relativeWeeksRule } from '../../src/rules/relative-weeks';

describe('Relative Weeks Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('this week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const result = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate });
    expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-17');
  });

  test('next week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('next week'));
    const result = pattern?.parse(pattern.regex.exec('next week')!, { referenceDate });
    expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-18');
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-24');
  });

  test('last week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('last week'));
    const result = pattern?.parse(pattern.regex.exec('last week')!, { referenceDate });
    expect(result?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
    expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
  });

  test('week start preferences', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 1 }); // Monday
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const mondayStart = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 1 });
    expect(mondayStart?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
    expect(mondayStart?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');

    state = createParserState({ referenceDate, weekStartsOn: 0 }); // Sunday
    state = registerRule(state, relativeWeeksRule);

    const sundayStart = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 0 });
    expect(sundayStart?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-03');
    expect(sundayStart?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-09');
  });
}); 