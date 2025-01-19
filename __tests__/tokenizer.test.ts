import { tokenize, TokenizerOptions } from '../src/tokenizer/tokenizer';

describe('Tokenizer', () => {
  it('should handle empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(' ')).toEqual([]);
  });

  it('should tokenize simple strings', () => {
    expect(tokenize('next monday')).toEqual(['next', 'monday']);
    expect(tokenize('today at 3pm')).toEqual(['today', 'at', '3pm']);
  });

  it('should handle quoted strings', () => {
    const options: TokenizerOptions = { preserveQuotes: true };
    expect(tokenize('meet "john doe" tomorrow', options))
      .toEqual(['meet', '"john doe"', 'tomorrow']);
  });

  it('should normalize spaces by default', () => {
    expect(tokenize('next    monday')).toEqual(['next', 'monday']);
    expect(tokenize('  today  at   3pm  ')).toEqual(['today', 'at', '3pm']);
  });

  it('should convert to lowercase by default', () => {
    expect(tokenize('Next Monday')).toEqual(['next', 'monday']);
    expect(tokenize('TODAY at 3PM')).toEqual(['today', 'at', '3pm']);
  });

  it('should preserve case when specified', () => {
    const options: TokenizerOptions = { lowercaseTokens: false };
    expect(tokenize('Next Monday', options)).toEqual(['Next', 'Monday']);
  });
}); 