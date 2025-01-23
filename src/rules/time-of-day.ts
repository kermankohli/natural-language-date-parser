import { RuleModule, DateParsePreferences, TimeOfDayPreferences } from '../types/types';
import { DateTime } from 'luxon';
import { Logger } from '../utils/Logger';
import { ParseComponent } from '../resolver/resolution-engine';

export const DEFAULT_TIME_OF_DAY_PREFERENCES: TimeOfDayPreferences = {
  morning: {
    start: 7,   // 7 AM
    end: 11,    // 11 AM
    early: { start: 7, end: 8 },
    mid: { start: 8, end: 9 },
    late: { start: 9, end: 11 }
  },
  afternoon: {
    start: 12,  // 12 PM
    end: 16,    // 4 PM
    early: { start: 12, end: 13 },
    mid: { start: 13, end: 14 },
    late: { start: 14, end: 16 }
  },
  evening: {
    start: 17,  // 5 PM
    end: 20,    // 8 PM
    early: { start: 17, end: 18 },
    mid: { start: 18, end: 19 },
    late: { start: 19, end: 20 }
  },
  night: {
    start: 21,  // 9 PM
    end: 23,    // 11 PM
    early: { start: 21, end: 22 },
    mid: { start: 22, end: 23 },
    late: { start: 23, end: 24 }
  }
};

function createTimeOfDayComponent(
  startHour: number,
  endHour: number,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  const referenceDate = preferences.referenceDate || DateTime.now();
  const zone = preferences.timeZone || 'UTC';

  let start = referenceDate.setZone(zone).set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0
  });

  let end = referenceDate.setZone(zone).set({
    hour: endHour,
    minute: 0,
    second: 0,
    millisecond: 0
  });

  // If end time is before start time, assume it spans to next day
  if (end < start) {
    end = end.plus({ days: 1 });
  }

  return {
    type: 'range',
    span,
    value: { start, end },
    confidence: 1,
    metadata: {
      originalText,
      rangeType: 'timeOfDay'
    }
  };
}

function getTimeOfDayRange(
  timeOfDay: keyof TimeOfDayPreferences,
  modifier: 'early' | 'mid' | 'late' | undefined,
  preferences: DateParsePreferences
): { start: number; end: number } {
  const prefs = preferences.timeOfDay || DEFAULT_TIME_OF_DAY_PREFERENCES;
  const period = prefs[timeOfDay];

  if (modifier) {
    return period[modifier];
  }
  
  return {
    start: period.start,
    end: period.end
  };
}

export const timeOfDayRule: RuleModule = {
  name: 'time-of-day',
  patterns: [
    {
      // Matches "morning", "early morning", "late afternoon", etc.
      regex: /(?:(early|mid|late)\s+)?(morning|afternoon|evening|night)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        const [fullMatch, modifier, timeOfDay] = matches;
        
        const range = getTimeOfDayRange(
          timeOfDay.toLowerCase() as keyof TimeOfDayPreferences,
          modifier?.toLowerCase() as 'early' | 'mid' | 'late' | undefined,
          preferences
        );

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;

        return createTimeOfDayComponent(
          range.start,
          range.end,
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    }
  ]
}; 