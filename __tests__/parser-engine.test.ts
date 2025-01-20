import { createParserState, registerRule, parse } from '../src/parser/parser-engine';
import { RuleModule, IntermediateParse, DateParsePreferences } from '../src/types/types';
import { debugTrace } from '../src/utils/debug-trace';

describe('Parser Engine', () => {
  const mockRule: RuleModule = {
    name: 'mock-rule',
    patterns: [{
      name: 'mock-pattern',
      regex: /test/,
      parse: (matches: RegExpMatchArray, prefs: DateParsePreferences) => ({
        type: 'single',
        start: new Date(),
        text: 'test',
        confidence: 1.0
      })
    }]
  };

  beforeEach(() => {
    debugTrace.clear();
  });

  it('should register and use rules', () => {
    let state = createParserState();
    state = registerRule(state, mockRule);

    const result = parse(state, 'test');
    expect(result).toBeTruthy();
    expect(result?.type).toBe('single');
  });

  it('should handle no matches', () => {
    let state = createParserState();
    state = registerRule(state, mockRule);

    const result = parse(state, 'no match');
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
}); 