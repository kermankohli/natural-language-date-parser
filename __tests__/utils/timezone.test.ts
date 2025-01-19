import { convertToTimeZone, convertFromTimeZone } from '../../src/utils/timezone';

describe('Timezone Utils', () => {
  describe('convertToTimeZone', () => {
    it('should convert UTC to New York time during standard time', () => {
      // January 1, 2024 at noon UTC (during standard time)
      const utcDate = new Date('2024-01-01T12:00:00Z');
      const nyDate = convertToTimeZone(utcDate, 'America/New_York');
      
      // Should be 7:00 AM in New York (UTC-5 during standard time)
      expect(nyDate.toISOString()).toBe('2024-01-01T07:00:00.000Z');
    });

    it('should convert UTC to New York time during daylight savings', () => {
      // July 1, 2024 at noon UTC (during DST)
      const utcDate = new Date('2024-07-01T12:00:00Z');
      const nyDate = convertToTimeZone(utcDate, 'America/New_York');
      
      // Should be 8:00 AM in New York (UTC-4 during DST)
      expect(nyDate.toISOString()).toBe('2024-07-01T08:00:00.000Z');
    });

    it('should convert UTC to Tokyo time', () => {
      // January 1, 2024 at noon UTC
      const utcDate = new Date('2024-01-01T12:00:00Z');
      const tokyoDate = convertToTimeZone(utcDate, 'Asia/Tokyo');
      
      // Should be 9:00 PM in Tokyo (UTC+9)
      expect(tokyoDate.toISOString()).toBe('2024-01-01T21:00:00.000Z');
    });

    it('should handle invalid timezone by returning original date', () => {
      const utcDate = new Date('2024-01-01T12:00:00Z');
      const result = convertToTimeZone(utcDate, 'Invalid/Timezone');
      expect(result.toISOString()).toBe(utcDate.toISOString());
    });
  });

  describe('convertFromTimeZone', () => {
    it('should convert New York time to UTC during standard time', () => {
      // January 1, 2024 at noon New York time (during standard time)
      const nyDate = new Date('2024-01-01T12:00:00-05:00');
      const utcDate = convertFromTimeZone(nyDate, 'America/New_York');
      
      // Should be 5:00 PM UTC
      expect(utcDate.toISOString()).toBe('2024-01-01T17:00:00.000Z');
    });

    it('should convert New York time to UTC during daylight savings', () => {
      // July 1, 2024 at noon New York time (during DST)
      const nyDate = new Date('2024-07-01T12:00:00-04:00');
      const utcDate = convertFromTimeZone(nyDate, 'America/New_York');
      
      // Should be 4:00 PM UTC
      expect(utcDate.toISOString()).toBe('2024-07-01T16:00:00.000Z');
    });

    it('should convert Tokyo time to UTC', () => {
      // January 1, 2024 at noon Tokyo time
      const tokyoDate = new Date('2024-01-01T12:00:00+09:00');
      const utcDate = convertFromTimeZone(tokyoDate, 'Asia/Tokyo');
      
      // Should be 3:00 AM UTC
      expect(utcDate.toISOString()).toBe('2024-01-01T03:00:00.000Z');
    });

    it('should handle invalid timezone by returning original date', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = convertFromTimeZone(date, 'Invalid/Timezone');
      expect(result.toISOString()).toBe(date.toISOString());
    });
  });
}); 