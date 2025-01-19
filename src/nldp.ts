import { ParserEngine } from './parser/parser-engine';
import { DateParsePreferences, ParseResult } from './types/types';
import { absoluteDatesRule } from './rules/absolute-dates';
import { dateTimeRule } from './rules/date-time';
import { timeOnlyRule } from './rules/time-only';
import { relativeDaysRule } from './rules/relative-days';
import { ordinalDaysRule } from './rules/ordinal-days';
import { partialMonthRule } from './rules/partial-month';
import { ordinalWeeksRule } from './rules/ordinal-weeks';
import { relativeWeeksRule } from './rules/relative-weeks';
import { fuzzyRangesRule } from './rules/fuzzy-ranges';

export class NLDP {
  private engine: ParserEngine;

  constructor(preferences: DateParsePreferences = {}) {
    this.engine = new ParserEngine(preferences);
    this.registerDefaultRules();
  }

  /**
   * Parse a natural language date/time string
   */
  parse(input: string, preferences: DateParsePreferences = {}): ParseResult | null {
    return this.engine.parse(input, preferences);
  }

  /**
   * Register a custom rule module
   */
  registerRule(rule: any): void {
    this.engine.registerRule(rule);
  }

  private registerDefaultRules(): void {
    // Register rules in order of precedence
    this.engine.registerRule(absoluteDatesRule);  // ISO dates, YYYY-MM-DD etc
    this.engine.registerRule(dateTimeRule);       // Date + time combinations
    this.engine.registerRule(timeOnlyRule);       // Time expressions
    this.engine.registerRule(relativeDaysRule);   // today, tomorrow, etc
    this.engine.registerRule(ordinalDaysRule);    // 1st of March, etc
    this.engine.registerRule(partialMonthRule);   // early/mid/late month
    this.engine.registerRule(ordinalWeeksRule);   // first week of March
    this.engine.registerRule(relativeWeeksRule);  // next week, last week
    this.engine.registerRule(fuzzyRangesRule);    // beginning of year, etc
  }
} 