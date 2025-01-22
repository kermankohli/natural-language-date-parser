import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult } from '../types/types';
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
  // If timeResult has a higher confidence (e.g. specific time like "9am"),
  // use it instead of any time of day preferences
  if (timeResult.confidence > 0.8) {
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

  // Otherwise, use the time of day preferences from timeResult
  if (dateResult.type === 'single') {
    return {
      type: 'range',
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.start, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  } else {
    return {
      type: 'range',
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.end!, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  }
}

function handleSingleTime(dateResult: ParseResult, timeResult: ParseResult): ParseResult {
  // If timeResult has a higher confidence (e.g. specific time like "9am"),
  // use it instead of any time of day preferences
  if (timeResult.confidence > 0.8) {
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

  // Otherwise, use the time of day preferences from timeResult
  if (dateResult.type === 'single') {
    return {
      type: 'range',
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.start, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  } else {
    return {
      type: 'range',
      start: applyTimeToDate(dateResult.start, timeResult.start),
      end: applyTimeToDate(dateResult.end!, timeResult.end!),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: `${dateResult.text} ${timeResult.text}`,
      debugTrace: dateResult.debugTrace || timeResult.debugTrace
    };
  }
}

function applyTimeZone(result: ParseResult, timeZone: string): ParseResult {
  // For all cases, we want to preserve the wall time in the target timezone
  result.start = result.start.setZone(timeZone, { keepLocalTime: true });
  
  if (result.end) {
    result.end = result.end.setZone(timeZone, { keepLocalTime: true });
  }

  return result;
}

export function resolvePreferences(result: ParseResult | undefined, preferences: DateParsePreferences, timeResult?: ParseResult): ParseResult {
  const context = {
    timeZone: preferences.timeZone,
    referenceDate: preferences.referenceDate || DateTime.now()
  };

  Logger.debug('Resolving preferences:', {
    hasResult: !!result,
    resultType: result?.type,
    hasTimeResult: !!timeResult,
    timeResultType: timeResult?.type,
    timeZone: context.timeZone
  });

  // If we only have a time result (no date result), use it directly
  if (!result && timeResult) {
    Logger.debug('Using time result directly:', {
      type: timeResult.type,
      start: timeResult.start?.toISO(),
      end: timeResult.end?.toISO()
    });
    result = timeResult;
  }
  // If we have both a time result and a date result, combine them
  else if (result && timeResult) {
    Logger.debug('Combining date and time results:', {
      dateType: result.type,
      timeType: timeResult.type,
      dateStart: result.start?.toISO(),
      dateEnd: result.end?.toISO(),
      timeStart: timeResult.start?.toISO(),
      timeEnd: timeResult.end?.toISO()
    });

    // Always treat time of day results as ranges
    if (timeResult.type === 'range' || timeResult.end) {
      result = handleTimeRange(result, timeResult);
    } else {
      result = handleSingleTime(result, timeResult);
    }
  }
  // If we have neither, throw an error
  else if (!result) {
    throw new Error('No parse result available');
  }

  // Apply timezone if specified, otherwise convert to UTC
  if (context.timeZone) {
    Logger.debug('Applying timezone:', {
      timeZone: context.timeZone,
      beforeStart: result.start?.toISO(),
      beforeEnd: result.end?.toISO()
    });
    result = applyTimeZone(result, context.timeZone);
    Logger.debug('After timezone:', {
      afterStart: result.start?.toISO(),
      afterEnd: result.end?.toISO()
    });
  } else {
    Logger.debug('Converting to UTC');
    result.start = result.start.toUTC();
    if (result.end) {
      result.end = result.end.toUTC();
    }
  }

  Logger.debug('Final resolved result:', {
    type: result.type,
    start: result.start?.toISO(),
    end: result.end?.toISO(),
    confidence: result.confidence
  });

  return result;
} 