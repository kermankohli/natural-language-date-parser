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
  // Use the timezone from preferences, or keep the original timezone if none specified
  const targetZone = preferences.timeZone || (start.zoneName || 'UTC');
  
  // Only convert if target timezone is different from current
  let startResult = start.zoneName !== targetZone ? start.setZone(targetZone) : start;
  let endResult = end.zoneName !== targetZone ? end.setZone(targetZone) : end;
  
  return {
    type: 'range',
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

function getWeekRange(date: DateTime, weekStartsOn: number = 1, preferences: DateParsePreferences): { start: DateTime; end: DateTime } {
  // First, ensure we're in the right timezone
  const targetZone = preferences.timeZone || (date.zoneName || 'UTC');
  const operationalDate = date.zoneName !== targetZone ? date.setZone(targetZone) : date;
  console.log('operationalDate', operationalDate)
  
  // Convert weekStartsOn from 0-6 (Sunday=0) to 1-7 (Monday=1) for Luxon
  const luxonWeekStart = weekStartsOn === 0 ? 7 : weekStartsOn;
  console.log('weekStartsOn', weekStartsOn)
  console.log('luxonWeekStart', luxonWeekStart)

  // Use Luxon's built-in startOf('week') with the correct weekday
  const start = operationalDate.set({ weekday: luxonWeekStart as 1|2|3|4|5|6|7 }).startOf('day');
  console.log('start',  start)
  const end = start.plus({ days: 6 }).endOf('day');
  console.log('end', end)

  // If we're past the week start, move to next week
  if (operationalDate.weekday < luxonWeekStart) {
    return { start: start.minus({ weeks: 1 }), end: end.minus({ weeks: 1 }) };
  }

  return { start, end };
}

function getNextWeekRange(date: DateTime, weekStartsOn: number = 1, preferences: DateParsePreferences): { start: DateTime; end: DateTime } {
  const { start } = getWeekRange(date, weekStartsOn, preferences);
  // Simply add 7 days to both start and end of current week
  const nextStart = start.plus({ weeks: 1 });
  const nextEnd = nextStart.plus({ days: 6 }).endOf('day');
  return { start: nextStart, end: nextEnd };
}

function getLastWeekRange(date: DateTime, weekStartsOn: number = 1, preferences: DateParsePreferences): { start: DateTime; end: DateTime } {
  const { start } = getWeekRange(date, weekStartsOn, preferences);
  // Simply subtract 7 days from both start and end of current week
  const lastStart = start.minus({ weeks: 1 });
  const lastEnd = lastStart.plus({ days: 6 }).endOf('day');
  return { start: lastStart, end: lastEnd };
}

const patterns: Pattern[] = [
  {
    regex: /^(this|next|last)\s+week(?:\s+|$)/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch, modifier] = matches;

      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn;
      
      let range;
      switch (modifier.toLowerCase()) {
        case 'next':
          console.log('next')
          range = getNextWeekRange(referenceDate, weekStartsOn, preferences);
          break;
        case 'last':
          console.log('last')
          range = getLastWeekRange(referenceDate, weekStartsOn, preferences);
          break;
        default:
          console.log('default')
          range = getWeekRange(referenceDate, weekStartsOn, preferences);
      }

      console.log(range)
      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  },
  {
    regex: /^(the\s+)?week\s+after\s+next$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn;

      const nextWeek = getNextWeekRange(referenceDate, weekStartsOn, preferences);
      const weekAfterNext = getNextWeekRange(nextWeek.start, weekStartsOn, preferences);

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
      const weekStartsOn = preferences.weekStartsOn;

      const currentWeek = getWeekRange(referenceDate, weekStartsOn, preferences);
      const targetDate = direction.includes('ago')
        ? currentWeek.start.minus({ days: weeks * 7 })
        : currentWeek.start.plus({ days: weeks * 7 });

      const range = getWeekRange(targetDate, weekStartsOn, preferences);
      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  },
  {
    regex: /^upcoming\s+week$/i,
    parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseComponent | null => {
      const [fullMatch] = matches;
      const referenceDate = preferences.referenceDate || DateTime.now();
      const weekStartsOn = preferences.weekStartsOn;

      const range = getNextWeekRange(referenceDate, weekStartsOn, preferences);
      return createWeekComponent(range.start, range.end, { start: 0, end: fullMatch.length }, fullMatch, preferences);
    }
  }
];

export const relativeWeeksRule: RuleModule = {
  name: 'relative-weeks',
  patterns
};
