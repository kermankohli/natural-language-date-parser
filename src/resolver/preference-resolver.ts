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
      const combinedDate = new Date(dateResult.start);
      
      Logger.debug('Combined date initial state', {
        combinedDate: combinedDate.toISOString(),
        hours: combinedDate.getHours(),
        utcHours: combinedDate.getUTCHours(),
        localString: combinedDate.toString()
      });

      combinedDate.setHours(
        timeResult.start.getHours(),
        timeResult.start.getMinutes(),
        timeResult.start.getSeconds()
      );

      Logger.debug('Combined date after setting hours', {
        combinedDate: combinedDate.toISOString(),
        hours: combinedDate.getHours(),
        utcHours: combinedDate.getUTCHours(),
        localString: combinedDate.toString(),
        timeResultHours: timeResult.start.getHours(),
        timeResultMinutes: timeResult.start.getMinutes()
      });

      // Convert from local time to UTC if timezone specified
      const finalDate = this.context.timeZone 
        ? convertFromTimeZone(combinedDate, this.context.timeZone)
        : combinedDate;

      Logger.debug('Combined date after timezone conversion', {
        finalDate: finalDate.toISOString(),
        hours: finalDate.getHours(),
        utcHours: finalDate.getUTCHours(),
        localString: finalDate.toString(),
        timeZone: this.context.timeZone
      });

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