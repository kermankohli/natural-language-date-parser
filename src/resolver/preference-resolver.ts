import { ParseResult, DateParsePreferences } from '../types/types';
import { convertToTimeZone, convertFromTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

interface ResolverContext {
  referenceDate: Date;
  weekStartsOn: 0 | 1;  // 0 = Sunday, 1 = Monday
  timeZone?: string;
}

export class PreferenceResolver {
  private context: ResolverContext;

  constructor(preferences: DateParsePreferences) {
    this.context = {
      referenceDate: preferences.referenceDate || new Date(),
      weekStartsOn: preferences.weekStartsOn || 0,
      timeZone: preferences.timeZone
    };
  }

  resolve(results: ParseResult[]): ParseResult {
    // If we have multiple results (e.g., date + time)
    if (results.length > 1) {
      return this.combineResults(results);
    }
    
    return this.applyPreferences(results[0]);
  }

  private combineResults(results: ParseResult[]): ParseResult {
    const timeResult = results.find(r => r.type === 'single' && r.text.match(/^(?:at\s+)?\d{1,2}(?:\s*:\s*\d{2})?(?:\s*[ap]m)?$/i));
    const dateResult = results.find(r => r !== timeResult && r.type === 'single');

    Logger.debug('Combining results in preference resolver', {
      dateResult: dateResult?.start.toISOString(),
      dateResultHours: dateResult?.start.getHours(),
      dateResultUTCHours: dateResult?.start.getUTCHours(),
      timeResult: timeResult?.start.toISOString(),
      timeResultHours: timeResult?.start.getHours(),
      timeResultUTCHours: timeResult?.start.getUTCHours(),
      timeZone: this.context.timeZone,
      referenceDate: this.context.referenceDate.toISOString()
    });

    if (dateResult && timeResult) {
      Logger.debug('Time components before combining', {
        timeResultHours: timeResult.start.getUTCHours(),
        timeResultMinutes: timeResult.start.getUTCMinutes(),
        timeResultSeconds: timeResult.start.getUTCSeconds()
      });

      // First get the UTC components from both results
      const dateUTC = dateResult.start;
      const timeUTC = timeResult.start;

      // Create a new date with the date components from dateUTC and time components from timeUTC
      const combinedDate = new Date(Date.UTC(
        dateUTC.getUTCFullYear(),
        dateUTC.getUTCMonth(),
        dateUTC.getUTCDate(),
        timeUTC.getUTCHours(),
        timeUTC.getUTCMinutes(),
        timeUTC.getUTCSeconds()
      ));

      Logger.debug('Combined date details', {
        dateUTC: dateUTC.toISOString(),
        timeUTC: timeUTC.toISOString(),
        combinedDateISO: combinedDate.toISOString(),
        combinedDateLocal: combinedDate.toLocaleString('en-US', { timeZone: this.context.timeZone }),
        timeZone: this.context.timeZone
      });

      return {
        type: 'single',
        start: combinedDate,
        confidence: Math.min(dateResult.confidence, timeResult.confidence),
        text: `${dateResult.text} ${timeResult.text}`
      };
    }

    return this.applyPreferences(results[0]);
  }

  private applyPreferences(result: ParseResult): ParseResult {
    let adjustedResult = { ...result };

    // Handle week start preference
    if (this.context.weekStartsOn === 0 && result.text === 'start of week') {
      const adjusted = new Date(result.start);
      adjusted.setUTCDate(adjusted.getUTCDate() - 1); // Move back one day for Sunday start
      adjustedResult.start = adjusted;
    }

    // Convert from local time to UTC if timezone specified
    if (this.context.timeZone) {
      Logger.debug('Applying timezone preference', {
        timeZone: this.context.timeZone,
        before: adjustedResult.start.toISOString()
      });

      adjustedResult.start = convertFromTimeZone(adjustedResult.start, this.context.timeZone);
      if (adjustedResult.end) {
        adjustedResult.end = convertFromTimeZone(adjustedResult.end, this.context.timeZone);
      }

      Logger.debug('Applied timezone preference', {
        after: adjustedResult.start.toISOString()
      });
    }

    return adjustedResult;
  }
} 