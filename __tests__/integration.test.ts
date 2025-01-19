import { NLDP } from '../src/nldp';

describe('NLDP Integration Tests', () => {
  let parser: NLDP;
  const referenceDate = new Date('2024-03-14T12:00:00Z'); // Thursday, March 14, 2024

  beforeEach(() => {
    parser = new NLDP({ referenceDate });
  });

  describe('absolute dates', () => {
    it('should parse ISO dates', () => {
      expect(parser.parse('2024-03-20')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-20');
    });

    it('should parse dates with slashes', () => {
      expect(parser.parse('03/20/2024')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-20');
    });
  });

  describe('date-time combinations', () => {
    it('should parse ISO datetime', () => {
      const result = parser.parse('2024-03-20T15:30:00Z');
      expect(result?.start.toISOString()).toBe('2024-03-20T15:30:00.000Z');
    });

    it('should parse 12-hour time', () => {
      const result = parser.parse('2024-03-20 3:30 PM');
      expect(result?.start.toISOString()).toBe('2024-03-20T15:30:00.000Z');
    });
  });

  describe('time expressions', () => {
    it('should parse simple time', () => {
      const result = parser.parse('at 3:30 PM');
      expect(result?.start.getUTCHours()).toBe(15);
      expect(result?.start.getUTCMinutes()).toBe(30);
    });

    it('should parse special times', () => {
      expect(parser.parse('at noon')?.start.getUTCHours()).toBe(12);
      expect(parser.parse('at midnight')?.start.getUTCHours()).toBe(0);
    });
  });

  describe('relative days', () => {
    it('should parse today/tomorrow/yesterday', () => {
      expect(parser.parse('today')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-14');
      expect(parser.parse('tomorrow')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-15');
      expect(parser.parse('yesterday')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-13');
    });

    it('should parse X days ago/from now', () => {
      expect(parser.parse('3 days ago')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-11');
      expect(parser.parse('3 days from now')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-17');
    });
  });

  describe('ordinal days', () => {
    it('should parse ordinal days of month', () => {
      expect(parser.parse('1st of March')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-01');
      expect(parser.parse('15th of March')?.start.toISOString().slice(0, 10))
        .toBe('2024-03-15');
    });
  });

  describe('partial month expressions', () => {
    it('should parse early/mid/late month', () => {
      const early = parser.parse('early March');
      expect(early?.type).toBe('range');
      expect(early?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
      expect(early?.end?.toISOString().slice(0, 10)).toBe('2024-03-10');

      const mid = parser.parse('mid March');
      expect(mid?.start.toISOString().slice(0, 10)).toBe('2024-03-11');
      expect(mid?.end?.toISOString().slice(0, 10)).toBe('2024-03-20');

      const late = parser.parse('late March');
      expect(late?.start.toISOString().slice(0, 10)).toBe('2024-03-21');
      expect(late?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
    });
  });

  describe('week expressions', () => {
    it('should parse ordinal weeks', () => {
      const firstWeek = parser.parse('first week of March');
      expect(firstWeek?.type).toBe('range');
      expect(firstWeek?.start.toISOString().slice(0, 10)).toBe('2024-03-01');
      
      const lastWeek = parser.parse('last week of March');
      expect(lastWeek?.end?.toISOString().slice(0, 10)).toBe('2024-03-31');
    });

    it('should parse relative weeks', () => {
      expect(parser.parse('next week')?.type).toBe('range');
      expect(parser.parse('last week')?.type).toBe('range');
      expect(parser.parse('this week')?.type).toBe('range');
    });
  });

  describe('fuzzy ranges', () => {
    it('should parse beginning/middle/end of period', () => {
      expect(parser.parse('beginning of year')?.type).toBe('range');
      expect(parser.parse('middle of month')?.type).toBe('range');
      expect(parser.parse('end of week')?.type).toBe('range');
    });
  });

  describe('debug mode', () => {
    it('should provide debug trace', () => {
      const result = parser.parse('next Monday at 3pm', { debug: true });
      expect(result).toBeTruthy();
    });
  });
}); 