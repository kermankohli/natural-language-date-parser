import { RuleModule, ParseResult, DateParsePreferences } from '../types/types';
import { DateTime } from 'luxon';
import { parseTimeString } from '../utils/time-parser';

function createTimeRangeResult(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  preferences?: DateParsePreferences
): ParseResult {
  const referenceDate = preferences?.referenceDate || DateTime.now();
  const zone = preferences?.timeZone || 'UTC';
  
  let start = referenceDate.setZone(zone).set({
    hour: startHour,
    minute: startMinute
  });

  let end = referenceDate.setZone(zone).set({
    hour: endHour,
    minute: endMinute
  });

  // If end time is before start time, assume it's the next day
  if (end < start) {
    end = end.plus({ days: 1 });
  }

  return {
    type: 'range',
    start,
    end,
    confidence: 1,
    text: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} to ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
  };
}

export const timeRangesRule: RuleModule = {
  name: 'time-ranges',
  patterns: [
    {
      // Matches patterns like "3:30 PM to 5:00 PM" or "15:30 to 17:00"
      regex: /(?:from\s+)?(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+(?:to|until|till|-)\s+(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [_, startTimeStr, endTimeStr] = matches;
        
        const startTime = parseTimeString(startTimeStr, { allow12Hour: true });
        const endTime = parseTimeString(endTimeStr, { allow12Hour: true });
        
        if (!startTime || !endTime) return null;
        
        return createTimeRangeResult(
          startTime.hours,
          startTime.minutes,
          endTime.hours,
          endTime.minutes,
          preferences
        );
      }
    },
    {
      // Matches patterns like "from 3 PM - 5 PM" or "between 15:00-17:00"
      regex: /(?:from|between)\s+(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [_, startTimeStr, endTimeStr] = matches;
        
        const startTime = parseTimeString(startTimeStr, { allow12Hour: true });
        const endTime = parseTimeString(endTimeStr, { allow12Hour: true });
        
        if (!startTime || !endTime) return null;
        
        return createTimeRangeResult(
          startTime.hours,
          startTime.minutes,
          endTime.hours,
          endTime.minutes,
          preferences
        );
      }
    }
  ]
}; 