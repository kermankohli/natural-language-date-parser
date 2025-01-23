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

  describe('time ranges', () => {
    it('should parse time ranges', () => {
      const result = parser.parse('3:30 PM to 5:00 PM');
      // Check hours in local timezone
      expect(result?.start.setZone(result?.start.zoneName).hour).toBe(15);
      expect(result?.start.setZone(result?.start.zoneName).minute).toBe(30);
      expect(result?.end?.setZone(result?.end?.zoneName).hour).toBe(17);
      expect(result?.end?.setZone(result?.end?.zoneName).minute).toBe(0);
    });

    it('should parse time ranges with dates', () => {
      const result = parser.parse('next tuesday from 3pm to 5pm', {debug: true});
      const nextTuesday = referenceDate.plus({ days: ((2 - referenceDate.weekday + 7) % 7) });
      
      expect(result?.start.toUTC().toISO()?.slice(0, 10))
        .toBe(nextTuesday.toUTC().toISO()?.slice(0, 10));
      expect(result?.start.setZone(result?.start.zoneName).hour).toBe(15);
      expect(result?.start.setZone(result?.start.zoneName).minute).toBe(0);
      expect(result?.end?.setZone(result?.end?.zoneName).hour).toBe(17);
      expect(result?.end?.setZone(result?.end?.zoneName).minute).toBe(0);
      expect(result?.end?.toUTC().toISO()?.slice(0, 10))
        .toBe(nextTuesday.toUTC().toISO()?.slice(0, 10));
    });

    it('should handle timezone-specific ranges', () => {
      const result = parser.parse('next tuesday from 3pm to 5pm', {
        timeZone: 'America/New_York'
      });
      const nextTuesday = referenceDate.setZone('America/New_York').plus({ days: ((2 - referenceDate.weekday + 7) % 7) });
      
      expect(result?.start.zoneName).toBe('America/New_York');
      expect(result?.start.hour).toBe(15);
      expect(result?.start.minute).toBe(0);
      expect(result?.end?.hour).toBe(17);
      expect(result?.end?.minute).toBe(0);
      expect(result?.start.toISO()?.slice(0, 10))
        .toBe(nextTuesday.toISO()?.slice(0, 10));
    });

    it('should handle alternative range formats', () => {
      const result = parser.parse('between 3pm-5pm');
      expect(result?.start.toUTC().hour).toBe(15);
      expect(result?.start.toUTC().minute).toBe(0);
      expect(result?.end?.toUTC().hour).toBe(17);
      expect(result?.end?.toUTC().minute).toBe(0);
    });

    it('should parse next week with time range', () => {
      const result = parser.parse('next week from 9am to 10am',{debug: true});
      expect(result?.start.toUTC().toISO()).toBe('2024-03-18T09:00:00.000Z');
      expect(result?.end?.toUTC().toISO()).toBe('2024-03-24T10:00:00.000Z');
    });
  });

  describe('timezone handling', () => {
    it('should handle timezone conversions', () => {
      const result = parser.parse('tomorrow at 3 PM', {
        timeZone: 'America/New_York'
      });

      expect(result?.start.toISO()).toBe('2024-03-15T15:00:00.000-04:00');

      const result2 = parser.parse('next Monday at 3:30 PM', {
        timeZone: 'America/New_York'
      });

      expect(result2?.start.toISO()).toBe('2024-03-18T15:30:00.000-04:00');
    });

    it('should handle special times in different timezones', () => {
      const result = parser.parse('tomorrow at noon', {
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-03-15T12:00:00.000-04:00');
    });

    it('should handle month boundaries in different timezones', () => {
      const result = parser.parse('beginning of next month', {
        timeZone: 'America/New_York'
      });
      expect(result?.start.toISO()).toBe('2024-04-01T00:00:00.000-04:00');
    });

    it('should handle DST transitions', () => {
      // Test before DST transition
      const result = parser.parse('3 PM', {
        referenceDate,
        timeZone: 'America/New_York'
      });
      expect(result?.start.toUTC().toISO()).toBe('2024-03-14T19:00:00.000Z');

      // Test after DST transition
      const result2 = parser.parse('2 AM', {
        referenceDate,
        timeZone: 'Asia/Tokyo'
      });
      expect(result2?.start.toISO()).toBe('2024-03-14T02:00:00.000+09:00');

      // Test during DST transition
      const before = parser.parse('3 PM', {
        referenceDate: DateTime.fromISO('2024-03-09T12:00:00Z'), // Day before DST
        timeZone: 'America/New_York'
      });
      expect(before?.start.toISO()).toBe('2024-03-09T15:00:00.000-05:00');

      const after = parser.parse('3 PM', {
        referenceDate: DateTime.fromISO('2024-03-10T12:00:00Z'), // Day of DST
        timeZone: 'America/New_York'
      });
      expect(after?.start.toISO()).toBe('2024-03-10T15:00:00.000-04:00');
    });
  });

  describe('Time of Day Integration', () => {
    test('should parse date with time of day', () => {
      const result = parser.parse('tomorrow morning', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.start.hour).toBe(7);
      expect(result?.end?.hour).toBe(11);
    });

    test('should parse date with early/mid/late time of day', () => {
      const earlyResult = parser.parse('tomorrow early morning', { referenceDate });
      expect(earlyResult).not.toBeNull();
      expect(earlyResult?.type).toBe('range');
      expect(earlyResult?.start.hour).toBe(7);
      expect(earlyResult?.end?.hour).toBe(8);

      const midResult = parser.parse('tomorrow mid afternoon', { referenceDate });
      expect(midResult).not.toBeNull();
      expect(midResult?.type).toBe('range');
      expect(midResult?.start.hour).toBe(13);
      expect(midResult?.end?.hour).toBe(14);

      const lateResult = parser.parse('tomorrow late evening', { referenceDate });
      expect(lateResult).not.toBeNull();
      expect(lateResult?.type).toBe('range');
      expect(lateResult?.start.hour).toBe(19);
      expect(lateResult?.end?.hour).toBe(20);
    });

    test('should override time of day with specific time', () => {
      const result = parser.parse('tomorrow morning at 9am', { referenceDate, debug: true });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('single');
      expect(result?.start.toUTC().toISO()).toBe('2024-03-15T09:00:00.000Z');
      expect(result?.end).toBeUndefined();
    });

    test('should handle custom time of day preferences', () => {
      const customPreferences = {
        morning: {
          start: 5,
          end: 11,
          early: { start: 5, end: 7 },
          mid: { start: 7, end: 9 },
          late: { start: 9, end: 11 }
        },
        afternoon: {
          start: 11,
          end: 16,
          early: { start: 11, end: 13 },
          mid: { start: 13, end: 14 },
          late: { start: 14, end: 16 }
        },
        evening: {
          start: 16,
          end: 20,
          early: { start: 16, end: 17 },
          mid: { start: 17, end: 18 },
          late: { start: 18, end: 20 }
        },
        night: {
          start: 20,
          end: 5,
          early: { start: 20, end: 22 },
          mid: { start: 22, end: 1 },
          late: { start: 1, end: 5 }
        }
      };

      const result = parser.parse('tomorrow morning', { 
        referenceDate,
        timeOfDay: customPreferences
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.start.toUTC().hour).toBe(5);
      expect(result?.end?.toUTC().hour).toBe(11);
    });

    test('should handle timezone correctly', () => {
      const result = parser.parse('tomorrow morning', { 
        referenceDate,
        timeZone: 'America/New_York'
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      expect(result?.start.zoneName).toBe('America/New_York');
      expect(result?.start.hour).toBe(7);
      expect(result?.end?.hour).toBe(11);
    });
  });

  describe('relative weeks', () => {
    it('should parse next week correctly', () => {
      const result = parser.parse('next week', {
        timeZone: 'America/New_York'
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      
      // Should be a full week (Monday to Sunday)
      // Get current week's Monday
      const currentWeekStart = referenceDate.startOf('week');  // Luxon uses ISO week by default (Monday)
      // Next week starts 7 days after current week's start
      const weekStart = currentWeekStart.plus({ days: 7 });
      const weekEnd = weekStart.plus({ days: 6 }).endOf('day');

      expect(result?.start.toISO()?.slice(0, 10)).toBe('2024-03-18');  // Monday
      expect(result?.end?.toISO()?.slice(0, 10)).toBe('2024-03-24');   // Sunday
      expect(result?.start.zoneName).toBe('America/New_York');
      expect(result?.end?.zoneName).toBe('America/New_York');
    });

    it('should parse next week with local timezone', () => {
      const localParser = createNLDP({ useLocalTimezone: true });
      const result = localParser.parse('next week');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('range');
      
      // Should be a full week (Monday to Sunday)
      const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = DateTime.now().setZone(localZone);
      // Get current week's Monday
      const currentWeekStart = now.startOf('week');  // Luxon uses ISO week by default (Monday)
      // Next week starts 7 days after current week's start
      const weekStart = currentWeekStart.plus({ days: 7 });
      const weekEnd = weekStart.plus({ days: 6 }).endOf('day');

      expect(result?.start.zoneName).toBe(localZone);
      expect(result?.end?.zoneName).toBe(localZone);
      expect(result?.start.toISO()?.slice(0, 10)).toBe('2025-01-27');  // Monday
      expect(result?.end?.toISO()?.slice(0, 10)).toBe('2025-02-02');   // Sunday
    });
  });

  describe('time of day with relative weeks', () => {
    it('should parse afternoon next week', () => {
      const result = parser.parse('afternoon next week', { debug: true });
      expect(result?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-18');
      expect(result?.start.hour).toBe(12); // Afternoon starts at 12:00
      expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-24');
      expect(result?.end?.hour).toBe(16); // Afternoon ends at 16:00
    });

    it('should parse early morning this week', () => {
      const result = parser.parse('early morning this week', { debug: true });
      expect(result?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-11');
      expect(result?.start.hour).toBe(7); // Early morning starts at 7:00
      expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-17');
      expect(result?.end?.hour).toBe(8); // Early morning ends at 8:00
    });

    it('should parse evening last week', () => {
      const result = parser.parse('evening last week', { debug: true });
      expect(result?.start.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-04');
      expect(result?.start.hour).toBe(17); // Evening starts at 17:00
      expect(result?.end?.toUTC().toISO()?.slice(0, 10)).toBe('2024-03-10');
      expect(result?.end?.hour).toBe(20); // Evening ends at 20:00
    });

    it('should handle timezone correctly', () => {
      const result = parser.parse('afternoon next week', {
        timeZone: 'America/New_York',
        debug: true
      });
      expect(result?.start.zoneName).toBe('America/New_York');
      expect(result?.start.hour).toBe(12); // Afternoon starts at 12:00 local time
      expect(result?.end?.hour).toBe(16); // Afternoon ends at 16:00 local time
    });
  });
}); 