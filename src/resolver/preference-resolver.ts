import { ParseResult, DateParsePreferences } from '../types/types';

interface ResolverContext {
  referenceDate: Date;
  weekStartsOn: 0 | 1;  // 0 = Sunday, 1 = Monday
  timeZone?: string;  // Changed from timezone to timeZone
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

      return {
        type: 'single',
        start: combinedDate,
        confidence: Math.min(dateResult.confidence, timeResult.confidence),
        text: `${dateResult.text} ${timeResult.text}`
      };
    }

    return results[0];
  }

  private applyPreferences(result: ParseResult): ParseResult {
    if (this.context.weekStartsOn === 0 && result.text === 'start of week') {
      const adjusted = new Date(result.start);
      adjusted.setUTCDate(adjusted.getUTCDate() - 1); // Move back one day for Sunday start
      return { ...result, start: adjusted };
    }
    return result;
  }
} 