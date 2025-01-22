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

  for (const rule of state.rules) {
    // Try each pattern in the rule
    for (const pattern of rule.patterns) {
      const matches = pattern.regex.exec(input);

      if (matches) {

        if (mergedPrefs.debug) {
          debugTrace.addRuleMatch({
            ruleName: rule.name,
            input: matches.join(' '),
            matched: true
          });
        }

        try {
          const result = pattern.parse(matches, mergedPrefs);
          if (result) {

            if (rule.name === 'time-only') {
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

  // Combine date and time results if both exist
  if (dateResult && timeResult) {
    const combinedResult: ParseResult = {
      type: 'single',
      start: dateResult.start.set({
        hour: timeResult.start.hour,
        minute: timeResult.start.minute,
        second: timeResult.start.second
      }),
      confidence: Math.min(dateResult.confidence, timeResult.confidence),
      text: input
    };

    if (mergedPrefs.debug) {
      const trace = debugTrace.getTrace();
      if (trace) {
        combinedResult.debugTrace = trace;
      }
    }

    return resolvePreferences(combinedResult, mergedPrefs);
  }

  // Return date or time result if only one exists
  if (dateResult) {
    if (mergedPrefs.debug) {
      const trace = debugTrace.getTrace();
      if (trace) {
        dateResult.debugTrace = trace;
      }
    }
    return resolvePreferences(dateResult, mergedPrefs);
  }
  if (timeResult) {
    if (mergedPrefs.debug) {
      const trace = debugTrace.getTrace();
      if (trace) {
        timeResult.debugTrace = trace;
      }
    }
    return resolvePreferences(timeResult, mergedPrefs);
  }

  return null;
} 