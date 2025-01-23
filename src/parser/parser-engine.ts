import { DateParsePreferences, ParseResult, RuleModule } from '../types/types';
import { TokenizerOptions } from '../tokenizer/tokenizer';
import { debugTrace, ParseTrace } from '../utils/debug-trace';
import { Logger } from '../utils/Logger';
import { ParseComponent, resolveComponents } from '../resolver/resolution-engine';
import { resolvePreferences } from '../resolver/preference-resolver';
import { DateTime } from 'luxon';

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

export function parse(state: ParserState, input: string, preferences?: DateParsePreferences): ParseComponent | null {
  const mergedPrefs = {
    ...state.defaultPreferences,
    ...preferences
  };

  if (mergedPrefs.debug) {
    debugTrace.startTrace(input);
  }

  // Collect all components from all rules
  const components: ParseComponent[] = [];

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
          if (isParseComponent(result)) {
            Logger.debug('Rule match component:', {
              ruleName: rule.name,
              componentType: result.type,
              span: result.span,
              confidence: result.confidence,
              value: isDateTimeRange(result.value)
                ? {
                    start: result.value.start.toISO(),
                    end: result.value.end.toISO()
                  }
                : result.value.toISO()
            });
            
            components.push(result);
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

  // No components found
  if (components.length === 0) {
    if (mergedPrefs.debug) {
      debugTrace.endTrace();
    }
    return null;
  }

  // Resolve components into a result
  const result = resolveComponents(components, input);
  
  if (!result) {
    if (mergedPrefs.debug) {
      debugTrace.endTrace();
    }
    return null;
  }

  // Apply preferences to the result
  const finalResult = resolvePreferences(result, mergedPrefs);

  // Add debug trace if in debug mode
  if (mergedPrefs.debug) {
    const trace = debugTrace.getTrace();
    if (trace) {
      finalResult.debugTrace = trace;
    }
    debugTrace.endTrace();
  }

  return finalResult;
}

// Type guards
function isParseComponent(value: any): value is ParseComponent {
  return (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    'span' in value &&
    'value' in value &&
    'confidence' in value
  );
}

function isDateTimeRange(value: DateTime | { start: DateTime; end: DateTime }): value is { start: DateTime; end: DateTime } {
  return typeof value === 'object' && 'start' in value && 'end' in value;
} 