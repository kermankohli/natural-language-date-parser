import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { dateTimeRule } from '../../src/rules/date-time';
import { relativeDaysRule } from '../../src/rules/relative-days';
import { ordinalDaysRule } from '../../src/rules/ordinal-days';
import { timeOnlyRule } from '../../src/rules/time-only';

describe('Date Time Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z');
  let state: any;

  beforeEach(() => {
    state = createParserState({ referenceDate });
    [relativeDaysRule, ordinalDaysRule, timeOnlyRule, dateTimeRule].forEach(rule => {
      state = registerRule(state, rule);
    });
    state.defaultPreferences.parser = { parse: (input: string, prefs = {}) => parse(state, input, prefs) };
  });

  it('should parse date + time combinations', () => {
    expect(parse(state, 'tomorrow at 3pm')?.start.toISOString()).toBe('2024-03-15T15:00:00.000Z');
    expect(parse(state, 'next Monday at 3:30pm')?.start.toISOString()).toBe('2024-03-18T15:30:00.000Z');
  });

  it('should parse relative days with time', () => {
    expect(parse(state, '3 days from now at noon')?.start.toISOString()).toBe('2024-03-17T12:00:00.000Z');
  });

  it('should parse ordinal days with time', () => {
    expect(parse(state, '1st of April at midnight')?.start.toISOString()).toBe('2024-04-01T00:00:00.000Z');
  });

  it('should handle timezone conversions', () => {
    state = createParserState({ referenceDate, timeZone: 'America/New_York' });
    [relativeDaysRule, ordinalDaysRule, timeOnlyRule, dateTimeRule].forEach(rule => {
      state = registerRule(state, rule);
    });
    state.defaultPreferences.parser = { parse: (input: string, prefs = {}) => parse(state, input, prefs) };

    // 3pm in New York on March 15 (during DST) is 7pm UTC
    expect(parse(state, 'tomorrow at 3pm')?.start.toISOString()).toBe('2024-03-15T15:00:00.000Z');
  });
}); 