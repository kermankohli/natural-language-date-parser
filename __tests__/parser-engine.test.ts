import { ParserEngine } from '../src/parser/parser-engine';
import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../src/types/types';
import { DebugTrace } from '../src/utils/debug-trace';

// Create a dummy rule module for testing
const dummyRule: RuleModule = {
  name: 'dummy',
  patterns: [
    {
      name: 'today',
      regex: /^today$/i,
      parse: (matches: RegExpMatchArray, prefs: DateParsePreferences): IntermediateParse => ({
        type: 'relative',
        tokens: ['today'],
        pattern: 'today',
        captures: {}
      })
    }
  ],
  interpret: (intermediate: IntermediateParse, prefs: DateParsePreferences): ParseResult => ({
    type: 'single',
    start: new Date(),
    confidence: 1.0,
    text: 'today'
  })
};

describe('ParserEngine', () => {
  let parser: ParserEngine;

  beforeEach(() => {
    parser = new ParserEngine();
    parser.registerRule(dummyRule);
    DebugTrace.clear(); // Clear any previous traces
  });

  it('should parse using registered rules', () => {
    const result = parser.parse('today');
    expect(result).toBeTruthy();
    expect(result?.type).toBe('single');
    expect(result?.confidence).toBe(1.0);
  });

  it('should return null for unmatched input', () => {
    const result = parser.parse('not a valid date');
    expect(result).toBeNull();
  });

  it('should record debug trace when debug is enabled', () => {
    parser.parse('today', { debug: true });
    const trace = DebugTrace.getTrace();
    
    expect(trace).toBeTruthy();
    expect(trace?.input).toBe('today');
    expect(trace?.matchAttempts).toHaveLength(2); // One for tokenizer, one for rule match
    expect(trace?.matchAttempts[0].ruleName).toBe('tokenizer');
    expect(trace?.matchAttempts[1].ruleName).toBe('dummy/today');
    expect(trace?.matchAttempts[1].matched).toBe(true);
    expect(trace?.finalResult).toBeTruthy();
  });

  it('should record failed matches in debug trace', () => {
    parser.parse('not a valid date', { debug: true });
    const trace = DebugTrace.getTrace();
    
    expect(trace).toBeTruthy();
    expect(trace?.input).toBe('not a valid date');
    expect(trace?.matchAttempts[1].matched).toBe(false);
    expect(trace?.finalResult).toBeNull();
  });
}); 