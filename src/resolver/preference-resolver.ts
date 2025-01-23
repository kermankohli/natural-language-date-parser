import { DateTime } from 'luxon';
import { DateParsePreferences } from '../types/types';
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
    // Ensure we have a valid DateTime object
    let result = DateTime.isDateTime(dt) ? dt : DateTime.fromJSDate(new Date(dt));
    
    // If date is relative (no year/month/day), use reference date
    if (!result.isValid || result.year === 1970) {
      // Only set time components if they exist
      const timeComponents: any = {};
      if (!isNaN(result.hour)) timeComponents.hour = result.hour;
      if (!isNaN(result.minute)) timeComponents.minute = result.minute;
      if (!isNaN(result.second)) timeComponents.second = result.second;
      
      result = referenceDate.set(timeComponents);
    }
    
    // For UTC, convert directly to UTC
    if (timeZone === 'UTC') {
      result = result.toUTC();
    }
    // For other timezones, preserve wall time
    else if (!result.zone || result.zone.name !== timeZone) {
      result = result.setZone(timeZone, { keepLocalTime: true });
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