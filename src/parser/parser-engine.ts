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

const intermediateToResult = (intermediate: IntermediateParse, rule: RuleModule, prefs: DateParsePreferences): ParseResult | null => {
  // If the rule has an interpret function, use it
  if (rule.interpret) {
    return rule.interpret(intermediate, prefs);
  }

  // Otherwise, convert directly if we have the required fields
  if (intermediate.start && intermediate.text && intermediate.confidence) {
    if (intermediate.type === 'range' && intermediate.end) {
      return {
        type: 'range',
        start: intermediate.start,
        end: intermediate.end,
        text: intermediate.text,
        confidence: intermediate.confidence
      };
    }
    return {
      type: 'single',
      start: intermediate.start,
      end: intermediate.end,
      text: intermediate.text,
      confidence: intermediate.confidence
    };
  }

  return null;
};

export function parse(state: ParserState, input: string, preferences?: DateParsePreferences): ParseResult | null {
  const mergedPrefs = {
    ...state.defaultPreferences,
    ...preferences
  };

  // Regular parsing flow
  const tokens = tokenize(input, state.tokenizerOptions);

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

    return resolvePreferences(combinedResult, mergedPrefs);
  }

  // Return date or time result if only one exists
  if (dateResult) {
    return resolvePreferences(dateResult, mergedPrefs);
  }
  if (timeResult) {
    return resolvePreferences(timeResult, mergedPrefs);
  }

  return null;
} 