import { RuleModule, DateParsePreferences } from '../types/types';
import { DateTime } from 'luxon';
import { ParseComponent } from '../resolver/resolution-engine';

function createTimeComponent(
  hour: number, 
  minute: number, 
  span: { start: number; end: number },
  originalText: string,
  preferences?: DateParsePreferences
): ParseComponent {
  const referenceDate = preferences?.referenceDate || DateTime.now();
  let value = DateTime.fromObject({
    year: referenceDate.year,
    month: referenceDate.month,
    day: referenceDate.day,
    hour,
    minute
  }, { zone: 'UTC' });

  return {
    type: 'time',
    span,
    value,
    confidence: 1,
    metadata: {
      originalText
    }
  };
}

export const timeOnlyRule: RuleModule = {
  name: 'time-only',
  patterns: [
    {
      regex: /(?:^|\s)(?:at\s+)?(\d{1,2}):(\d{2})(?:\s*(AM|PM))?(?:\s|$)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        let [fullMatch, hours, minutes, meridiem] = matches;
        let hour = parseInt(hours);
        const minute = parseInt(minutes);

        if (minute >= 60) return null;

        if (meridiem) {
          if (hour > 12) return null;
          if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
          if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
        } else {
          if (hour >= 24) return null;
        }

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        return createTimeComponent(
          hour, 
          minute, 
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    },
    {
      regex: /(?:^|\s)(?:at\s+)?(\d{1,2})(?:\s*)(AM|PM)(?:\s|$)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        let [fullMatch, hours, meridiem] = matches;
        let hour = parseInt(hours);

        if (hour > 12) return null;
        if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        return createTimeComponent(
          hour, 
          0, 
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    },
    {
      regex: /(?:^|\s)(?:at\s+)?noon(?:\s|$)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent => {
        const fullMatch = matches[0];
        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        return createTimeComponent(
          12, 
          0, 
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    },
    {
      regex: /(?:^|\s)(?:at\s+)?midnight(?:\s|$)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent => {
        const fullMatch = matches[0];
        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        return createTimeComponent(
          0, 
          0, 
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    }
  ]
}; 