import { DateParsePreferences, ParseResult, RuleModule } from '../src/types/types';

describe('Interface Types', () => {
  it('should allow valid DateParsePreferences', () => {
    const prefs: DateParsePreferences = {
      referenceDate: new Date(),
      startOfWeek: 1,
      timeZone: 'America/New_York',
      debug: true
    };
    expect(prefs).toBeDefined();
  });

  it('should allow valid ParseResult', () => {
    const result: ParseResult = {
      type: 'single',
      start: new Date(),
      text: 'tomorrow',
      confidence: 1.0
    };
    expect(result).toBeDefined();
  });
}); 