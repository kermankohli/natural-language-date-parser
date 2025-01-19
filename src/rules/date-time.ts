import { parseISO } from 'date-fns';
import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { parseTimeString } from '../utils/time-parser';

export const dateTimeRule: RuleModule = {
  name: 'datetime',
  patterns: [
    {
      name: 'iso-datetime',
      regex: /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}(?::(\d{2})){1,2}(?:[+-]\d{2}:?\d{2}|Z)?)$/i,
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

        return {
          type: 'absolute',
          tokens: [input],
          pattern: 'datetime-iso',
          captures: {
            year: year.toString(),
            month: month.toString(),
            day: day.toString(),
            hours: timeComponents.hours.toString(),
            minutes: timeComponents.minutes.toString(),
            seconds: timeComponents.seconds.toString(),
            offsetMinutes: timeComponents.offsetMinutes.toString()
          }
        };
      }
    },
    {
      name: 'space-12h',
      regex: /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse | null => {
        const [, year, month, day, hours, minutes, seconds, meridiem] = matches;
        
        // Validate date components
        if (parseInt(month) > 12 || parseInt(month) < 1) return null;
        if (parseInt(day) > 31 || parseInt(day) < 1) return null;
        
        const timeStr = [hours, minutes || '00', seconds || '00'].join(':') + ' ' + meridiem;
        
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
            hours: timeComponents.hours.toString(),
            minutes: timeComponents.minutes.toString(),
            seconds: timeComponents.seconds.toString(),
            offsetMinutes: timeComponents.offsetMinutes.toString()
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
          hours: matches[1],
          minutes: matches[2] || '00',
          meridiem: matches[3].toLowerCase()
        }
      })
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult | null => {
    // Handle both ISO and 12-hour formats
    if ('parsedDate' in intermediate.captures) {
      return {
        type: 'single',
        start: parseISO(intermediate.captures.parsedDate),
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else if (intermediate.pattern === 'simple-time') {
      const { special, hours, minutes, meridiem } = intermediate.captures;
      let finalHours = special 
        ? (special === 'noon' ? 12 : 0)  // noon = 12, midnight = 0
        : parseInt(hours);
      
      // Convert 12-hour to 24-hour
      if (meridiem === 'pm' && finalHours < 12) finalHours += 12;
      if (meridiem === 'am' && finalHours === 12) finalHours = 0;

      const date = new Date();
      date.setUTCHours(finalHours, parseInt(minutes || '0'), 0, 0);

      return {
        type: 'single',
        start: date,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    } else {
      // Handle absolute dates with time
      const { year, month, day, hours, minutes, seconds, offsetMinutes } = intermediate.captures;
      const date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || '0')
      ));

      // Apply timezone offset if present
      if (offsetMinutes) {
        date.setMinutes(date.getMinutes() - parseInt(offsetMinutes));
      }

      return {
        type: 'single',
        start: date,
        confidence: 1.0,
        text: intermediate.tokens[0]
      };
    }
  }
}; 