import { RuleModule, IntermediateParse, ParseResult } from '../types/types';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';
import { Logger } from '../utils/Logger';

const DATETIME_PATTERNS = {
  // Fix ISO patterns to properly handle T/space separator and timezones
  ISO_TZ: /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}(?::?\d{2})?)?$/,
  ISO_SIMPLE: /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/,
  ISO_BASIC: /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:(\d{2}))?(?:Z|[+-]\d{2}\d{2})?$/,
  SPACE_24H: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/,
  SPACE_12H: /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i
};

function createDateTimeParser(format: 'ISO_TZ' | 'ISO_SIMPLE' | 'BASIC' | '24H' | '12H') {
  return (matches: RegExpMatchArray): IntermediateParse | null => {
    Logger.debug('Parsing datetime', { format, matches: matches.map(m => m) });
    
    const [, year, month, day, hours, minutes, seconds, timezone] = matches;
    
    // Validate date components
    if (parseInt(month) > 12 || parseInt(month) < 1) return null;
    if (parseInt(day) > 31 || parseInt(day) < 1) return null;
    
    // Construct time string based on format
    let timeStr: string;
    if (format === 'ISO_TZ') {
      timeStr = [hours, minutes, seconds || '00'].join(':') + (timezone || '');
    } else if (format === 'BASIC') {
      timeStr = [hours, minutes, seconds || '00'].join(':');
    } else if (format === '12H') {
      const meridiem = matches[7]?.toLowerCase();
      timeStr = [hours, minutes, seconds || '00'].join(':') + ' ' + meridiem;
    } else {
      timeStr = [hours, minutes, seconds || '00'].join(':');
    }
    
    Logger.debug('Parsing time component', { timeStr });
    const timeComponents = parseTimeString(timeStr, { 
      allow12Hour: format === '12H' 
    });
    if (!timeComponents) return null;

    return {
      type: 'absolute',
      tokens: [matches[0]],
      pattern: `datetime-${format.toLowerCase()}`,
      captures: {
        year,
        month,
        day,
        ...timeComponentsToString(timeComponents)
      }
    };
  };
}

export const dateTimeRule: RuleModule = {
  name: 'datetime',
  patterns: [
    {
      name: 'iso-datetime-tz',
      regex: DATETIME_PATTERNS.ISO_TZ,
      parse: createDateTimeParser('ISO_TZ')
    },
    {
      name: 'iso-datetime-simple',
      regex: DATETIME_PATTERNS.ISO_SIMPLE,
      parse: createDateTimeParser('ISO_SIMPLE')
    },
    {
      name: 'iso-basic-datetime',
      regex: DATETIME_PATTERNS.ISO_BASIC,
      parse: createDateTimeParser('BASIC')
    },
    {
      name: 'space-24h',
      regex: DATETIME_PATTERNS.SPACE_24H,
      parse: createDateTimeParser('24H')
    },
    {
      name: 'space-12h',
      regex: DATETIME_PATTERNS.SPACE_12H,
      parse: createDateTimeParser('12H')
    }
  ],
  interpret: (intermediate: IntermediateParse): ParseResult => {
    const { year, month, day, hours, minutes, seconds, offsetMinutes } = intermediate.captures;
    
    Logger.debug('Interpreting datetime', {
      year, month, day, hours, minutes, seconds, offsetMinutes
    });

    // Create date in UTC
    const date = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds || '0')
    ));

    Logger.debug('Created UTC date', { 
      initial: date.toISOString() 
    });

    // Apply timezone offset if present
    const offset = parseInt(offsetMinutes || '0');
    if (offset !== 0) {
      date.setMinutes(date.getMinutes() - offset);
      Logger.debug('Applied timezone offset', { 
        offset,
        final: date.toISOString()
      });
    }

    return {
      type: 'single',
      start: date,
      confidence: 1.0,
      text: intermediate.tokens[0]
    };
  }
}; 