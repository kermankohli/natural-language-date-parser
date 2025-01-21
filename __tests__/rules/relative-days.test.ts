import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { relativeDaysRule } from '../../src/rules/relative-days';

describe('Relative Days Rule', () => {
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  test('basic relative days', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeDaysRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('today'));
    const today = pattern?.parse(pattern.regex.exec('today')!, { referenceDate });
    expect(today?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-14');

    const tomorrowPattern = state.rules[0].patterns.find(p => p.regex.test('tomorrow'));
    const tomorrow = tomorrowPattern?.parse(tomorrowPattern.regex.exec('tomorrow')!, { referenceDate });
    expect(tomorrow?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-15');

    const yesterdayPattern = state.rules[0].patterns.find(p => p.regex.test('yesterday'));
    const yesterday = yesterdayPattern?.parse(yesterdayPattern.regex.exec('yesterday')!, { referenceDate });
    expect(yesterday?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-13');
  });

  test('days ago/from now', () => {
    let state = createParserState({ referenceDate });
    state = registerRule(state, relativeDaysRule);

    const agoPattern = state.rules[0].patterns.find(p => p.regex.test('3 days ago'));
    const threeDaysAgo = agoPattern?.parse(agoPattern.regex.exec('3 days ago')!, { referenceDate });
    expect(threeDaysAgo?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');

    const fromNowPattern = state.rules[0].patterns.find(p => p.regex.test('3 days from now'));
    const threeDaysFromNow = fromNowPattern?.parse(fromNowPattern.regex.exec('3 days from now')!, { referenceDate });
    expect(threeDaysFromNow?.start?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-17');
  });

  test('timezone handling', () => {
    let state = createParserState({
      referenceDate,
      timeZone: 'America/New_York'
    });
    state = registerRule(state, relativeDaysRule);

    const pattern = state.rules[0].patterns.find(p => p.regex.test('today'));
    const result = pattern?.parse(pattern.regex.exec('today')!, { referenceDate, timeZone: 'America/New_York' });
    expect(result?.start?.toUTC().toISO()).toBe('2024-03-14T04:00:00.000Z');
  });
}); 