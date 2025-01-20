import { DateParsePreferences, ParseResult, RuleModule, IntermediateParse } from '../types/types';
import { tokenize, TokenizerOptions } from '../tokenizer/tokenizer';
import { debugTrace } from '../utils/debug-trace';
import { Logger } from '../utils/Logger';
import { resolvePreferences } from '../resolver/preference-resolver';

export type ParserState = {
  rules: RuleModule[];
  tokenizerOptions: TokenizerOptions;
  defaultPreferences: DateParsePreferences;
};

export const createParserState = (preferences: DateParsePreferences = {}): ParserState => ({
  rules: [],
  tokenizerOptions: {},
  defaultPreferences: preferences,
});

export const registerRule = (state: ParserState, rule: RuleModule): ParserState => ({
  ...state,
  rules: [...state.rules, rule]
});

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

export const parse = (
  state: ParserState,
  input: string,
  preferences: DateParsePreferences = {}
): ParseResult | null => {
  const mergedPrefs = { ...state.defaultPreferences, ...preferences };
  
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
  for (const rule of state.rules) {
    // Try each pattern in the rule
    for (const pattern of rule.patterns) {
      const joinedTokens = tokens.join(' ');
      const matches = joinedTokens.match(pattern.regex);

      if (matches) {
        if (mergedPrefs.debug) {
          debugTrace.addRuleMatch({
            ruleName: rule.name,
            input: joinedTokens,
            matched: true
          });
        }

        try {
          const intermediate = pattern.parse(matches, mergedPrefs);
          if (!intermediate) continue;

          const result = intermediateToResult(intermediate, rule, mergedPrefs);
          if (result) {
            const finalResult = resolvePreferences(result, mergedPrefs);
            if (finalResult) {
              Logger.debug(`Matched rule: ${rule.name}`);
              return finalResult;
            }
          }
        } catch (err) {
          Logger.error(`Error in rule ${rule.name}:`, { error: err });
          continue;
        }
      } else if (mergedPrefs.debug) {
        debugTrace.addRuleMatch({
          ruleName: rule.name,
          input: joinedTokens,
          matched: false
        });
      }
    }
  }

  if (mergedPrefs.debug) {
    debugTrace.endTrace();
  }

  return null;
} 