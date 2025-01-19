import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';

export const relativeDatesRule: RuleModule = {
  name: 'relative-dates',
  patterns: [
    {
      name: 'today',
      regex: /^today$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['today'],
        pattern: 'today',
        captures: { offset: '0' }
      })
    },
    {
      name: 'tomorrow',
      regex: /^tomorrow$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['tomorrow'],
        pattern: 'tomorrow',
        captures: { offset: '1' }
      })
    },
    {
      name: 'yesterday',
      regex: /^yesterday$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['yesterday'],
        pattern: 'yesterday',
        captures: { offset: '-1' }
      })
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult => {
    const referenceDate = prefs.referenceDate || new Date();
    const offset = parseInt(intermediate.captures.offset);
    
    // Create date in UTC to match reference date
    const date = new Date(Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate() + offset
    ));

    return {
      type: 'single',
      start: date,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 