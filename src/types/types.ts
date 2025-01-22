import { DateTime } from 'luxon';
import { ParseTrace } from '../utils/debug-trace';


/**
 * Configuration options for date parsing
 */
export interface TimeOfDayPreferences {
  morning: {
    start: number;  // hour in 24h format (e.g. 6 for 6am)
    end: number;    // hour in 24h format (e.g. 12 for 12pm)
    early: { start: number; end: number };
    mid: { start: number; end: number };
    late: { start: number; end: number };
  };
  afternoon: {
    start: number;
    end: number;
    early: { start: number; end: number };
    mid: { start: number; end: number };
    late: { start: number; end: number };
  };
  evening: {
    start: number;
    end: number;
    early: { start: number; end: number };
    mid: { start: number; end: number };
    late: { start: number; end: number };
  };
  night: {
    start: number;
    end: number;
    early: { start: number; end: number };
    mid: { start: number; end: number };
    late: { start: number; end: number };
  };
}

export interface DateParsePreferences {
  referenceDate?: DateTime;        // Date to use as "now" for relative dates
  timeZone?: string;           // IANA time zone identifier
  weekStartsOn?: number;        // 0 = Sunday, 1 = Monday
  timeOfDay?: TimeOfDayPreferences;
  parser?: {
    parse: (input: string, prefs: DateParsePreferences) => ParseResult | null;
  };
  debug?: boolean;             // Enable debug logging
}

/**
 * Result of a successful date/time parse
 */
export interface ParseResult {
  type: 'single' | 'range';
  start: DateTime;
  end?: DateTime;
  confidence: number;
  text: string;
  debugTrace?: ParseTrace;
}

export interface ParserState {
  preferences: DateParsePreferences;
  rules: RuleModule[];
}

export interface RuleModule {
  name: string;
  patterns: Pattern[];
  interpret?: (intermediate: IntermediateParse, prefs: DateParsePreferences) => ParseResult | null;
}

export interface Pattern {
  regex: RegExp;
  parse: (matches: RegExpExecArray, preferences: DateParsePreferences) => ParseResult | null;
}

export interface SingleDateResult {
  type: 'single';
  start: DateTime;
  end?: DateTime;                  // Only present when type === 'range'
  text: string;               // Original input text
  confidence: number;         // 0-1 indicating parse confidence
}

export interface DateRangeResult {
  type: 'range';
  start: DateTime;
  end: DateTime;
  text: string;
  confidence: number;
}

/**
 * Intermediate parse result before final interpretation
 */
export interface IntermediateParse {
  type: 'single' | 'range' | 'absolute' | 'relative' | 'time' | 'ordinal' | 'datetime';
  start?: DateTime;
  end?: DateTime;
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