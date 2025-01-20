import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

export const dateOnlyRule: RuleModule = {
  name: 'date-only',
  patterns: [
    {
      name: 'iso-date',
      regex: /^(\d{4})-(\d{2})-(\d{2})$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        const [, year, month, day] = matches;
        
        // Validate date components
        const y = parseInt(year), m = parseInt(month), d = parseInt(day);
        if (m > 12 || m < 1 || d > 31 || d < 1) return null;
        
        return {
          type: 'absolute',
          tokens: [matches[0]],
          pattern: 'iso-date',
          captures: {
            year,
            month,
            day
          }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const { year, month, day } = intermediate.captures || {};
    if (!year || !month || !day) return null;

    Logger.debug('Interpreting date components', {
      year, month, day
    });

    // Create date in UTC
    const dt = DateTime.fromObject(
      {
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day)
      },
      { zone: prefs.timeZone || 'UTC' }
    ).startOf('day');

    return {
      type: 'single',
      start: dt.toJSDate(),
      confidence: 1.0,
      text: intermediate.tokens?.[0] || ''
    };
  }
}; 