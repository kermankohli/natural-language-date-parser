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
    expect(result?.start.toISO()?.slice(0, 10)).toBe('2024-03-10');
    expect(result?.end?.toISO()?.slice(0, 10)).toBe('2024-03-16');
  });

  test('next week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('next week'));
    const result = pattern?.parse(pattern.regex.exec('next week')!, { referenceDate });
    expect(result?.start?.toISO()?.slice(0, 10)).toBe('2024-03-17');
    expect(result?.end?.toISO()?.slice(0, 10)).toBe('2024-03-23');
  });

  test('last week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('last week'));
    const result = pattern?.parse(pattern.regex.exec('last week')!, { referenceDate });
    expect(result?.start?.toISO()?.slice(0, 10)).toBe('2024-03-03');
    expect(result?.end?.toISO()?.slice(0, 10)).toBe('2024-03-09');
  });

  test('week start preferences', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 0 }); // Monday
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const mondayStart = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 0 });
    expect(mondayStart?.start?.toISO()?.slice(0, 10)).toBe('2024-03-10');
    expect(mondayStart?.end?.toISO()?.slice(0, 10)).toBe('2024-03-16');

    state = createParserState({ referenceDate, weekStartsOn: 6 }); // Sunday
    state = registerRule(state, relativeWeeksRule);

    const sundayStart = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 6 });
    expect(sundayStart?.start?.toISO()?.slice(0, 10)).toBe('2024-03-09');
    expect(sundayStart?.end?.toISO()?.slice(0, 10)).toBe('2024-03-15');
  });

  test('upcoming week behavior', () => {
    let state = createParserState({ referenceDate }); // Thursday
    state = registerRule(state, relativeWeeksRule);

    // On Thursday, "upcoming week" should mean next week
    const pattern = state.rules[0].patterns.find(p => p.regex.test('upcoming week'));
    const result = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate });
    expect(result?.start?.toISO()?.slice(0, 10)).toBe('2024-03-17'); // Start of next week
    expect(result?.end?.toISO()?.slice(0, 10)).toBe('2024-03-23'); // End of next week

    // Test when we're early in the week (Monday)
    const mondayRef = DateTime.fromISO('2024-03-11T12:00:00Z');
    const mondayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: mondayRef });
    expect(mondayResult?.start?.toISO()?.slice(0, 10)).toBe('2024-03-17'); // Should be next week
    expect(mondayResult?.end?.toISO()?.slice(0, 10)).toBe('2024-03-23');

    // Test when we're mid-week (Wednesday)
    const wednesdayRef = DateTime.fromISO('2024-03-13T12:00:00Z');
    const wednesdayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: wednesdayRef });
    expect(wednesdayResult?.start?.toISO()?.slice(0, 10)).toBe('2024-03-17'); // Should be next week
    expect(wednesdayResult?.end?.toISO()?.slice(0, 10)).toBe('2024-03-23');

    // Test when we're late in the week (Friday)
    const fridayRef = DateTime.fromISO('2024-03-15T12:00:00Z');
    const fridayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: fridayRef });
    expect(fridayResult?.start?.toISO()?.slice(0, 10)).toBe('2024-03-17'); // Should be next week
    expect(fridayResult?.end?.toISO()?.slice(0, 10)).toBe('2024-03-23');
  });
}); 