/**
 * Configuration options for date parsing
 */
export interface DateParsePreferences {
  referenceDate?: Date;        // Date to use as "now" for relative dates
  startOfWeek?: 0 | 1 | 6;     // 0 = Sunday, 1 = Monday, 6 = Saturday
  timeZone?: string;           // IANA time zone identifier
  debug?: boolean;             // Enable debug logging
  weekStartDay?: 0 | 1;        // 0 = Sunday, 1 = Monday
}

/**
 * Result of a successful date/time parse
 */
export interface ParseResult {
  type: 'single' | 'range';
  start: Date;
  end?: Date;                  // Only present when type === 'range'
  text: string;               // Original input text
  confidence: number;         // 0-1 indicating parse confidence
}

/**
 * Intermediate parse result before final interpretation
 */
export interface IntermediateParse {
  type: 'absolute' | 'relative' | 'range' | 'time' | 'ordinal';
  tokens: string[];           // Matched tokens
  pattern: string;            // Name of matched pattern
  captures: Record<string, string>; // Named captures from pattern match
}

/**
 * A module containing rules for parsing dates
 */
export interface RuleModule {
  name: string;
  patterns: Array<{
    name: string;
    regex: RegExp;
    parse: (matches: RegExpMatchArray, prefs: DateParsePreferences) => IntermediateParse | null;
  }>;
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences) => ParseResult | null;
} 