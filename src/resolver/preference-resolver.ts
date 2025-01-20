import { ParseResult, DateParsePreferences } from '../types/types';
import { convertToTimeZone, convertFromTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

interface ResolverContext {
  referenceDate: Date;
  weekStartsOn: 0 | 1;  // 0 = Sunday, 1 = Monday
  timeZone?: string;
}

const createContext = (preferences: DateParsePreferences): ResolverContext => ({
  referenceDate: preferences.referenceDate || new Date(),
  weekStartsOn: preferences.weekStartsOn || 0,
  timeZone: preferences.timeZone
});

const combineResults = (context: ResolverContext, results: ParseResult[]): ParseResult => {
  const timeResult = results.find(r => r.type === 'single' && r.text.match(/^(?:at\s+)?\d{1,2}(?:\s*:\s*\d{2})?(?:\s*[ap]m)?$/i));
  const dateResult = results.find(r => r !== timeResult && r.type === 'single');

  Logger.debug('Combining results in preference resolver', {
    dateResult: dateResult?.start.toISOString(),
    dateResultHours: dateResult?.start.getHours(),
    dateResultUTCHours: dateResult?.start.getUTCHours(),
    timeResult: timeResult?.start.toISOString(),
    timeResultHours: timeResult?.start.getHours(),
    timeResultUTCHours: timeResult?.start.getUTCHours(),
    timeZone: context.timeZone,
    referenceDate: context.referenceDate.toISOString()
  });

  if (dateResult && timeResult) {
    // Create a DateTime in the target timezone using the date components
    const dt = DateTime.fromJSDate(dateResult.start, { zone: context.timeZone || 'UTC' })
      .set({
        hour: timeResult.start.getUTCHours(),
        minute: timeResult.start.getUTCMinutes(),
        second: timeResult.start.getUTCSeconds(),
        millisecond: timeResult.start.getUTCMilliseconds()
      });

    return {
      type: 'single',
      start: dt.toUTC().toJSDate(),
      text: `${dateResult.text} at ${timeResult.text}`,
      confidence: Math.min(dateResult.confidence, timeResult.confidence)
    };
  }

  return results[0];
};

const applyPreferences = (context: ResolverContext, result: ParseResult): ParseResult => {
  if (!result) return result;

  // Handle timezone conversions if needed
  if (context.timeZone) {
    if (result.type === 'single') {
      result.start = convertToTimeZone(result.start, context.timeZone);
      if (result.end) {
        result.end = convertToTimeZone(result.end, context.timeZone);
      }
    } else if (result.type === 'range' && result.end) {
      result.start = convertToTimeZone(result.start, context.timeZone);
      result.end = convertToTimeZone(result.end, context.timeZone);
    }
  }

  return result;
};

export const resolvePreferences = (results: ParseResult | ParseResult[], preferences: DateParsePreferences): ParseResult => {
  const context = createContext(preferences);
  
  if (!Array.isArray(results)) {
    return applyPreferences(context, results);
  }

  // If we have multiple results (e.g., date + time)
  if (results.length > 1) {
    return combineResults(context, results);
  }
  
  return applyPreferences(context, results[0]);
}; 