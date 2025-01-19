import { Logger } from './Logger';

/**
 * Convert a UTC date to a date in the target timezone
 */
export function convertToTimeZone(date: Date, timeZone: string): Date {
  try {
    // Create a formatter in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Get the target timezone's offset at the given date
    const targetParts = formatter.formatToParts(date);
    const values: Record<string, number> = {};
    
    targetParts.forEach(part => {
      if (['year', 'month', 'day', 'hour', 'minute', 'second'].includes(part.type)) {
        values[part.type] = parseInt(part.value);
      }
    });

    // Create a date in UTC with the target timezone's components
    const targetDate = new Date(Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    ));

    Logger.debug('Converted date to timezone', {
      original: date.toISOString(),
      timeZone,
      result: targetDate.toISOString()
    });

    return targetDate;
  } catch (error) {
    Logger.debug('Error converting to timezone', { error, date, timeZone });
    return date;
  }
}

/**
 * Convert a date from a source timezone to UTC
 */
export function convertFromTimeZone(date: Date, timeZone: string): Date {
  try {
    // Create formatters for UTC and source timezone
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Get the parts from both formatters
    const utcParts = utcFormatter.formatToParts(date);
    const sourceParts = sourceFormatter.formatToParts(date);

    // Helper to get value from parts
    const getValue = (parts: Intl.DateTimeFormatPart[], type: string) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value) : 0;
    };

    // Get the time components in source timezone
    const sourceYear = getValue(sourceParts, 'year');
    const sourceMonth = getValue(sourceParts, 'month') - 1; // 0-based month
    const sourceDay = getValue(sourceParts, 'day');
    const sourceHour = getValue(sourceParts, 'hour');
    const sourceMinute = getValue(sourceParts, 'minute');
    const sourceSecond = getValue(sourceParts, 'second');

    // Create a date in UTC with the source timezone's components
    const utcDate = new Date(Date.UTC(sourceYear, sourceMonth, sourceDay, sourceHour, sourceMinute, sourceSecond));

    // Calculate the offset between UTC and source timezone
    const utcTime = getValue(utcParts, 'hour') * 60 + getValue(utcParts, 'minute');
    const sourceTime = sourceHour * 60 + sourceMinute;
    const offsetMinutes = sourceTime - utcTime;

    // Adjust the UTC date by subtracting the offset
    utcDate.setMinutes(utcDate.getMinutes() - offsetMinutes);

    Logger.debug(`Converting from ${timeZone} to UTC:`, {
      input: date.toISOString(),
      output: utcDate.toISOString(),
      offset: offsetMinutes
    });

    return utcDate;
  } catch (error: unknown) {
    Logger.error('Error converting from timezone:', { error: error instanceof Error ? error.message : String(error) });
    return date;
  }
} 