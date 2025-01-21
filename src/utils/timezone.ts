import { Logger } from './Logger';
import { DateTime } from 'luxon';

/**
 * Convert a UTC date to a date in the target timezone
 */
export function convertToTimeZone(date: DateTime, timeZone: string): DateTime {
    if (!timeZone) {
        return date;
    }

    const converted = date.setZone(timeZone);
    if (!converted.isValid) {
        return date;
    }

    return converted;
}

/**
 * Convert a date from a source timezone to UTC
 */
export function convertFromTimeZone(date: DateTime, timeZone: string): DateTime {
    if (!timeZone) {
        return date;
    }

    const converted = date.setZone(timeZone).toUTC();
    if (!converted.isValid) {
        return date;
    }

    return converted;
} 