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
  let timeOfDayResult: ParseResult | null = null;

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
            Logger.debug('Rule match result:', {
              ruleName: rule.name,
              resultType: result.type,
              text: result.text,
              start: result.start?.toISO(),
              end: result.end?.toISO(),
              confidence: result.confidence
            });

            if (rule.name === 'time-ranges') {
              timeRangeResult = result;
            } else if (rule.name === 'time-only') {
              timeResult = result;
            } else if (rule.name === 'time-of-day') {
              timeOfDayResult = result;
              Logger.debug('Time of day result:', {
                type: result.type,
                start: result.start?.toISO(),
                end: result.end?.toISO()
              });
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
    Logger.debug('Using time range result directly');
    result = resolvePreferences(timeRangeResult, mergedPrefs);
  }
  // Combine date and time results if both exist
  else if (dateResult) {
    if (timeOfDayResult) {
      Logger.debug('Combining date result with time of day:', {
        dateType: dateResult.type,
        timeOfDayType: timeOfDayResult.type
      });
      result = resolvePreferences(dateResult, mergedPrefs, timeOfDayResult);
    } else if (timeRangeResult) {
      Logger.debug('Combining date result with time range');
      result = resolvePreferences(dateResult, mergedPrefs, timeRangeResult);
    } else if (timeResult) {
      Logger.debug('Combining date result with time');
      result = resolvePreferences(dateResult, mergedPrefs, timeResult);
    } else {
      Logger.debug('Using date result only');
      result = resolvePreferences(dateResult, mergedPrefs);
    }
  }
  // Return time result if no date result
  else if (timeOfDayResult) {
    Logger.debug('Using time of day result directly');
    result = resolvePreferences(timeOfDayResult, mergedPrefs);
  } else if (timeResult) {
    Logger.debug('Using time result directly');
    result = resolvePreferences(timeResult, mergedPrefs);
  }

  // Log final result
  if (result) {
    Logger.debug('Final parse result:', {
      type: result.type,
      text: result.text,
      start: result.start?.toISO(),
      end: result.end?.toISO(),
      confidence: result.confidence
    });
  }

  // Attach debug trace if in debug mode
  if (result && mergedPrefs.debug) {
    result.debugTrace = debugTrace.getTrace() || undefined;
  }

  return result;
} 