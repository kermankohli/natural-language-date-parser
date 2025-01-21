export const VERSION = '0.1.0';

export * from './types/types';
export * from './tokenizer/tokenizer';
export * from './nldp';

// This file will be expanded as we implement the parser
console.log('Date parser initialized');

export { NLDP } from './nldp';
export { DateParsePreferences, ParseResult, RuleModule } from './types/types';

// Export individual rules for custom configurations
export { absoluteDatesRule } from './rules/absolute-dates';
export { dateOnlyRule } from './rules/date-only';
export { timeOnlyRule } from './rules/time-only';
export { ordinalDaysRule } from './rules/ordinal-days';
export { partialMonthRule } from './rules/partial-month';
export { ordinalWeeksRule } from './rules/ordinal-weeks';
export { relativeWeeksRule } from './rules/relative-weeks';
export { fuzzyRangesRule } from './rules/fuzzy-ranges'; 