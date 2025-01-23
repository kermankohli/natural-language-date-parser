import { RuleModule, IntermediateParse, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { DateTime } from 'luxon';
import { ParseComponent } from '../resolver/resolution-engine';

function createWeekComponent(
  start: DateTime,
  end: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  // If timezone is specified, convert to that timezone
  // If no timezone is specified, use UTC
  const targetZone = preferences.timeZone || 'UTC';
  
  // Convert to target timezone preserving the absolute time
  let startResult = start.setZone(targetZone);
  let endResult = end.setZone(targetZone);
  
  return {
    type: 'date',
    span,
    value: {
      start: startResult,
      end: endResult
    },
    confidence: 1,
    metadata: {
      originalText,
      dateType: 'relative',
      rangeType: 'relativeWeek'
    }
  };
}

function getWeekRange(date: DateTime, weekStartsOn: number = 0): { start: DateTime; end: DateTime } {
  // First, convert to UTC to ensure consistent calculations
  const utcDate = date.toUTC();
  const zone = date.zoneName || 'UTC';
  
  // Convert weekStartsOn from 0-6 (Sunday=0) to 1-7 (Monday=1) for Luxon
  const luxonWeekStart = weekStartsOn === 0 ? 7 : weekStartsOn;
  const currentWeekday = utcDate.weekday;

  // Calculate days to subtract to get to the start of the week
  // For weekStartsOn = 1 (Monday):
  // - If current day is Sunday (7), we need to subtract 6 days
  // - If current day is Monday (1), we need to subtract 0 days
  // - If current day is Tuesday (2), we need to subtract 1 day, etc.
  const daysToSubtract = currentWeekday >= luxonWeekStart
    ? currentWeekday - luxonWeekStart
    : currentWeekday + (7 - luxonWeekStart);

  // Get the start of the week by subtracting the calculated days
  const start = utcDate.minus({ days: daysToSubtract }).startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');

  // Convert back to original timezone
  const startInZone = start.setZone(zone);
  const endInZone = end.setZone(zone);

  return { start: startInZone, end: endInZone };
}

function getNextWeekRange(date: DateTime, weekStartsOn: number = 0): { start: DateTime; end: DateTime } {
  const currentWeek = getWeekRange(date, weekStartsOn);
  // Next week starts 7 days after current week start
  const nextWeekStart = currentWeek.start.plus({ days: 7 });
  return getWeekRange(nextWeekStart, weekStartsOn);
}

function getLastWeekRange(date: DateTime, weekStartsOn: number = 0): { start: DateTime; end: DateTime } {
  const currentWeek = getWeekRange(date, weekStartsOn);
  // Last week starts 7 days before current week start
  const lastWeekStart = currentWeek.start.minus({ days: 7 });
  return getWeekRange(lastWeekStart, weekStartsOn);
}

function createDateComponent(
  date: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  return {
    type: 'date',
    span,
    value: date,
    confidence: 1,
    metadata: {
      originalText,
      dateType: 'relative'
    }
  };
}

function createRangeComponent(
  start: DateTime,
  end: DateTime,
  span: { start: number; end: number },
  originalText: string,
  preferences: DateParsePreferences
): ParseComponent {
  return {
    type: 'range',
    span,
    value: { start, end },
    confidence: 1,
    metadata: {
      originalText,
      dateType: 'relative',
      rangeType: 'relativeWeek'
    }
  };
}

const patterns: Pattern[] = [
  {
    regex: /^(this|next|last)\s+week$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch, modifier] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      let range;
      switch (modifier.toLowerCase()) {
        case 'next':
          range = getNextWeekRange(referenceDate, weekStartsOn);
          break;
        case 'last':
          range = getLastWeekRange(referenceDate, weekStartsOn);
          break;
        default:
          range = getWeekRange(referenceDate, weekStartsOn);
      }

      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  },
  {
    regex: /^(the\s+)?week\s+after\s+next$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      const nextWeek = getNextWeekRange(referenceDate, weekStartsOn);
      const weekAfterNext = getNextWeekRange(nextWeek.start, weekStartsOn);

      return createWeekComponent(weekAfterNext.start, weekAfterNext.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  },
  {
    regex: /^(\d+)\s+weeks?\s+(from\s+now|ago)$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch, count, direction] = matches;
      const weeks = parseInt(count);
      if (isNaN(weeks)) return null;

      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      const currentWeek = getWeekRange(referenceDate, weekStartsOn);
      const targetDate = direction.includes('ago')
        ? currentWeek.start.minus({ days: weeks * 7 })
        : currentWeek.start.plus({ days: weeks * 7 });

      const range = getWeekRange(targetDate, weekStartsOn);
      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  },
  {
    regex: /^upcoming\s+week$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn || 0;

      const range = getNextWeekRange(referenceDate, weekStartsOn);
      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  }
];

export const relativeWeeksRule: RuleModule = {
  name: 'relative-weeks',
  patterns
};
