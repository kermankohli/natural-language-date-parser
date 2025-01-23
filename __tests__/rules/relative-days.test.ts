import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { relativeDaysRule } from '../../src/rules/relative-days';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return relativeDaysRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Relative Days Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('basic relative days', () => {
    const todayInput = 'today';
    const pattern = findPatternForInput(todayInput);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(todayInput);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 5 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-14');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('today');
    }

    const tomorrowInput = 'tomorrow';
    const tomorrowPattern = findPatternForInput(tomorrowInput);
    const tomorrowMatches = tomorrowPattern?.regex.exec(tomorrowInput);
    if (tomorrowMatches && tomorrowPattern) {
      const result = tomorrowPattern.parse(tomorrowMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 8 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-15');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('tomorrow');
    }

    const yesterdayInput = 'yesterday';
    const yesterdayPattern = findPatternForInput(yesterdayInput);
    const yesterdayMatches = yesterdayPattern?.regex.exec(yesterdayInput);
    if (yesterdayMatches && yesterdayPattern) {
      const result = yesterdayPattern.parse(yesterdayMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 9 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-13');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('yesterday');
    }
  });

  test('days ago/from now', () => {
    const agoInput = '3 days ago';
    const agoPattern = findPatternForInput(agoInput);
    const agoMatches = agoPattern?.regex.exec(agoInput);
    if (agoMatches && agoPattern) {
      const result = agoPattern.parse(agoMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 10 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('3 days ago');
    }

    const fromNowInput = '3 days from now';
    const fromNowPattern = findPatternForInput(fromNowInput);
    const fromNowMatches = fromNowPattern?.regex.exec(fromNowInput);
    if (fromNowMatches && fromNowPattern) {
      const result = fromNowPattern.parse(fromNowMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 15 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-17');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('3 days from now');
    }
  });

  test('timezone handling', () => {
    const input = 'today';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate, timeZone: 'America/New_York' });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 5 });
      expect((result?.value as DateTime).toUTC().toISO()).toBe('2024-03-14T12:00:00.000Z');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('today');
    }
  });

  test('upcoming vs next weekday', () => {
    // Test "upcoming" behavior when target is within 3 days
    const upcomingFridayInput = 'upcoming friday';
    const upcomingFridayPattern = findPatternForInput(upcomingFridayInput);
    const upcomingFridayMatches = upcomingFridayPattern?.regex.exec(upcomingFridayInput);
    if (upcomingFridayMatches && upcomingFridayPattern) {
      const result = upcomingFridayPattern.parse(upcomingFridayMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 15 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-15');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('upcoming friday');
    }

    // Test "upcoming" behavior when target is more than 3 days away
    const upcomingWednesdayInput = 'upcoming wednesday';
    const upcomingWednesdayPattern = findPatternForInput(upcomingWednesdayInput);
    const upcomingWednesdayMatches = upcomingWednesdayPattern?.regex.exec(upcomingWednesdayInput);
    if (upcomingWednesdayMatches && upcomingWednesdayPattern) {
      const result = upcomingWednesdayPattern.parse(upcomingWednesdayMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 18 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('upcoming wednesday');
    }

    // Compare with "next" behavior
    const nextFridayInput = 'next friday';
    const nextFridayPattern = findPatternForInput(nextFridayInput);
    const nextFridayMatches = nextFridayPattern?.regex.exec(nextFridayInput);
    if (nextFridayMatches && nextFridayPattern) {
      const result = nextFridayPattern.parse(nextFridayMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 11 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-22');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('next friday');
    }

    // Test edge case: if today is Monday and we say "upcoming tuesday"
    const mondayRef = DateTime.fromISO('2024-03-11T12:00:00Z');
    const upcomingTuesdayInput = 'upcoming tuesday';
    const upcomingTuesdayPattern = findPatternForInput(upcomingTuesdayInput);
    const upcomingTuesdayMatches = upcomingTuesdayPattern?.regex.exec(upcomingTuesdayInput);
    if (upcomingTuesdayMatches && upcomingTuesdayPattern) {
      const result = upcomingTuesdayPattern.parse(upcomingTuesdayMatches, { referenceDate: mondayRef });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 16 });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2024-03-12');
      expect(result?.metadata?.isRelative).toBe(true);
      expect(result?.metadata?.originalText).toBe('upcoming tuesday');
    }
  });
}); 