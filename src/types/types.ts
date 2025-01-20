/**
 * Configuration options for date parsing
 */
export type DateParsePreferences = {
  referenceDate?: Date;        // Date to use as "now" for relative dates
  timeZone?: string;           // IANA time zone identifier
  weekStartsOn?: 0 | 1;        // 0 = Sunday, 1 = Monday
  parser?: {
    parse: (input: string, prefs: DateParsePreferences) => ParseResult | null;
  };
  debug?: boolean;             // Enable debug logging
};

/**
 * Result of a successful date/time parse
 */
export type ParseResult = SingleDateResult | DateRangeResult;

export interface SingleDateResult {
  type: 'single';
  start: Date;
  end?: Date;                  // Only present when type === 'range'
  text: string;               // Original input text
  confidence: number;         // 0-1 indicating parse confidence
}

export interface DateRangeResult {
  type: 'range';
  start: Date;
  end: Date;
  text: string;
  confidence: number;
}

/**
 * Intermediate parse result before final interpretation
 */
export interface IntermediateParse {
  type: 'single' | 'range' | 'absolute' | 'relative' | 'time' | 'ordinal' | 'datetime';
  start?: Date;
  end?: Date;
  text?: string;
  confidence?: number;
  pattern?: string;
  captures?: { [key: string]: string };
  tokens?: string[];
}

/**
 * A module containing rules for parsing dates
 */
export interface RulePattern {
  name: string;
  regex: RegExp;
  parse: (matches: RegExpMatchArray, prefs: DateParsePreferences) => IntermediateParse | null;
}

export interface RuleModule {
  name: string;
  patterns: RulePattern[];
  interpret?: (intermediate: IntermediateParse, prefs: DateParsePreferences) => ParseResult | null;
} 