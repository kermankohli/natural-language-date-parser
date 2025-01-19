import { parseTimeString, timeComponentsToString } from '../../src/utils/time-parser';

describe('Time Parser Utils', () => {
  describe('parseTimeString', () => {
    describe('24-hour format', () => {
      it('should parse basic time', () => {
        expect(parseTimeString('14:30')).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 0
        });
      });

      it('should parse time with seconds', () => {
        expect(parseTimeString('14:30:45')).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 45,
          offsetMinutes: 0
        });
      });

      it('should parse UTC timezone', () => {
        expect(parseTimeString('14:30Z')).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 0
        });
      });

      it('should parse positive timezone offset', () => {
        expect(parseTimeString('14:30+02:00')).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 120
        });
      });

      it('should parse negative timezone offset', () => {
        expect(parseTimeString('14:30-05:00')).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: -300
        });
      });
    });

    describe('12-hour format', () => {
      it('should parse AM times', () => {
        expect(parseTimeString('9:30 AM', { allow12Hour: true })).toEqual({
          hours: 9,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 0
        });
      });

      it('should parse PM times', () => {
        expect(parseTimeString('2:30 PM', { allow12Hour: true })).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 0
        });
      });

      it('should handle 12 AM/PM edge cases', () => {
        expect(parseTimeString('12:00 AM', { allow12Hour: true })).toEqual({
          hours: 0,
          minutes: 0,
          seconds: 0,
          offsetMinutes: 0
        });

        expect(parseTimeString('12:00 PM', { allow12Hour: true })).toEqual({
          hours: 12,
          minutes: 0,
          seconds: 0,
          offsetMinutes: 0
        });
      });

      it('should parse with timezone', () => {
        expect(parseTimeString('2:30 PM +02:00', { allow12Hour: true })).toEqual({
          hours: 14,
          minutes: 30,
          seconds: 0,
          offsetMinutes: 120
        });
      });
    });

    describe('validation', () => {
      it('should reject invalid hours', () => {
        expect(parseTimeString('24:00')).toBeNull();
        expect(parseTimeString('13:00 PM', { allow12Hour: true })).toBeNull();
      });

      it('should reject invalid minutes/seconds', () => {
        expect(parseTimeString('12:60')).toBeNull();
        expect(parseTimeString('12:00:60')).toBeNull();
      });

      it('should reject invalid timezone offsets', () => {
        expect(parseTimeString('12:00+15:00')).toBeNull();
        expect(parseTimeString('12:00+00:60')).toBeNull();
      });
    });
  });

  describe('timeComponentsToString', () => {
    it('should format time components with padding', () => {
      const components = {
        hours: 9,
        minutes: 5,
        seconds: 0,
        offsetMinutes: 120
      };

      expect(timeComponentsToString(components)).toEqual({
        hours: '09',
        minutes: '05',
        seconds: '00',
        offsetMinutes: '120'
      });
    });

    it('should handle double-digit values', () => {
      const components = {
        hours: 14,
        minutes: 30,
        seconds: 45,
        offsetMinutes: -300
      };

      expect(timeComponentsToString(components)).toEqual({
        hours: '14',
        minutes: '30',
        seconds: '45',
        offsetMinutes: '-300'
      });
    });
  });
}); 