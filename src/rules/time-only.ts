import { RuleModule, IntermediateParse, ParseResult } from '../types/types';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';
import { Logger } from '../utils/Logger';

const TIME_PATTERNS = {
  TIME_24H: /^(\d{1,2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{1,2}(?::?\d{2})?)?$/i,
  TIME_12H: /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)(?:\s*(Z|[+-]\d{1,2}(?::?\d{2})?)?)?$/i,
  TIME_12H_SIMPLE: /^(\d{1,2})\s*(am|pm)$/i,
  TIME_SPECIAL: /^(noon|midnight)$/i
};

export const timeOnlyRule: RuleModule = {
  name: 'time-only',
  patterns: [
    {
      name: 'time-24h',
      regex: TIME_PATTERNS.TIME_24H,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        Logger.debug('Parsing 24h time', { matches: matches.map(m => m) });
        
        const timeStr = matches[0];
        const parsed = parseTimeString(timeStr);
        if (!parsed) return null;

        return {
          type: 'time',
          tokens: [matches[0]],
          pattern: 'time-24h',
          captures: timeComponentsToString(parsed)
        };
      }
    },
    {
      name: 'time-12h',
      regex: TIME_PATTERNS.TIME_12H,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        Logger.debug('Parsing 12h time', { matches: matches.map(m => m) });
        
        const timeStr = matches[0];
        const parsed = parseTimeString(timeStr, { allow12Hour: true });
        if (!parsed) return null;

        return {
          type: 'time',
          tokens: [matches[0]],
          pattern: 'time-12h',
          captures: timeComponentsToString(parsed)
        };
      }
    },
    {
      name: 'time-12h-simple',
      regex: TIME_PATTERNS.TIME_12H_SIMPLE,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        Logger.debug('Parsing simple 12h time', { matches: matches.map(m => m) });
        
        const [, hours, meridiem] = matches;
        const timeStr = `${hours}:00 ${meridiem}`;
        const parsed = parseTimeString(timeStr, { allow12Hour: true });
        if (!parsed) return null;

        return {
          type: 'time',
          tokens: [matches[0]],
          pattern: 'time-12h-simple',
          captures: timeComponentsToString(parsed)
        };
      }
    },
    {
      name: 'time-special',
      regex: TIME_PATTERNS.TIME_SPECIAL,
      parse: (matches: RegExpMatchArray): IntermediateParse => {
        Logger.debug('Parsing special time', { matches: matches.map(m => m) });
        
        const [, special] = matches;
        const hours = special.toLowerCase() === 'noon' ? '12' : '00';
        
        return {
          type: 'time',
          tokens: [matches[0]],
          pattern: 'time-special',
          captures: {
            hours,
            minutes: '00',
            seconds: '00',
            offsetMinutes: '0'
          }
        };
      }
    }
  ],
  interpret: (intermediate: IntermediateParse, context): ParseResult => {
    const { hours, minutes, seconds, offsetMinutes } = intermediate.captures;
    const referenceDate = context.referenceDate || new Date();

    Logger.debug('Interpreting time in time-only rule', {
      hours, minutes, seconds, offsetMinutes,
      referenceDate: referenceDate.toISOString(),
      pattern: intermediate.pattern,
      tokens: intermediate.tokens
    });

    // Create date using reference date for Y/M/D
    const date = new Date(Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds || '0')
    ));

    Logger.debug('Created UTC date in time-only rule', {
      input: { hours, minutes, seconds },
      result: date.toISOString()
    });

    // Apply timezone offset if present
    const offset = parseInt(offsetMinutes || '0');
    if (offset !== 0) {
      date.setMinutes(date.getMinutes() - offset);
    }

    return {
      type: 'single',
      start: date,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 