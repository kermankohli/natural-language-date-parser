import { RuleModule, ParseResult, DateParsePreferences, TimeOfDayPreferences } from '../types/types';
import { DateTime } from 'luxon';
import { Logger } from '../utils/Logger';

export const DEFAULT_TIME_OF_DAY_PREFERENCES: TimeOfDayPreferences = {
  morning: {
    start: 6,   // 6 AM
    end: 12,    // 12 PM
    early: { start: 6, end: 8 },
    mid: { start: 8, end: 10 },
    late: { start: 10, end: 12 }
  },
  afternoon: {
    start: 12,  // 12 PM
    end: 17,    // 5 PM
    early: { start: 12, end: 14 },
    mid: { start: 14, end: 15 },
    late: { start: 15, end: 17 }
  },
  evening: {
    start: 17,  // 5 PM
    end: 21,    // 9 PM
    early: { start: 17, end: 18 },
    mid: { start: 18, end: 19 },
    late: { start: 19, end: 21 }
  },
  night: {
    start: 21,  // 9 PM
    end: 6,     // 6 AM next day
    early: { start: 21, end: 23 },
    mid: { start: 23, end: 2 },
    late: { start: 2, end: 6 }
  }
};

function createTimeResult(
  startHour: number,
  endHour: number,
  preferences: DateParsePreferences,
  text: string
): ParseResult {
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
    start,
    end,
    confidence: 1,
    text
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
      regex: /^(?:(early|mid|late)\s+)?(morning|afternoon|evening|night)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [_, modifier, timeOfDay] = matches;
        
        const range = getTimeOfDayRange(
          timeOfDay.toLowerCase() as keyof TimeOfDayPreferences,
          modifier?.toLowerCase() as 'early' | 'mid' | 'late' | undefined,
          preferences
        );

        return createTimeResult(range.start, range.end, preferences, matches[0]);
      }
    }
  ]
}; 