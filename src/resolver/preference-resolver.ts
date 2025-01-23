import { DateTime } from 'luxon';
import { DateParsePreferences } from '../types/types';
import { Logger } from '../utils/Logger';
import { ParseComponent } from './resolution-engine';

/**
 * Apply preferences to a parse result
 * - Applies timezone
 * - Handles reference date for relative dates
 * - Applies time of day preferences if needed
 */
export function resolvePreferences(
  result: ParseComponent,
  preferences: DateParsePreferences
): ParseComponent {
  const referenceDate = preferences.referenceDate || DateTime.now();
  const timeZone = preferences.timeZone || 'UTC';

  // Helper to apply timezone and reference date to a DateTime
  const applyToDateTime = (dt: DateTime): DateTime => {
    let result = dt;
    
    // If date is relative (no year/month/day), use reference date
    if (!dt.isValid || dt.year === 1970) {
      result = referenceDate.set({
        hour: dt.hour,
        minute: dt.minute,
        second: dt.second
      });
    }
    
    // For UTC, convert directly to UTC
    if (timeZone === 'UTC') {
      result = dt.toUTC();
    }
    // For other timezones, preserve wall time
    else if (dt.zone.name !== timeZone) {
      result = dt.setZone(timeZone, { keepLocalTime: true });
    }
    
    return result;
  };

  // Apply preferences based on result type
  if (result.type === 'range') {
    const range = result.value as { start: DateTime; end: DateTime };
    return {
      ...result,
      value: {
        start: applyToDateTime(range.start),
        end: applyToDateTime(range.end)
      }
    };
  } else {
    return {
      ...result,
      value: applyToDateTime(result.value as DateTime)
    };
  }
} 