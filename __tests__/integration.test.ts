import { createNLDP } from '../src/nldp';
import { DateTime } from 'luxon';

describe('Natural Language Date Parser', () => {
  let parser: any;
  const referenceDate = DateTime.fromISO('2024-03-14T12:00:00Z');

  beforeEach(() => {
    parser = createNLDP({ referenceDate });
  });

  describe('absolute dates', () => {
    it('should parse ISO dates', () => {
      expect(parser.parse('2024-03-20')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-20');
    });

    it('should parse MM/DD/YYYY dates', () => {
      expect(parser.parse('03/20/2024')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-20');
    });
  });

  describe('absolute dates and times', () => {
    it('should parse dates with times', () => {
      const result = parser.parse('2024-03-20 at 3:30 PM');
      expect(result?.start.toUTC().toISO()).toBe('2024-03-20T15:30:00.000Z');
    });

    it('should parse dates with times in 24h format', () => {
      const result = parser.parse('2024-03-20 at 15:30');
      expect(result?.start.toUTC().toISO()).toBe('2024-03-20T15:30:00.000Z');
    });
  });

  describe('time parsing', () => {
    it('should parse times in 12h format', () => {
      const result = parser.parse('3:30 PM');
      expect(result?.start.toUTC().hour).toBe(15);
      expect(result?.start.toUTC().minute).toBe(30);
    });

    it('should parse special times', () => {
      expect(parser.parse('at noon')?.start.toUTC().hour).toBe(12);
      expect(parser.parse('at midnight')?.start.toUTC().hour).toBe(0);
    });
  });

  describe('relative dates', () => {
    it('should parse relative dates', () => {
      expect(parser.parse('today')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-14');
      expect(parser.parse('tomorrow')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-15');
      expect(parser.parse('yesterday')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-13');
    });

    it('should parse relative dates with offsets', () => {
      expect(parser.parse('3 days ago')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-11');
      expect(parser.parse('3 days from now')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-17');
    });
  });

  describe('ordinal dates', () => {
    it('should parse ordinal dates', () => {
      expect(parser.parse('1st of March')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-01');
      expect(parser.parse('15th of March')?.start.toUTC().toISO()?.slice(0, 10))
        .toBe('2024-03-15');
    });
  });

  describe('fuzzy ranges', () => {
    it('should parse fuzzy ranges', () => {
      const early = parser.parse('beginning of March');
      expect(early?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-01');
      expect(early?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');

      const mid = parser.parse('middle of March');
      expect(mid?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
      expect(mid?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-20');

      const late = parser.parse('end of March');
      expect(late?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-21');
      expect(late?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
    });
  });

  describe('ordinal weeks', () => {
    it('should parse ordinal weeks', () => {
      const firstWeek = parser.parse('first week of March');
      expect(firstWeek?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');

      const lastWeek = parser.parse('last week of March');
      expect(lastWeek?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-31');
    });
  });

  describe('timezone handling', () => {
    it('should handle timezone conversions', () => {
      const result = parser.parse('tomorrow at 3 PM', {
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-03-15T15:00:00.000Z');

      const result2 = parser.parse('next Monday at 3:30 PM', {
        timeZone: 'America/New_York'
      });
      expect(result2?.start.toISO()).toBe('2024-03-18T15:30:00.000Z');
    });

    it('should handle special times in different timezones', () => {
      const result = parser.parse('tomorrow at noon', {
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-03-17T12:00:00.000Z');
    });

    it('should handle month boundaries in different timezones', () => {
      const result = parser.parse('beginning of next month', {
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-04-01T00:00:00.000Z');
    });

    it('should handle DST transitions', () => {
      // Test before DST transition
      const result = parser.parse('3 PM', {
        referenceDate,
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-03-14T19:00:00.000Z');

      // Test after DST transition
      const result2 = parser.parse('2 AM', {
        referenceDate,
        timeZone: 'Asia/Tokyo'
      });
      expect(result2?.start.toISO()).toBe('2024-03-14T06:00:00.000Z');

      // Test during DST transition
      const before = parser.parse('3 PM', {
        referenceDate: DateTime.fromISO('2024-03-09T12:00:00Z'), // Day before DST
        timeZone: 'America/New_York'
      });
      expect(before?.start.toISO()).toBe('2024-03-09T20:00:00.000Z');

      const after = parser.parse('3 PM', {
        referenceDate: DateTime.fromISO('2024-03-10T12:00:00Z'), // Day of DST
        timeZone: 'America/New_York'
      });
      expect(after?.start.toISO()).toBe('2024-03-10T19:00:00.000Z');
    });
  });
}); 