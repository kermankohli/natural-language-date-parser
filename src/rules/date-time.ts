import { parseISO } from 'date-fns';
import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { parseTimeString } from '../utils/time-parser';
import { DateTime } from 'luxon';

export const dateTimeRule: RuleModule = {
  name: 'datetime',
  patterns: [
    {
      name: 'date-at-time',
      regex: /^(.+?)\s+at\s+(.+)$/i,
      parse: (matches: RegExpMatchArray): IntermediateParse => ({
        type: 'datetime',
        tokens: [matches[0]],
        pattern: 'date-at-time',
        captures: {
          datePart: matches[1],
          timePart: matches[2]
        }
      })
    },
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
    const { datePart, timePart } = intermediate.captures || {};
    if (!datePart || !timePart || !prefs.parser) return null;

    // Parse date and time separately
    const dateResult = prefs.parser.parse(datePart, prefs);
    if (!dateResult?.start) return null;

    // Handle special times
    const timeStr = timePart.toLowerCase();
    let hours = 0, minutes = 0;
    
    if (timeStr === 'noon') {
      hours = 12;
    } else if (timeStr === 'midnight') {
      hours = 0;
    } else {
      const time = parseTimeString(timeStr, { allow12Hour: true });
      if (!time) return null;
      hours = time.hours;
      minutes = time.minutes;
    }

    // Create a DateTime in the target timezone
    const dt = DateTime.fromJSDate(dateResult.start)
      .setZone(prefs.timeZone || 'UTC')
      .set({ hour: hours, minute: minutes, second: 0 });  // Set time in target timezone

    // Convert to UTC for storage
    const utc = dt.toUTC();

    Logger.debug('Converted date to timezone', {
      original: dt.toJSDate().toISOString(),
      timeZone: prefs.timeZone || 'UTC',
      result: utc.toJSDate().toISOString()
    });

    return {
      type: 'single',
      start: utc.toJSDate(),
      confidence: 1.0,
      text: intermediate.tokens?.[0] || ''
    };
  }
}; 