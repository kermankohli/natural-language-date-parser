import { DateTime } from 'luxon';
import { createParserState, registerRule, parse } from '../src/parser/parser-engine';
import { DateParsePreferences, ParseResult, Pattern, RuleModule } from '../src/types/types';
import { debugTrace } from '../src/utils/debug-trace';

const mockRule: RuleModule = {
  name: 'mock-rule',
  patterns: [
    {
      regex: /^test$/i,
      parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const date = preferences.referenceDate || DateTime.now();
        return {
          type: 'single',
          start: date,
          confidence: 1,
          text: 'test'
        };
      }
    }
  ]
};

describe('Parser Engine', () => {
  test('should parse using registered rules', () => {
    const mockPattern: Pattern = {
      regex: /^test$/,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => ({
        type: 'single',
        start: preferences.referenceDate || DateTime.now(),
        confidence: 1,
        text: matches[0]
      })
    };

    const mockRule: RuleModule = {
      name: 'mock-rule',
      patterns: [mockPattern]
    };

    const referenceDate = DateTime.fromISO('2025-01-21T00:22:39.609Z');
    const state = createParserState({ referenceDate });
    const stateWithRule = registerRule(state, mockRule);

    const result = parse(stateWithRule, 'test');
    expect(result).toBeDefined();
    expect(result?.type).toBe('single');
    expect(result?.text).toBe('test');
  });

  test('should return null for unmatched input', () => {
    const mockPattern: Pattern = {
      regex: /^test$/,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult => ({
        type: 'single',
        start: preferences.referenceDate || DateTime.now(),
        confidence: 1,
        text: matches[0]
      })
    };

    const mockRule: RuleModule = {
      name: 'mock-rule',
      patterns: [mockPattern]
    };

    const referenceDate = DateTime.fromISO('2025-01-21T00:22:39.609Z');
    const state = createParserState({ referenceDate });
    const stateWithRule = registerRule(state, mockRule);

    const result = parse(stateWithRule, 'no match');
    expect(result).toBeNull();
  });

  it('should handle debug mode', () => {
    let state = createParserState({ debug: true });
    state = registerRule(state, mockRule);

    const result = parse(state, 'test');
    expect(result).toBeTruthy();

    const trace = debugTrace.getTrace();
    expect(trace).toBeTruthy();
    expect(trace?.matchAttempts.length).toBeGreaterThan(0);
  });

  test('should register rules', () => {
    let state = createParserState({});
    state = registerRule(state, mockRule);
    expect(state.rules).toHaveLength(1);
  });
}); 