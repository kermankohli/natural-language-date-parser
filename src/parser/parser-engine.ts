import { DateParsePreferences, ParseResult, RuleModule, IntermediateParse } from '../types/types';
import { tokenize, TokenizerOptions } from '../tokenizer/tokenizer';
import { debugTrace } from '../utils/debug-trace';
import { Logger } from '../utils/Logger';
import { resolvePreferences } from '../resolver/preference-resolver';

export interface ParserState {
  rules: RuleModule[];
  tokenizerOptions: TokenizerOptions;
  defaultPreferences: DateParsePreferences;
}

export function createParserState(preferences: DateParsePreferences): ParserState {
  return {
    rules: [],
    tokenizerOptions: {},
    defaultPreferences: preferences,
  };
}

export function registerRule(state: ParserState, rule: RuleModule): ParserState {
  return {
    ...state,
    rules: [...state.rules, rule]
  };
}

export function parse(state: ParserState, input: string, preferences?: DateParsePreferences): ParseResult | null {
  const mergedPrefs = {
    ...state.defaultPreferences,
    ...preferences
  };

  if (mergedPrefs.debug) {
    debugTrace.startTrace(input);
    debugTrace.addRuleMatch({
      ruleName: 'tokenizer',
      input,
      matched: true
    });
  }

  // Try each rule module
  let dateResult: ParseResult | null = null;
  let timeResult: ParseResult | null = null;
  let timeRangeResult: ParseResult | null = null;

  for (const rule of state.rules) {
    // Try each pattern in the rule
    for (const pattern of rule.patterns) {
      const matches = pattern.regex.exec(input);

      if (matches) {
        if (mergedPrefs.debug) {
          debugTrace.addRuleMatch({
            ruleName: rule.name,
            input: matches[0],
            matched: true
          });
        }

        try {
          const result = pattern.parse(matches, mergedPrefs);
          if (result) {
            if (rule.name === 'time-ranges') {
              timeRangeResult = result;
            } else if (rule.name === 'time-only') {
              timeResult = result;
            } else {
              dateResult = result;
            }
          }
        } catch (err) {
          Logger.error(`Error in rule ${rule.name}:`, { error: err });
          continue;
        }
      } else if (mergedPrefs.debug) {
        debugTrace.addRuleMatch({
          ruleName: rule.name,
          input: input,
          matched: false
        });
      }
    }
  }

  if (mergedPrefs.debug) {
    debugTrace.endTrace();
  }

  let result: ParseResult | null = null;

  // Return time range result directly if no date result
  if (timeRangeResult && !dateResult) {
    result = resolvePreferences(timeRangeResult, mergedPrefs);
  }
  // Combine date and time results if both exist
  else if (dateResult) {
    if (timeRangeResult) {
      result = resolvePreferences(dateResult, mergedPrefs, timeRangeResult);
    } else if (timeResult) {
      result = resolvePreferences(dateResult, mergedPrefs, timeResult);
    } else {
      result = resolvePreferences(dateResult, mergedPrefs);
    }
  }
  // Return time result if no date result
  else if (timeResult) {
    result = resolvePreferences(timeResult, mergedPrefs);
  }

  // Attach debug trace if in debug mode
  if (result && mergedPrefs.debug) {
    result.debugTrace = debugTrace.getTrace() || undefined;
  }

  return result;
} 