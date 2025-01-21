import { DateParsePreferences, ParseResult, RuleModule } from '../src/types/types';
import { DateTime } from 'luxon';

describe('Interface Types', () => {
  it('should allow valid DateParsePreferences', () => {
    const prefs: DateParsePreferences = {
      referenceDate: DateTime.now(),
      weekStartsOn: 1,
      timeZone: 'America/New_York',
      debug: true
    };
    expect(prefs).toBeDefined();
  });

  it('should allow valid ParseResult', () => {
    const result: ParseResult = {
      type: 'single',
      start: DateTime.now(),
      text: 'tomorrow',
      confidence: 1.0
    };
    expect(result).toBeDefined();
  });
}); 