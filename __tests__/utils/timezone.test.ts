import { DateTime } from 'luxon';
import { convertToTimeZone, convertFromTimeZone } from '../../src/utils/timezone';

describe('Timezone Utils', () => {
  describe('convertToTimeZone', () => {
    test('should convert UTC to New York time during standard time', () => {
      const utcDate = DateTime.fromISO('2024-01-01T12:00:00Z');
      const nyDate = convertToTimeZone(utcDate, 'America/New_York');
      
      // Should be 7:00 AM in New York (UTC-5 during standard time)
      expect(nyDate.toUTC().toISO()).toBe('2024-01-01T12:00:00.000Z');
      expect(nyDate.hour).toBe(7);
    });

    test('should convert UTC to New York time during daylight savings', () => {
      const utcDate = DateTime.fromISO('2024-07-01T12:00:00Z');
      const nyDate = convertToTimeZone(utcDate, 'America/New_York');
      
      // Should be 8:00 AM in New York (UTC-4 during DST)
      expect(nyDate.toUTC().toISO()).toBe('2024-07-01T12:00:00.000Z');
      expect(nyDate.hour).toBe(8);
    });

    test('should convert UTC to Tokyo time', () => {
      const utcDate = DateTime.fromISO('2024-01-01T12:00:00Z');
      const tokyoDate = convertToTimeZone(utcDate, 'Asia/Tokyo');
      
      // Should be 9:00 PM in Tokyo (UTC+9)
      expect(tokyoDate.toUTC().toISO()).toBe('2024-01-01T12:00:00.000Z');
      expect(tokyoDate.hour).toBe(21);
    });

    test('should handle invalid timezone by returning original date', () => {
      const utcDate = DateTime.fromISO('2024-01-01T12:00:00Z');
      const result = convertToTimeZone(utcDate, 'Invalid/Timezone');
      expect(result.toISO()).toBe(utcDate.toISO());
    });
  });

  describe('convertFromTimeZone', () => {
    test('should convert New York time to UTC during standard time', () => {
      const nyDate = DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 7 }, { zone: 'America/New_York' });
      const utcDate = convertFromTimeZone(nyDate, 'America/New_York');
      expect(utcDate.toISO()).toBe('2024-01-01T12:00:00.000Z');
    });

    test('should convert New York time to UTC during daylight savings', () => {
      const nyDate = DateTime.fromObject({ year: 2024, month: 7, day: 1, hour: 8 }, { zone: 'America/New_York' });
      const utcDate = convertFromTimeZone(nyDate, 'America/New_York');
      expect(utcDate.toISO()).toBe('2024-07-01T12:00:00.000Z');
    });

    test('should handle invalid timezone by returning original date', () => {
      const date = DateTime.fromISO('2024-01-01T12:00:00Z');
      const result = convertFromTimeZone(date, 'Invalid/Timezone');
      expect(result.toISO()).toBe(date.toISO());
    });
  });
}); 