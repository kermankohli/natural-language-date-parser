import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult } from '../types/types';
import { convertToTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';

interface ResolverContext {
  referenceDate: DateTime;
  timeZone?: string;
  weekStartsOn: 0 | 1;
}

export function resolvePreferences(result: ParseResult, preferences: DateParsePreferences, timeResult?: ParseResult): ParseResult {
  const context: ResolverContext = {
    referenceDate: preferences.referenceDate || DateTime.now(),
    timeZone: preferences.timeZone,
    weekStartsOn: preferences.weekStartsOn === 1 ? 1 : 0
  };

  // If we have a time result, combine it with the date result
  if (timeResult) {
    // First convert both results to the target timezone if specified
    if (context.timeZone) {
      // For times, we want to preserve the wall time in the target timezone
      // This means 3:30 PM in UTC should become 3:30 PM in NY
      timeResult.start = timeResult.start.setZone(context.timeZone, { keepLocalTime: true });
      result.start = result.start.setZone(context.timeZone);
    }

    // Then combine them
    result.start = result.start.set({
      hour: timeResult.start.hour,
      minute: timeResult.start.minute,
      second: timeResult.start.second,
      millisecond: timeResult.start.millisecond
    });

    // Convert final result to UTC unless a specific timezone is requested
    if (!context.timeZone) {
      result.start = result.start.toUTC();
    }

    return result;
  }

  // For single results (just date or just time)
  if (context.timeZone) {
    // If the time is not midnight (00:00), we want to preserve the time
    const hasTimeComponent = result.start.hour !== 0 || result.start.minute !== 0;

    // Convert to the target timezone
    if (hasTimeComponent) {
      // For times, we want to preserve the wall time in the target timezone
      // This means 3:30 PM in UTC should become 3:30 PM in NY
      result.start = result.start.setZone(context.timeZone, { keepLocalTime: true });
    } else {
      // For dates without times, we want midnight in UTC to become midnight in the target timezone
      result.start = result.start.setZone(context.timeZone, { keepLocalTime: true });
    }

    if (result.end) {
      if (hasTimeComponent) {
        result.end = result.end.setZone(context.timeZone, { keepLocalTime: true });
      } else {
        result.end = result.end.setZone(context.timeZone, { keepLocalTime: true });
      }
    }
  } else {
    // If no timezone specified, convert to UTC
    result.start = result.start.toUTC();
    if (result.end) {
      result.end = result.end.toUTC();
    }
  }

  return result;
} 