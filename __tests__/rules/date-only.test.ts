import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { dateOnlyRule } from '../../src/rules/date-only';

describe('Date Only Rule', () => {
  const referenceDate = new Date('2024-03-14T12:00:00Z');
  let state: any;

  beforeEach(() => {
    state = createParserState({ referenceDate });
    state = registerRule(state, dateOnlyRule);
  });

  describe('ISO date format', () => {
    it('should parse valid ISO dates', () => {
      expect(parse(state, '2024-03-20')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-20');
      
      expect(parse(state, '2024-12-31')?.start.toISOString().slice(0, 10))
        .toBe('2024-12-31');
      
      expect(parse(state, '2025-01-01')?.start.toISOString().slice(0, 10))
        .toBe('2025-01-01');
    });

    it('should reject invalid dates', () => {
      // Invalid month
      expect(parse(state, '2024-13-01')).toBeNull();
      expect(parse(state, '2024-00-01')).toBeNull();

      // Invalid day
      expect(parse(state, '2024-12-32')).toBeNull();
      expect(parse(state, '2024-12-00')).toBeNull();
    });

    it('should set time to start of day in UTC', () => {
      const result = parse(state, '2024-03-20');
      expect(result?.start.toISOString()).toBe('2024-03-20T00:00:00.000Z');
    });

    it('should respect timezone preferences', () => {
      // Create a new state with New York timezone
      const nyState = createParserState({ 
        referenceDate,
        timeZone: 'America/New_York'
      });
      const stateWithRule = registerRule(nyState, dateOnlyRule);

      // When parsing just a date (no time), it should always be UTC midnight
      // regardless of timezone, as per ISO-8601
      const result = parse(stateWithRule, '2024-03-20');
      expect(result?.start.toISOString()).toBe('2024-03-20T00:00:00.000Z');
    });
  });
}); 