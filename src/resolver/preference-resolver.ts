import { ParseResult, DateParsePreferences } from '../types/types';
import { convertToTimeZone, convertFromTimeZone } from '../utils/timezone';
import { Logger } from '../utils/Logger';

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
    const dateResult = results.find(r => r.type === 'single' && r.start.getFullYear() > 1970);
    const timeResult = results.find(r => r.type === 'single' && r.start.getFullYear() === 1970);

    if (dateResult && timeResult) {
      const combinedDate = new Date(dateResult.start);
      combinedDate.setUTCHours(
        timeResult.start.getUTCHours(),
        timeResult.start.getUTCMinutes(),
        timeResult.start.getUTCSeconds()
      );

      // Apply timezone if specified
      const finalDate = this.context.timeZone 
        ? convertToTimeZone(combinedDate, this.context.timeZone)
        : combinedDate;

      return {
        type: 'single',
        start: finalDate,
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

    // Apply timezone if specified
    if (this.context.timeZone) {
      Logger.debug('Applying timezone preference', {
        timeZone: this.context.timeZone,
        before: adjustedResult.start.toISOString()
      });

      adjustedResult.start = convertToTimeZone(adjustedResult.start, this.context.timeZone);
      if (adjustedResult.end) {
        adjustedResult.end = convertToTimeZone(adjustedResult.end, this.context.timeZone);
      }

      Logger.debug('Applied timezone preference', {
        after: adjustedResult.start.toISOString()
      });
    }

    return adjustedResult;
  }
} 