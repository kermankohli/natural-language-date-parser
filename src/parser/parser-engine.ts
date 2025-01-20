import { DateParsePreferences, ParseResult, RuleModule, IntermediateParse } from '../types/types';
import { tokenize, TokenizerOptions } from '../tokenizer/tokenizer';
import { DebugTrace } from '../utils/debug-trace';
import { Logger } from '../utils/Logger';
import { PreferenceResolver } from '../resolver/preference-resolver';

export class ParserEngine {
  private rules: RuleModule[] = [];
  private tokenizerOptions: TokenizerOptions = {};
  private defaultPreferences: DateParsePreferences = {};
  private resolver: PreferenceResolver;

  constructor(preferences: DateParsePreferences = {}) {
    this.defaultPreferences = preferences;
    this.resolver = new PreferenceResolver(preferences);
  }

  /**
   * Register a new rule module
   */
  registerRule(rule: RuleModule): void {
    this.rules.push(rule);
  }

  /**
   * Parse a date/time string
   */
  parse(input: string, preferences: DateParsePreferences = {}): ParseResult | null {
    const mergedPrefs = { ...this.defaultPreferences, ...preferences };
    this.resolver = new PreferenceResolver(mergedPrefs);

    // Regular parsing flow
    const tokens = tokenize(input, this.tokenizerOptions);

    if (mergedPrefs.debug) {
      DebugTrace.startTrace(input);
      DebugTrace.addRuleMatch({
        ruleName: 'tokenizer',
        input,
        matched: true,
        tokens
      });
    }

    // Try each rule module
    for (const rule of this.rules) {
      // Try each pattern in the rule
      for (const pattern of rule.patterns) {
        const joinedTokens = tokens.join(' ');
        const matches = joinedTokens.match(pattern.regex);

        if (mergedPrefs.debug) {
          DebugTrace.addRuleMatch({
            ruleName: `${rule.name}/${pattern.name}`,
            input: joinedTokens,
            matched: !!matches,
            matchedGroups: matches ? Array.from(matches) : undefined
          });
        }

        if (matches) {
          // Get intermediate parse result
          const intermediate = pattern.parse(matches, mergedPrefs);
          if (!intermediate) continue;

          // Convert to final result
          const result = rule.interpret(intermediate, mergedPrefs);
          if (result) {
            if (mergedPrefs.debug) {
              DebugTrace.setFinalResult(result);
            }
            return this.resolver.resolve([{
              ...result,
              text: input
            }]);
          }
        }
      }
    }

    // If no direct match found, check if this is a combined date + time expression
    const combinedMatch = input.match(/^(.+)\s+at\s+(.+)$/i);
    if (combinedMatch) {
      const [, datePart, timePart] = combinedMatch;
      
      // Parse date and time parts separately
      const dateResult = this.parse(datePart, mergedPrefs);
      if (!dateResult) return null;

      // Parse time part without 'at' prefix
      const timeResult = this.parse(timePart, mergedPrefs);
      if (!timeResult) return null;

      // Let the resolver combine the results
      return this.resolver.resolve([dateResult, timeResult]);
    }

    if (mergedPrefs.debug) {
      DebugTrace.setFinalResult(null);
    }

    return null;
  }
} 