import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult } from '../types/types';
import { convertToTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';

interface ResolverContext {
  referenceDate: DateTime;
  timeZone?: string;
  weekStartsOn: 0 | 1;
}

export function resolvePreferences(result: ParseResult, preferences: DateParsePreferences): ParseResult {
  const context: ResolverContext = {
    referenceDate: preferences.referenceDate || DateTime.now(),
    timeZone: preferences.timeZone,
    weekStartsOn: preferences.weekStartsOn === 1 ? 1 : 0
  };

  if (context.timeZone) {

    // If the time is not midnight (00:00), we want to preserve the time
    const hasTimeComponent = result.start.hour !== 0 || result.start.minute !== 0;

    // Convert to the target timezone
    if (hasTimeComponent) {
      // For times, we want to preserve the wall time in the target timezone
      // First convert to UTC to normalize the date
      const utc = result.start.toUTC();
      
      // Then set the timezone while keeping the wall time
      result.start = utc.setZone(context.timeZone, { keepLocalTime: true });
    } else {
      // For dates without times, we want to keep the same date in the target timezone
      result.start = result.start.setZone(context.timeZone, { keepLocalTime: true });
    }

    if (result.end) {
      if (hasTimeComponent) {
        // For times, we want to preserve the wall time in the target timezone
        const utc = result.end.toUTC();
        result.end = utc.setZone(context.timeZone, { keepLocalTime: true });
      } else {
        // For dates without times, we want to keep the same date in the target timezone
        result.end = result.end.setZone(context.timeZone, { keepLocalTime: true });
      }
    }
  }

  return result;
} 