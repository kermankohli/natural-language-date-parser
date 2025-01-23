import { RuleModule, DateParsePreferences } from '../types/types';
import { DateTime } from 'luxon';
import { parseTimeString } from '../utils/time-parser';
import { ParseComponent } from '../resolver/resolution-engine';

function createTimeRangeComponent(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  span: { start: number; end: number },
  originalText: string,
  preferences?: DateParsePreferences
): ParseComponent {
  const referenceDate = preferences?.referenceDate || DateTime.now();
  const zone = preferences?.timeZone || referenceDate.zoneName || 'UTC';
  
  // Create start and end times in the target timezone
  let start = referenceDate.setZone(zone).set({
    hour: startHour,
    minute: startMinute,
    second: 0,
    millisecond: 0
  });

  let end = referenceDate.setZone(zone).set({
    hour: endHour,
    minute: endMinute,
    second: 59,
    millisecond: 999
  });

  // If end time is before start time, assume it's the next day
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
      rangeType: 'time'
    }
  };
}

export const timeRangesRule: RuleModule = {
  name: 'time-ranges',
  patterns: [
    {
      // Matches patterns like "3:30 PM to 5:00 PM" or "15:30 to 17:00"
      regex: /(?:from\s+)?(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+(?:to|until|till|-)\s+(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        const [fullMatch, startTimeStr, endTimeStr] = matches;
        
        const startTime = parseTimeString(startTimeStr, { allow12Hour: true });
        const endTime = parseTimeString(endTimeStr, { allow12Hour: true });
        
        if (!startTime || !endTime) return null;

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;
        
        return createTimeRangeComponent(
          startTime.hours,
          startTime.minutes,
          endTime.hours,
          endTime.minutes,
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    },
    {
      // Matches patterns like "from 3 PM - 5 PM" or "between 15:00-17:00"
      regex: /(?:from|between)\s+(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        const [fullMatch, startTimeStr, endTimeStr] = matches;
        
        const startTime = parseTimeString(startTimeStr, { allow12Hour: true });
        const endTime = parseTimeString(endTimeStr, { allow12Hour: true });
        
        if (!startTime || !endTime) return null;

        const matchStart = matches.index + (fullMatch.startsWith(' ') ? 1 : 0);
        const matchEnd = matchStart + fullMatch.trim().length;
        
        return createTimeRangeComponent(
          startTime.hours,
          startTime.minutes,
          endTime.hours,
          endTime.minutes,
          { start: matchStart, end: matchEnd },
          fullMatch.trim(),
          preferences
        );
      }
    }
  ]
}; 