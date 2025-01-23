import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { relativeWeeksRule } from '../../src/rules/relative-weeks';
import { DateParsePreferences } from '../../src/types/types';

describe('Relative Weeks Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('this week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const result = pattern?.parse(pattern.regex.exec('this week')!, { referenceDate, debug: true });
    expect(result?.type).toBe('range');
    expect((result?.value as any).start.toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect((result?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-17');
  });

  test('next week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('next week'));
    const result = pattern?.parse(pattern.regex.exec('next week')!, { referenceDate });
    expect(result?.type).toBe('range');
    expect((result?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-18');
    expect((result?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-24');
  });

  test('last week', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('last week'));
    const result = pattern?.parse(pattern.regex.exec('last week')!, { referenceDate });
    expect(result?.type).toBe('range');
    expect((result?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-04');
    expect((result?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-10');
  });

  test('week start configuration', () => {
    let state = createParserState({ referenceDate, weekStartsOn: 1 }); // Monday
    state = registerRule(state, relativeWeeksRule);

    const mondayPattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const mondayStart = mondayPattern?.parse(mondayPattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 1 });

    expect((mondayStart?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-11');
    expect((mondayStart?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-17');

    state = createParserState({ referenceDate, weekStartsOn: 0 }); // Sunday
    state = registerRule(state, relativeWeeksRule);

    const sundayPattern = state.rules[0].patterns.find(p => p.regex.test('this week'));
    const sundayStart = sundayPattern?.parse(sundayPattern.regex.exec('this week')!, { referenceDate, weekStartsOn: 0 });
    expect((sundayStart?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-10');
    expect((sundayStart?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-16');
  });

  test('upcoming week behavior', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeWeeksRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('upcoming week'));
    const result = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate });
    expect(result?.type).toBe('range');
    expect((result?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-18');
    expect((result?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-24');

    // Test behavior on different days of the week
    const mondayRef = DateTime.fromISO('2024-03-11T12:00:00Z');
    const mondayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: mondayRef });
    expect((mondayResult?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-18'); // Should be next week
    expect((mondayResult?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-24');

    const wednesdayRef = DateTime.fromISO('2024-03-13T12:00:00Z');
    const wednesdayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: wednesdayRef });
    expect((wednesdayResult?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-18'); // Should be next week
    expect((wednesdayResult?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-24');

    const fridayRef = DateTime.fromISO('2024-03-15T12:00:00Z');
    const fridayResult = pattern?.parse(pattern.regex.exec('upcoming week')!, { referenceDate: fridayRef });
    expect((fridayResult?.value as any).start?.toISO()?.slice(0, 10)).toBe('2024-03-18'); // Should be next week
    expect((fridayResult?.value as any).end?.toISO()?.slice(0, 10)).toBe('2024-03-24');
  });

  describe('Time of day with relative weeks', () => {
    const referenceDate = DateTime.fromISO('2024-01-15T12:00:00Z');
    const preferences: DateParsePreferences = {
      referenceDate,
      weekStartsOn: 1, // Monday
      timeZone: 'UTC'
    };

    test('afternoon next week', () => {
      const pattern = relativeWeeksRule.patterns[0];
      const matches = pattern.regex.exec('afternoon next week');
      const result = pattern.parse(matches!, preferences);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('range');
      
      const { start, end } = result!.value as { start: DateTime; end: DateTime };
      
      // Next week should start on Monday Jan 22 and end on Sunday Jan 28
      // Afternoon is 12:00-16:00
      expect(start.toISO()).toBe('2024-01-22T12:00:00.000Z');
      expect(end.toISO()).toBe('2024-01-28T16:00:00.000Z');
    });

    test('early morning this week', () => {
      const pattern = relativeWeeksRule.patterns[0];
      const matches = pattern.regex.exec('early morning this week');
      const result = pattern.parse(matches!, preferences);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('range');
      
      const { start, end } = result!.value as { start: DateTime; end: DateTime };
      
      // This week should start on Monday Jan 15 and end on Sunday Jan 21
      // Early morning is 7:00-8:00
      expect(start.toISO()).toBe('2024-01-15T07:00:00.000Z');
      expect(end.toISO()).toBe('2024-01-21T08:00:00.000Z');
    });

    test('just next week (no time of day)', () => {
      const pattern = relativeWeeksRule.patterns[0];
      const matches = pattern.regex.exec('next week');
      const result = pattern.parse(matches!, preferences);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('range');
      
      const { start, end } = result!.value as { start: DateTime; end: DateTime };
      
      // Next week should start on Monday Jan 22 and end on Sunday Jan 28
      expect(start.toISO()).toBe('2024-01-22T00:00:00.000Z');
      expect(end.toISO()).toBe('2024-01-28T23:59:59.999Z');
    });
  });
}); 