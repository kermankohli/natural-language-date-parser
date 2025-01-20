import { createParserState, registerRule, parse } from '../../src/parser/parser-engine';
import { ordinalDaysRule } from '../../src/rules/ordinal-days';

describe('Ordinal Days Rule', () => {
  const referenceDate = new Date('2023-03-14T12:00:00Z'); // Thursday, March 14, 2023 (non-leap year)
  let state: any;

  beforeEach(() => {
    state = createParserState({ referenceDate });
    state = registerRule(state, ordinalDaysRule);
  });

  describe('basic parsing', () => {
    it('should parse ordinal days of month', () => {
      const firstOfMarch = parse(state, '1st of March');
      expect(firstOfMarch?.start.toISOString().slice(0, 10)).toBe('2023-03-01');

      const fifteenthOfMarch = parse(state, '15th of March');
      expect(fifteenthOfMarch?.start.toISOString().slice(0, 10)).toBe('2023-03-15');

      const twentyThirdOfMarch = parse(state, '23rd of March');
      expect(twentyThirdOfMarch?.start.toISOString().slice(0, 10)).toBe('2023-03-23');

      const thirtyFirstOfMarch = parse(state, '31st of March');
      expect(thirtyFirstOfMarch?.start.toISOString().slice(0, 10)).toBe('2023-03-31');
    });

    it('should set time to start of day in UTC', () => {
      const result = parse(state, '15th of March');
      expect(result?.start.toISOString()).toBe('2023-03-15T00:00:00.000Z');
    });
  });

  describe('format variations', () => {
    it('should handle different ordinal formats', () => {
      const formats = [
        '1st of March',
        'March 1st',
        'the 1st of March',
        '1st March',
        'March the 1st'
      ];

      formats.forEach(format => {
        const result = parse(state, format);
        expect(result?.start.toISOString().slice(0, 10)).toBe('2023-03-01');
      });
    });

    it('should handle different month formats', () => {
      const variations = [
        ['15th of March', '2023-03-15'],
        ['15th of Mar', '2023-03-15'],
        ['15th of MARCH', '2023-03-15'],
        ['15th of march', '2023-03-15'],
        ['15 of March', '2023-03-15'],
        ['15th March', '2023-03-15']
      ];

      variations.forEach(([input, expected]) => {
        const result = parse(state, input);
        expect(result?.start.toISOString().slice(0, 10)).toBe(expected);
      });
    });

    it('should handle all ordinal suffixes', () => {
      const ordinals = [
        ['1st', '01'], ['2nd', '02'], ['3rd', '03'], ['4th', '04'],
        ['21st', '21'], ['22nd', '22'], ['23rd', '23'], ['24th', '24'],
        ['31st', '31']
      ];

      ordinals.forEach(([ordinal, day]) => {
        const result = parse(state, `${ordinal} of March`);
        expect(result?.start.toISOString().slice(0, 10)).toBe(`2023-03-${day}`);
      });
    });
  });

  describe('validation', () => {
    it('should handle invalid dates', () => {
      const invalidDates = [
        '31st of February',  // February never has 31 days
        '32nd of March',     // No month has 32 days
        '0th of March',      // No 0th day
        '29th of February',  // Not a leap year (2023)
        '-1st of March',     // No negative days
        '1st of Marchh',     // Misspelled month
        '1st of Mar 2024'    // Year not supported in this format
      ];

      invalidDates.forEach(date => {
        expect(parse(state, date)).toBeNull();
      });
    });

    it('should validate days per month', () => {
      // Test 31-day months
      const longMonths = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
      longMonths.forEach(month => {
        expect(parse(state, `31st of ${month}`)?.start).toBeTruthy();
      });

      // Test 30-day months
      const shortMonths = ['April', 'June', 'September', 'November'];
      shortMonths.forEach(month => {
        expect(parse(state, `31st of ${month}`)).toBeNull();
        expect(parse(state, `30th of ${month}`)?.start).toBeTruthy();
      });

      // Test February in non-leap year (2023)
      expect(parse(state, '29th of February')).toBeNull();
      
      // Test February in leap year (2024)
      const leapState = createParserState({ 
        referenceDate: new Date('2024-02-01T12:00:00Z')
      });
      const stateWithRule = registerRule(leapState, ordinalDaysRule);
      expect(parse(stateWithRule, '29th of February')?.start).toBeTruthy();
    });
  });
}); 