import { DateTime } from 'luxon';
import { resolvePreferences } from '../src/resolver/preference-resolver';
import { ParseComponent } from '../src/resolver/resolution-engine';

describe('Preference Resolver', () => {
  test('should combine date and time', () => {
    const referenceDate = DateTime.fromISO('2024-03-15T00:00:00.000Z');
    
    const dateResult: ParseComponent = {
      type: 'date',
      value: referenceDate,
      span: { start: 0, end: 10 },
      confidence: 1.0,
      metadata: { originalText: '2024-03-15' }
    };

    const result = resolvePreferences(dateResult, { referenceDate });
    expect((result.value as DateTime).toISO()).toBe('2024-03-15T00:00:00.000Z');
  });

  test('should handle timezone conversions', () => {
    const utcTime: ParseComponent = {
      type: 'date',
      value: DateTime.fromISO('2024-03-14T15:30:00.000Z'),
      span: { start: 0, end: 5 },
      confidence: 1.0,
      metadata: { originalText: '3:30 PM' }
    };

    // Test New York timezone
    const nyResult = resolvePreferences(utcTime, {
      timeZone: 'America/New_York',
      referenceDate: DateTime.fromISO('2024-03-14T00:00:00.000-04:00')
    });

    expect((nyResult.value as DateTime).hour).toBe(15);  // Should still be 3:30 PM wall time
    expect((nyResult.value as DateTime).toUTC().hour).toBe(19);  // But internally is 7:30 PM UTC

    // Test Tokyo timezone
    const tokyoResult = resolvePreferences(utcTime, {
      timeZone: 'Asia/Tokyo',
      referenceDate: DateTime.fromISO('2024-03-14T00:00:00.000+09:00')
    });

    expect((tokyoResult.value as DateTime).hour).toBe(15);  // Should still be 3:30 PM wall time
    expect((tokyoResult.value as DateTime).toUTC().hour).toBe(6);  // But internally is 6:30 AM UTC next day
    expect((tokyoResult.value as DateTime).day).toBe(15);  // Same day in Tokyo
  });

  test('should handle week start preferences', () => {
    const result: ParseComponent = {
      type: 'range',
      value: {
        start: DateTime.fromISO('2024-03-11T00:00:00.000Z'),
        end: DateTime.fromISO('2024-03-17T23:59:59.999Z')
      },
      span: { start: 0, end: 9 },
      confidence: 1.0,
      metadata: { originalText: 'this week' }
    };

    // Test with Monday start
    const mondayResult = resolvePreferences(result, {
      weekStartsOn: 1,
      timeZone: 'UTC'
    });

    expect((mondayResult.value as { start: DateTime; end: DateTime }).start.toUTC().toISO())
      .toBe('2024-03-11T00:00:00.000Z');

    // Test with Sunday start
    const sundayResult = resolvePreferences(result, {
      weekStartsOn: 0,
      timeZone: 'UTC'
    });

    expect((sundayResult.value as { start: DateTime; end: DateTime }).start.toUTC().toISO())
      .toBe('2024-03-10T00:00:00.000Z');
  });
}); 