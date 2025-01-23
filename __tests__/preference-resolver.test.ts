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

    const result = resolvePreferences(dateResult, { referenceDate, timeZone: 'UTC' });
    expect((result.value as DateTime).toUTC().toISO()).toBe('2024-03-15T00:00:00.000Z');
  });

  test('should handle timezone conversions', () => {
    // Start with 3:30 PM in New York time
    const nyTime: ParseComponent = {
      type: 'date',
      value: DateTime.fromISO('2024-03-14T15:30:00.000-04:00', { zone: 'America/New_York' }),
      span: { start: 0, end: 5 },
      confidence: 1.0,
      metadata: { originalText: '3:30 PM' }
    };

    // Test New York timezone
    const nyResult = resolvePreferences(nyTime, {
      timeZone: 'America/New_York',
      referenceDate: DateTime.fromISO('2024-03-14T00:00:00.000-04:00')
    });

    expect((nyResult.value as DateTime).hour).toBe(15);  // Should be 3:30 PM NY time
    expect((nyResult.value as DateTime).toUTC().hour).toBe(19);  // 7:30 PM UTC

    // Test Tokyo timezone (next day due to time difference)
    const tokyoResult = resolvePreferences(nyTime, {
      timeZone: 'Asia/Tokyo',
      referenceDate: DateTime.fromISO('2024-03-14T00:00:00.000+09:00')
    });

    expect((tokyoResult.value as DateTime).hour).toBe(15);  // Should preserve 3:30 PM wall time
    expect((tokyoResult.value as DateTime).toUTC().hour).toBe(6);  // 6:30 AM UTC next day
    expect((tokyoResult.value as DateTime).day).toBe(14);  // Same day in Tokyo
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
      .toBe('2024-03-11T00:00:00.000Z');
  });
}); 