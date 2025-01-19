import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';

const WEEKDAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

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
    },
    {
      name: 'next-weekday',
      regex: /^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        const weekday = matches[1].toLowerCase();
        const targetDay = WEEKDAYS[weekday as keyof typeof WEEKDAYS];
        return {
          type: 'relative',
          tokens: [matches[0]],
          pattern: 'next-weekday',
          captures: { weekday: targetDay.toString() }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult => {
    const referenceDate = prefs.referenceDate || new Date();
    
    if (intermediate.pattern === 'next-weekday') {
      const targetDay = parseInt(intermediate.captures.weekday);
      const currentDay = referenceDate.getUTCDay();
      
      // Calculate days until next occurrence
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;  // If target day has passed this week, go to next week
      
      const date = new Date(Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate() + daysToAdd
      ));

      return {
        type: 'single',
        start: date,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    }

    // Handle other patterns
    const offset = parseInt(intermediate.captures.offset);
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