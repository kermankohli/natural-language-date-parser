import { DateTime } from 'luxon';
import { createParserState, registerRule, parse } from '../src/parser/parser-engine';
import { DateParsePreferences, Pattern, RuleModule } from '../src/types/types';
import { ParseComponent } from '../src/resolver/resolution-engine';
import { debugTrace } from '../src/utils/debug-trace';

const mockRule: RuleModule = {
  name: 'mock-rule',
  patterns: [
    {
      regex: /^test$/i,
      parse: (_: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
        const date = preferences.referenceDate || DateTime.now();
        return {
          type: 'date',
          value: date.setZone(preferences.timeZone || 'UTC'),
          span: { start: 0, end: 4 },
          confidence: 1.0,
          metadata: {
            originalText: 'test'
          }
        };
      }
    }
  ]
};

describe('Parser Engine', () => {
  test('should parse using registered rules', () => {
    const mockPattern: Pattern = {
      regex: /^test$/,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent => ({
        type: 'date',
        value: (preferences.referenceDate || DateTime.now()).setZone(preferences.timeZone || 'UTC'),
        span: { start: 0, end: matches[0].length },
        confidence: 1.0,
        metadata: {
          originalText: matches[0]
        }
      })
    };

    const mockRule: RuleModule = {
      name: 'mock-rule',
      patterns: [mockPattern]
    };

    const referenceDate = DateTime.fromISO('2025-01-21T00:22:39.609Z');
    const state = createParserState({ referenceDate, timeZone: 'UTC' });
    const stateWithRule = registerRule(state, mockRule);

    const result = parse(stateWithRule, 'test');
    expect(result).toBeDefined();
    expect(result!.type).toBe('date');
    expect(result!.span).toEqual({ start: 0, end: 4 });
    expect(result!.metadata?.originalText).toBe('test');
    expect((result!.value as DateTime).toISO()).toBe(referenceDate.toISO());
  });

  test('should return null for unmatched input', () => {
    const mockPattern: Pattern = {
      regex: /^test$/,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent => ({
        type: 'date',
        value: preferences.referenceDate || DateTime.now(),
        span: { start: 0, end: matches[0].length },
        confidence: 1.0,
        metadata: {
          originalText: matches[0]
        }
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
    expect(result!.type).toBe('date');
    expect(result!.span).toEqual({ start: 0, end: 4 });
    expect(result!.metadata?.originalText).toBe('test');

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