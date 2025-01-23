import { DateTime } from 'luxon';
import { DateParsePreferences, ParseResult, RuleModule } from './types/types';
import { parse, createParserState, registerRule, ParserState } from './parser/parser-engine';
import { absoluteDatesRule } from './rules/absolute-dates';
import { dateOnlyRule } from './rules/date-only';
import { timeOnlyRule } from './rules/time-only';
import { relativeDaysRule } from './rules/relative-days';
import { ordinalDaysRule } from './rules/ordinal-days';
import { partialMonthRule } from './rules/partial-month';
import { ordinalWeeksRule } from './rules/ordinal-weeks';
import { relativeWeeksRule } from './rules/relative-weeks';
import { fuzzyRangesRule } from './rules/fuzzy-ranges';
import { timeRangesRule } from './rules/time-ranges';
import { timeOfDayRule } from './rules/time-of-day';
import { ParseComponent } from './resolver/resolution-engine';

const defaultRules = [
  absoluteDatesRule,  // ISO dates, YYYY-MM-DD etc
  dateOnlyRule,       // Date parsing
  timeOnlyRule,       // Time expressions
  timeRangesRule,     // Time ranges (3 PM to 5 PM)
  timeOfDayRule,      // Time of day expressions (morning, afternoon, etc.)
  relativeDaysRule,   // today, tomorrow, etc
  ordinalDaysRule,    // 1st of March, etc
  partialMonthRule,   // early/mid/late month
  ordinalWeeksRule,   // first week of March
  relativeWeeksRule,  // next week, last week
  fuzzyRangesRule     // beginning of year, etc
];

function componentToResult(component: ParseComponent | null): ParseResult | null {
  if (!component) return null;

  // Map component type to ParseResult type
  const resultType = component.type === 'range' ? 'range' : 'single';

  if (component.type === 'range') {
    const range = component.value as { start: DateTime; end: DateTime };
    return {
      type: resultType,
      confidence: component.confidence,
      start: range.start,
      end: range.end,
      text: component.metadata?.originalText || '',
      debugTrace: component.debugTrace
    };
  }

  const date = component.value as DateTime;
  return {
    type: resultType,
    confidence: component.confidence,
    start: date,
    end: date,
    text: component.metadata?.originalText || '',
    debugTrace: component.debugTrace
  };
}

export const createNLDP = (preferences: DateParsePreferences = {}): NLDP => {
  let state = createParserState(preferences);
  
  // Register default rules
  defaultRules.forEach(rule => {
    state = registerRule(state, rule);
  });

  return {
    parse: (input: string, parsePreferences: DateParsePreferences = {}) => 
      componentToResult(parse(state, input, parsePreferences)),
    
    registerRule: (rule: RuleModule) => {
      state = registerRule(state, rule);
    }
  };
};

export type NLDP = {
  parse: (input: string, preferences?: DateParsePreferences) => ParseResult | null;
  registerRule: (rule: RuleModule) => void;
}; 