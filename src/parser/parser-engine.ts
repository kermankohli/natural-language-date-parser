import { DateParsePreferences, ParseResult, RuleModule, IntermediateParse } from '../types/types';
import { tokenize, TokenizerOptions } from '../tokenizer/tokenizer';
import { DebugTrace } from '../utils/debug-trace';

export class ParserEngine {
  private rules: RuleModule[] = [];
  private tokenizerOptions: TokenizerOptions = {
    preserveQuotes: false,
    normalizeSpaces: true,
    lowercaseTokens: true
  };

  constructor(private defaultPreferences: DateParsePreferences = {}) {}

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
            return {
              ...result,
              text: input // Include original input text
            };
          }
        }
      }
    }

    if (mergedPrefs.debug) {
      DebugTrace.setFinalResult(null);
    }

    return null;
  }
} 