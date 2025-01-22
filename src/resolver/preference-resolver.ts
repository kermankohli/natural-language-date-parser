import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult } from '../types/types';
import { convertToTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';

interface ResolverContext {
  referenceDate: DateTime;
  timeZone?: string;
  weekStartsOn: 0 | 1;
}

function applyTimeToDate(date: DateTime, time: DateTime): DateTime {
  return date.set({
    hour: time.hour,
    minute: time.minute,
    second: time.second
  });
}

function handleTimeRange(dateResult: ParseResult, timeResult: ParseResult): ParseResult {
  if (dateResult.type === 'single') {
    // Single date with time range
    const result = {
      type: 'range' as const,
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.start, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} from ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };

    // If end time is before start time, assume it's the next day
    if (result.end < result.start) {
      result.end = result.end.plus({ days: 1 });
    }

    return result;
  } else {
    // Date range with time range - apply start time to start date and end time to end date
    return {
      type: 'range' as const,
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.end!, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} from ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  }
}

function handleSingleTime(dateResult: ParseResult, timeResult: ParseResult): ParseResult {
  if (dateResult.type === 'single') {
    // Single date with single time
    return {
      type: 'single' as const,
      start: applyTimeToDate(dateResult.start, timeResult.start),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} at ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  } else {
    // Date range with single time - apply same time to both start and end
    return {
      type: 'range' as const,
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.end!, timeResult.start),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} at ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  }
}

function applyTimeZone(result: ParseResult, timeZone: string): ParseResult {
  // If the time is not midnight (00:00), we want to preserve the time
  const hasTimeComponent = result.start.hour !== 0 || result.start.minute !== 0;

  // For all cases, we want to preserve the wall time in the target timezone
  result.start = result.start.setZone(timeZone, { keepLocalTime: true });
  
  if (result.end) {
    result.end = result.end.setZone(timeZone, { keepLocalTime: true });
  }

  return result;
}

export function resolvePreferences(result: ParseResult, preferences: DateParsePreferences, timeResult?: ParseResult): ParseResult {
  const context = {
    timeZone: preferences.timeZone,
    referenceDate: preferences.referenceDate || DateTime.now()
  };

  // If we have a time result and a date result, combine them
  if (timeResult) {
    result = timeResult.type === 'range' 
      ? handleTimeRange(result, timeResult)
      : handleSingleTime(result, timeResult);
  }

  // Apply timezone if specified, otherwise convert to UTC
  if (context.timeZone) {
    result = applyTimeZone(result, context.timeZone);
  } else {
    result.start = result.start.toUTC();
    if (result.end) {
      result.end = result.end.toUTC();
    }
  }

  return result;
} 