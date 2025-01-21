import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult } from '../types/types';
import { convertToTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';

interface ResolverContext {
  referenceDate: DateTime;
  timeZone?: string;
  weekStartsOn: 0 | 1;
}

export function resolvePreferences(results: ParseResult, preferences: DateParsePreferences): ParseResult {
  Logger.debug('🚀 ~ resolvePreferences ~ input results:', {
    type: results.type,
    start: results.start.toISO(),
    startZone: results.start.zoneName,
    text: results.text
  });

  const context: ResolverContext = {
    referenceDate: preferences.referenceDate || DateTime.now(),
    timeZone: preferences.timeZone,
    weekStartsOn: preferences.weekStartsOn === 1 ? 1 : 0
  };

  Logger.debug('🚀 ~ resolvePreferences ~ context:', {
    referenceDate: context.referenceDate.toISO(),
    referenceZone: context.referenceDate.zoneName,
    timeZone: context.timeZone,
    weekStartsOn: context.weekStartsOn
  });

  if (context.timeZone) {
    Logger.debug('🚀 ~ resolvePreferences ~ before timezone conversion:', {
      start: results.start.toISO(),
      startZone: results.start.zoneName,
      startLocal: results.start.toLocal().toISO()
    });

    // First convert to the target timezone
    results.start = results.start.setZone(context.timeZone, { keepLocalTime: true });
    
    Logger.debug('🚀 ~ resolvePreferences ~ after timezone conversion:', {
      start: results.start.toISO(),
      startZone: results.start.zoneName,
      startUTC: results.start.toUTC().toISO()
    });

    if (results.end) {
      results.end = results.end.setZone(context.timeZone, { keepLocalTime: true });
    }
  }

  return results;
} 