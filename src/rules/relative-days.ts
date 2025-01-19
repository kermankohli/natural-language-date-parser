import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

export const relativeDaysRule: RuleModule = {
  name: 'relative-days',
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
      name: 'tomorrow-variations',
      regex: /^(tomorrow|the day after today)$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['tomorrow'],
        pattern: 'tomorrow',
        captures: { offset: '1' }
      })
    },
    {
      name: 'yesterday-variations',
      regex: /^(yesterday|the day before today)$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['yesterday'],
        pattern: 'yesterday',
        captures: { offset: '-1' }
      })
    },
    {
      name: 'day-after-tomorrow',
      regex: /^(the day after tomorrow|2 days from (now|today))$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['day after tomorrow'],
        pattern: 'day-after-tomorrow',
        captures: { offset: '2' }
      })
    },
    {
      name: 'day-before-yesterday',
      regex: /^(the day before yesterday|2 days ago)$/i,
      parse: (): IntermediateParse => ({
        type: 'relative',
        tokens: ['day before yesterday'],
        pattern: 'day-before-yesterday',
        captures: { offset: '-2' }
      })
    },
    {
      name: 'days-from-now',
      regex: /^(\d+) days from (now|today)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const [, days] = matches;
        Logger.debug('Parsing days from now', { days });
        return {
          type: 'relative',
          tokens: [matches[0]],
          pattern: 'days-from-now',
          captures: { offset: days }
        };
      }
    },
    {
      name: 'days-ago',
      regex: /^(\d+) days ago$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const [, days] = matches;
        Logger.debug('Parsing days ago', { days });
        return {
          type: 'relative',
          tokens: [matches[0]],
          pattern: 'days-ago',
          captures: { offset: `-${days}` }
        };
      }
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