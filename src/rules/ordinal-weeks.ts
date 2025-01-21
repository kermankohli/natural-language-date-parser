import { RuleModule, ParseResult, DateParsePreferences, Pattern } from '../types/types';
import { Logger } from '../utils/Logger';
import { DateTime } from 'luxon';

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function getWeekRange(date: DateTime, weekStartsOn: number = 1): { start: DateTime; end: DateTime } {
  // Convert Luxon's weekday (1-7, Monday=1) to 0-6 format relative to weekStartsOn
  const weekday = ((date.weekday % 7) - weekStartsOn + 7) % 7;
  
  const start = date.minus({ days: weekday }).startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');
  
  return { start, end };
}

function findNthWeekOfMonth(year: number, month: number, n: number, weekStartsOn: number = 1): DateTime | null {
  const firstDayOfMonth = DateTime.utc(year, month, 1);
  const lastDayOfMonth = firstDayOfMonth.endOf('month');

  // Convert Luxon's weekday (1-7, Monday=1) to 0-6 format relative to weekStartsOn
  // For weekStartsOn = 0 (Sunday), we want Sunday=0, Monday=1, ..., Saturday=6
  // For weekStartsOn = 1 (Monday), we want Monday=0, Tuesday=1, ..., Sunday=6
  const firstDayWeekday = ((firstDayOfMonth.weekday % 7) - weekStartsOn + 7) % 7;
  
  console.log('First day of month:', firstDayOfMonth.toISO());
  console.log('First day weekday:', firstDayOfMonth.weekday);
  console.log('Week starts on:', weekStartsOn);
  console.log('Normalized weekday:', firstDayWeekday);
  
  if (n > 0) {
    // For first week, if the first day of month is after our week start day,
    // we need to go back to the previous week's start
    let weekStart = firstDayOfMonth;
    if (firstDayWeekday > 0) {
      weekStart = weekStart.minus({ days: firstDayWeekday });
      console.log('After subtracting days:', weekStart.toISO());
    }

    // If we're too far back (in previous month), move to next week
    if (weekStart.month !== month) {
      weekStart = weekStart.plus({ weeks: 1 });
      console.log('After moving to next week:', weekStart.toISO());
    }

    // Move to the nth week
    weekStart = weekStart.plus({ weeks: n - 1 });
    console.log('Final week start:', weekStart.toISO());

    // If we've gone past the end of the month, return null
    if (weekStart > lastDayOfMonth) return null;

    return weekStart;
  } else {
    // Count from end
    let weekStart = lastDayOfMonth;
    const lastDayWeekday = ((weekStart.weekday % 7) - weekStartsOn + 7) % 7;

    // Move to the start of the last week
    weekStart = weekStart.minus({ days: lastDayWeekday });

    // Move backwards by weeks based on n
    weekStart = weekStart.minus({ weeks: (-n - 1) });

    // If we've gone before the start of the month, return null
    if (weekStart < firstDayOfMonth) return null;

    return weekStart;
  }
}

export const ordinalWeeksRule: RuleModule = {
  name: 'ordinal-weeks',
  patterns: [
    {
      regex: /^(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last|second\s+to\s+last|third\s+to\s+last)\s+week\s+(?:of|in)\s+(january|february|march|april|may|june|july|august|september|october|november|december)$/i,
      parse: (matches: RegExpExecArray, preferences: DateParsePreferences): ParseResult | null => {
        const [, ordinal, month] = matches;
        
        // Convert ordinal to number
        let n: number;
        if (ordinal === 'last') {
          n = -1;
        } else if (ordinal === 'second to last') {
          n = -2;
        } else if (ordinal === 'third to last') {
          n = -3;
        } else {
          n = {
            'first': 1, '1st': 1,
            'second': 2, '2nd': 2,
            'third': 3, '3rd': 3,
            'fourth': 4, '4th': 4,
            'fifth': 5, '5th': 5
          }[ordinal.toLowerCase()] || 0;
        }
        
        if (n === 0) return null;

        const monthNum = MONTHS[month.toLowerCase() as keyof typeof MONTHS];
        if (!monthNum) return null;

        const year = preferences.referenceDate?.year || DateTime.now().year;
        const weekStartsOn = preferences.weekStartsOn ?? 1;

        const targetDate = findNthWeekOfMonth(year, monthNum, n, weekStartsOn);
        if (!targetDate) return null;

        const { start, end } = getWeekRange(targetDate, weekStartsOn);

        return {
          type: 'range',
          start,
          end,
          confidence: 1.0,
          text: matches[0]
        };
      }
    }
  ]
}; 