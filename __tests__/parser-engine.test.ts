import { ParserEngine } from '../src/parser/parser-engine';
import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences } from '../src/types/types';

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

  it('should handle debug mode', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    parser.parse('today', { debug: true });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
}); 