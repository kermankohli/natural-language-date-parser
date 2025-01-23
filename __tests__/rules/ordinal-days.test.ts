import { DateTime } from 'luxon';
import { createParserState, registerRule } from '../../src/parser/parser-engine';
import { ordinalDaysRule } from '../../src/rules/ordinal-days';
import { Pattern } from '../../src/types/types';

// Helper to find pattern by example input
function findPatternForInput(input: string): Pattern | undefined {
  return ordinalDaysRule.patterns.find(pattern => pattern.regex.test(input));
}

describe('Ordinal Days Rule', () => {
  const referenceDate = DateTime.fromISO('2023-03-14T12:00:00Z');

  test('ordinal days of month', () => {
    const firstInput = '1st of March';
    const pattern = findPatternForInput(firstInput);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(firstInput);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: firstInput.length });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2023-03-01');
      expect(result?.metadata?.dateType).toBe('ordinal');
      expect(result?.metadata?.originalText).toBe(firstInput);
    }

    const fifteenthInput = '15th of March';
    const fifteenthPattern = findPatternForInput(fifteenthInput);
    const fifteenthMatches = fifteenthPattern?.regex.exec(fifteenthInput);
    if (fifteenthMatches && fifteenthPattern) {
      const result = fifteenthPattern.parse(fifteenthMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: fifteenthInput.length });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2023-03-15');
      expect(result?.metadata?.dateType).toBe('ordinal');
      expect(result?.metadata?.originalText).toBe(fifteenthInput);
    }

    const twentyThirdInput = '23rd of March';
    const twentyThirdPattern = findPatternForInput(twentyThirdInput);
    const twentyThirdMatches = twentyThirdPattern?.regex.exec(twentyThirdInput);
    if (twentyThirdMatches && twentyThirdPattern) {
      const result = twentyThirdPattern.parse(twentyThirdMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: twentyThirdInput.length });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2023-03-23');
      expect(result?.metadata?.dateType).toBe('ordinal');
      expect(result?.metadata?.originalText).toBe(twentyThirdInput);
    }

    const thirtyFirstInput = '31st of March';
    const thirtyFirstPattern = findPatternForInput(thirtyFirstInput);
    const thirtyFirstMatches = thirtyFirstPattern?.regex.exec(thirtyFirstInput);
    if (thirtyFirstMatches && thirtyFirstPattern) {
      const result = thirtyFirstPattern.parse(thirtyFirstMatches, { referenceDate });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: thirtyFirstInput.length });
      expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe('2023-03-31');
      expect(result?.metadata?.dateType).toBe('ordinal');
      expect(result?.metadata?.originalText).toBe(thirtyFirstInput);
    }
  });

  test('timezone handling', () => {
    const input = '15th of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate, timeZone: 'America/New_York' });
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: input.length });
      expect((result?.value as DateTime).toUTC().toISO()).toBe('2023-03-15T04:00:00.000Z');
      expect(result?.metadata?.dateType).toBe('ordinal');
      expect(result?.metadata?.originalText).toBe(input);
    }
  });

  test('ordinal variations', () => {
    const variations = [
      { input: 'first of March', expected: '2023-03-01' },
      { input: '1st of March', expected: '2023-03-01' },
      { input: 'second of March', expected: '2023-03-02' },
      { input: '2nd of March', expected: '2023-03-02' },
      { input: 'third of March', expected: '2023-03-03' },
      { input: '3rd of March', expected: '2023-03-03' },
      { input: 'fourth of March', expected: '2023-03-04' },
      { input: '4th of March', expected: '2023-03-04' }
    ];

    for (const { input, expected } of variations) {
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('date');
        expect(result?.span).toEqual({ start: 0, end: input.length });
        expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe(expected);
        expect(result?.metadata?.dateType).toBe('ordinal');
        expect(result?.metadata?.originalText).toBe(input);
      }
    }
  });

  test('numeric ordinals', () => {
    for (let day = 1; day <= 31; day++) {
      const input = `${day}${getOrdinalSuffix(day)} of March`;
      const pattern = findPatternForInput(input);
      expect(pattern).toBeDefined();

      const matches = pattern?.regex.exec(input);
      expect(matches).not.toBeNull();

      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('date');
        expect(result?.span).toEqual({ start: 0, end: input.length });
        expect((result?.value as DateTime).toUTC().toISO()?.slice(0, 10)).toBe(`2023-03-${day.toString().padStart(2, '0')}`);
        expect(result?.metadata?.dateType).toBe('ordinal');
        expect(result?.metadata?.originalText).toBe(input);
      }
    }
  });

  test('basic ordinal day parsing', () => {
    const input = '1st of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 12 });
      expect(result?.metadata?.dateType).toBe('ordinal');
      
      const value = result?.value as DateTime;
      expect(value.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-01');
      
      expect(result?.metadata?.originalText).toBe('1st of March');
    }
  });

  test('ordinal days with month', () => {
    const input = '15th of March';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 13 });
      expect(result?.metadata?.dateType).toBe('ordinal');
      
      const value = result?.value as DateTime;
      expect(value.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-15');
      
      expect(result?.metadata?.originalText).toBe('15th of March');
    }
  });

  test('ordinal days with year', () => {
    const input = '1st of March 2024';
    const pattern = findPatternForInput(input);
    expect(pattern).toBeDefined();

    const matches = pattern?.regex.exec(input);
    expect(matches).not.toBeNull();

    if (matches && pattern) {
      const result = pattern.parse(matches, { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      expect(result?.span).toEqual({ start: 0, end: 17 });
      expect(result?.metadata?.dateType).toBe('ordinal');
      
      const value = result?.value as DateTime;
      expect(value.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-01');
      
      expect(result?.metadata?.originalText).toBe('1st of March 2024');
    }
  });
});

describe('Relative Ordinal Expressions', () => {
  const referenceDate = DateTime.fromISO('2023-03-14T12:00:00Z');

  describe('Before/Until expressions', () => {
    test('simple until', () => {
      const input = 'until the 15th';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        expect(result?.value).toBeDefined();
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-14');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-15');
        }
      }
    });

    test('until with month', () => {
      const input = 'until the 8th of jan';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-14');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-08');
        }
      }
    });

    test('anytime until variations', () => {
      const input = 'anytime from now until the 15th';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-14');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-15');
        }
      }
    });
  });

  describe('After/From expressions', () => {
    test('starting from - future date', () => {
      const input = 'starting from the 26th';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2023-03-26');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2023-04-26');
        }
      }
    });

    test('starting from - past date (should move to next month)', () => {
      const input = 'from the 14th';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2023-04-14');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2023-05-14');
        }
      }
    });

    test('starting from with month', () => {
      const input = 'starting on the 8th of jan';
      const pattern = findPatternForInput(input);
      const matches = pattern?.regex.exec(input);
      
      if (matches && pattern) {
        const result = pattern.parse(matches, { referenceDate });
        expect(result?.type).toBe('range');
        if (result?.type === 'range' && result.value && typeof result.value === 'object' && 'start' in result.value) {
          expect(result.value.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-01-08');
          expect(result.value.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-02-08');
        }
      }
    });
  });
});

function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 