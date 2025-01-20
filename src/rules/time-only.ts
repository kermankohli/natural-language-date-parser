import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

const TIME_PATTERNS = {
  TIME_24H: /^(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{1,2}(?::?\d{2})?)?$/i,
  TIME_12H: /^(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)(?:\s*(Z|[+-]\d{1,2}(?::?\d{2})?)?)?$/i,
  TIME_12H_SIMPLE: /^(?:at\s+)?(\d{1,2})\s*(am|pm)$/i,
  TIME_SPECIAL: /^(?:at\s+)?(noon|midnight)$/i
};

export const timeOnlyRule: RuleModule = {
  name: 'time-only',
  patterns: [
    {
      name: 'time-24h',
      regex: TIME_PATTERNS.TIME_24H,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        Logger.debug('Parsing 24h time', { matches: matches.map(m => m) });
        
        const timeStr = matches[0].replace(/^at\s+/, '');
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
        
        const timeStr = matches[0].replace(/^at\s+/, '');
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
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    const { hours, minutes, seconds, offsetMinutes } = intermediate.captures || {};
    if (!hours) return null;
    if (!prefs.referenceDate) return { type: 'single', start: new Date(), confidence: 0, text: '' };

    Logger.debug('Interpreting time in time-only rule', {
      hours,
      minutes,
      seconds,
      offsetMinutes,
      referenceDate: prefs.referenceDate,
      pattern: intermediate.pattern,
      tokens: intermediate.tokens,
      timeZone: prefs.timeZone,
      context: JSON.stringify(prefs)
    });

    // Create a DateTime object in the target timezone using the target date
    const targetDate = DateTime.fromJSDate(prefs.referenceDate, { zone: prefs.timeZone || 'UTC' });
    const dt = DateTime.fromObject(
      {
        year: targetDate.year,
        month: targetDate.month,
        day: targetDate.day,
        hour: parseInt(hours),
        minute: minutes ? parseInt(minutes) : 0,
        second: seconds ? parseInt(seconds) : 0
      },
      { zone: prefs.timeZone || 'UTC' }
    );

    Logger.debug('Created DateTime', {
      input: { hours, minutes, seconds },
      zone: prefs.timeZone,
      result: dt.toISO(),
      offset: dt.offset,
      isDST: dt.isInDST
    });

    // If there's an explicit offset in the time string (e.g. "3pm +0200"), apply it
    if (!prefs.timeZone && offsetMinutes) {
      const offset = parseInt(offsetMinutes);
      const adjustedDt = dt.minus({ minutes: offset });
      
      Logger.debug('Applied offset', {
        offset,
        result: adjustedDt.toISO()
      });

      return {
        type: 'single',
        start: adjustedDt.toJSDate(),
        confidence: 1.0,
        text: intermediate.tokens?.[0] || intermediate.text || ''
      };
    }

    // Convert to UTC and return
    const utc = dt.toUTC();
    Logger.debug('Converted to UTC', {
      result: utc.toISO(),
      offset: utc.offset,
      isDST: utc.isInDST
    });

    return {
      type: 'single',
      start: utc.toJSDate(),
      confidence: 1.0,
      text: intermediate.tokens?.[0] || intermediate.text || ''
    };
  }
}; 