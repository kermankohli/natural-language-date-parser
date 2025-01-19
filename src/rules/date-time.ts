import { parseISO } from 'date-fns';
import { RuleModule, IntermediateParse, ParseResult } from '../types/types';
import { Logger } from '../utils/Logger';
import { parseTimeString, timeComponentsToString } from '../utils/time-parser';

const DATETIME_PATTERNS = {
  // Match any ISO-like string and let date-fns handle it
  ISO: /^\d{4}-\d{2}-\d{2}[T ].+$/,
  SPACE_12H: /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i
};

export const dateTimeRule: RuleModule = {
  name: 'datetime',
  patterns: [
    {
      name: 'iso-datetime',
      regex: /.+/,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        const [input] = matches;
        const normalizedInput = input.toUpperCase();
        Logger.debug('Trying to parse as ISO', { normalizedInput });

        // First validate and parse time components
        const [datePart, ...timeParts] = normalizedInput.split(/[T ]/);
        if (!timeParts.length) return null;

        // Join all time parts to preserve meridiem
        const timePart = timeParts.join(' ');

        // Parse date components
        const [year, month, day] = datePart.split('-').map(Number);
        if (!year || !month || !day) return null;

        // Normalize timezone format (convert +0200 to +02:00)
        const normalizedTime = timePart.includes('+') || timePart.includes('-') 
          ? timePart.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3')
          : timePart;

        // Parse time using our existing time parser with the full time string
        const timeComponents = parseTimeString(normalizedTime, {
          allow12Hour: /am|pm/i.test(normalizedTime)
        });
        if (!timeComponents) return null;

        // Create UTC date using the components
        const date = new Date(Date.UTC(
          year,
          month - 1,
          day,
          timeComponents.hours,
          timeComponents.minutes,
          timeComponents.seconds
        ));

        // Apply timezone offset if present
        if (timeComponents.offsetMinutes !== 0) {
          date.setMinutes(date.getMinutes() - timeComponents.offsetMinutes);
        }

        return {
          type: 'absolute',
          tokens: [input],
          pattern: 'datetime-iso',
          captures: { parsedDate: date.toISOString() }
        };
      }
    },
    {
      name: 'space-12h',
      regex: DATETIME_PATTERNS.SPACE_12H,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        const [, year, month, day, hours, minutes, seconds, meridiem] = matches;
        
        // Validate date components
        if (parseInt(month) > 12 || parseInt(month) < 1) return null;
        if (parseInt(day) > 31 || parseInt(day) < 1) return null;
        
        const timeStr = [hours, minutes, seconds || '00'].join(':') + ' ' + meridiem;
        
        Logger.debug('Parsing time component', { timeStr });
        const timeComponents = parseTimeString(timeStr, { allow12Hour: true });
        if (!timeComponents) return null;

        return {
          type: 'absolute',
          tokens: [matches[0]],
          pattern: 'datetime-space-12h',
          captures: {
            year,
            month,
            day,
            ...timeComponentsToString(timeComponents)
          }
        };
      }
    },
    {
      name: 'simple-time',
      regex: /^at\s+(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)|(noon|midnight))$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'time',
        tokens: [matches[0]],
        pattern: 'simple-time',
        captures: matches[4] ? {
          special: matches[4].toLowerCase()
        } : {
          hour: matches[1],
          minute: matches[2] || '00',
          meridiem: matches[3].toLowerCase()
        }
      })
    }
  ],
  interpret: (intermediate: IntermediateParse): ParseResult => {
    // Handle both ISO and 12-hour formats
    if ('parsedDate' in intermediate.captures) {
      return {
        type: 'single',
        start: parseISO(intermediate.captures.parsedDate),
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'simple-time') {
      const { special, hour, minute, meridiem } = intermediate.captures;
      let hours = special 
        ? (special === 'noon' ? 12 : 0)  // noon = 12, midnight = 0
        : parseInt(hour);
      
      // Convert 12-hour to 24-hour
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      const date = new Date();
      date.setUTCHours(hours, parseInt(minute || '0'), 0, 0);

      return {
        type: 'single',
        start: date,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else {
      // Handle 12-hour format
      const { year, month, day, hours, minutes, seconds } = intermediate.captures;
      const date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || '0')
      ));

      return {
        type: 'single',
        start: date,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    }
  }
}; 