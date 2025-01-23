import { DateTime } from 'luxon';
import { ParseResult, DateType, RangeType, ParseMetadata } from '../types/types';
import { ParseTrace } from '../utils/debug-trace';

export type ComponentType = 'date' | 'time' | 'range' | 'modifier';

export interface ParseComponent {
  type: ComponentType;
  span: { start: number; end: number };
  confidence: number;
  value: DateTime | { start: DateTime; end: DateTime };
  debugTrace?: ParseTrace;
  metadata?: ParseMetadata;
}

/**
 * Sort components by:
 * 1. Span length (longer matches first)
 * 2. Confidence (higher confidence first)
 * 3. Position in text (earlier matches first)
 */
export const sortComponents = (components: ParseComponent[]): ParseComponent[] => {
  return [...components].sort((a, b) => {
    // First by span length
    const aLength = a.span.end - a.span.start;
    const bLength = b.span.end - b.span.start;
    if (aLength !== bLength) return bLength - aLength;
    
    // Then by confidence
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    
    // Finally by position
    return a.span.start - b.span.start;
  });
};

/**
 * Check if two components have overlapping spans in the original text
 */
export const hasOverlap = (a: ParseComponent, b: ParseComponent): boolean => {
  return !(a.span.end <= b.span.start || b.span.end <= a.span.start);
};

/**
 * Group components that can be combined together (non-overlapping spans and compatible types)
 */
export const groupCompatibleComponents = (components: ParseComponent[]): ParseComponent[][] => {
  const groups: ParseComponent[][] = [];
  const sorted = sortComponents(components);
  
  for (const component of sorted) {
    // Try to add to existing group
    let added = false;
    for (const group of groups) {
      const canAddToGroup = group.every(existing => !hasOverlap(existing, component));
      if (canAddToGroup) {
        group.push(component);
        added = true;
        break;
      }
    }
    
    // Create new group if couldn't add to existing
    if (!added) {
      groups.push([component]);
    }
  }
  
  return groups;
};

/**
 * Combine a date component with a time component
 */
const combineDateAndTime = (date: DateTime, time: DateTime): DateTime => {
  // First set the time components while preserving the date's timezone
  const combined = date.set({
    hour: time.hour,
    minute: time.minute,
    second: time.second
  });
  
  // Ensure we keep the date's timezone
  const zone = date.zoneName || 'UTC';
  return combined.setZone(zone);
};

/**
 * Resolve a group of compatible components into a final parse result
 */
export const resolveGroup = (components: ParseComponent[]): ParseComponent | null => {
  // Sort components by type priority: date > time > range > modifier
  const sortedByType = [...components].sort((a, b) => {
    const priority = { date: 4, time: 3, range: 2, modifier: 1 };
    // If one component is a time and the other is a range with timeOfDay type,
    // prioritize the specific time
    if (a.type === 'time' && b.type === 'range' && b.metadata?.rangeType === 'timeOfDay') {
      return -1;
    }
    if (b.type === 'time' && a.type === 'range' && a.metadata?.rangeType === 'timeOfDay') {
      return 1;
    }
    return priority[b.type] - priority[a.type];
  });

  let baseDate: DateTime | null = null;
  let baseTime: DateTime | null = null;
  let timeRange: { start: DateTime; end: DateTime } | null = null;
  
  // Process each component
  for (const component of sortedByType) {
    switch (component.type) {
      case 'date':
        baseDate = component.value as DateTime;
        break;
      
      case 'time':
        baseTime = component.value as DateTime;
        break;
      
      case 'range':
        // Skip time-of-day ranges if we have a specific time
        if (component.metadata?.rangeType === 'timeOfDay' && baseTime) {
          continue;
        }
        const range = component.value as { start: DateTime; end: DateTime };
        timeRange = range;
        // If this is a time-of-day range, preserve the hours but use the base date
        if (baseDate && component.metadata?.rangeType === 'timeOfDay') {
          const start = combineDateAndTime(baseDate, range.start);
          const end = combineDateAndTime(baseDate, range.end);
          timeRange = { start, end };
        }
        break;
    }
  }

  // Get the combined span from all components
  const span = {
    start: Math.min(...components.map(c => c.span.start)),
    end: Math.max(...components.map(c => c.span.end))
  };

  // Combine components into final result
  if (timeRange) {
    // If we have a date, apply it to the range
    if (baseDate) {
      const start = combineDateAndTime(baseDate, timeRange.start);
      const end = combineDateAndTime(baseDate, timeRange.end);
      // Preserve original timezone if available
      const startZone = timeRange.start.zoneName || 'UTC';
      const endZone = timeRange.end.zoneName || 'UTC';
      return {
        type: 'range',
        value: { 
          start: start.setZone(startZone),
          end: end.setZone(endZone)
        },
        span,
        confidence: components.reduce((acc, c) => acc * c.confidence, 1),
        metadata: {
          originalText: components.map(c => c.metadata?.originalText).join(' '),
          ...components.reduce((acc, c) => ({ ...acc, ...c.metadata }), {})
        }
      };
    }
    // Otherwise just return the range with its original timezone
    const startZone = timeRange.start.zoneName || 'UTC';
    const endZone = timeRange.end.zoneName || 'UTC';
    return {
      type: 'range',
      value: {
        start: timeRange.start.setZone(startZone),
        end: timeRange.end.setZone(endZone)
      },
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).join(' '),
        ...components.reduce((acc, c) => ({ ...acc, ...c.metadata }), {})
      }
    };
  }

  // If we have both date and time
  if (baseDate && baseTime) {
    const datetime = combineDateAndTime(baseDate, baseTime);
    return {
      type: 'date',
      value: datetime,
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).filter(Boolean).join(' '),
        ...components.reduce((acc, c) => ({ ...acc, ...c.metadata }), {})
      }
    };
  }

  // If we just have a date
  if (baseDate) {
    // Only consider range types that weren't skipped
    const hasRangeType = components.some(c => 
      c.type === 'range' && 
      !(c.metadata?.rangeType === 'timeOfDay' && baseTime)
    );
    return {
      type: hasRangeType ? 'range' : 'date',
      value: hasRangeType ? { start: baseDate, end: baseDate.plus({ hours: 1 }) } : baseDate,
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).join(' '),
        ...components.reduce((acc, c) => ({ ...acc, ...c.metadata }), {})
      }
    };
  }

  // If we just have a time
  if (baseTime) {
    return {
      type: 'time',
      value: baseTime,
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).filter(Boolean).join(' '),
        ...components.reduce((acc, c) => ({ ...acc, ...c.metadata }), {})
      }
    };
  }

  return null;
};

/**
 * Calculate coverage score for a parse result based on how much of the input text it explains
 */
const calculateCoverage = (result: ParseComponent, inputLength: number): number => {
  const text = result.metadata?.originalText || '';
  const words = text.split(' ');
  const coveredLength = words.reduce((acc, word) => acc + word.length, 0);
  return coveredLength / inputLength;
};

/**
 * Main resolution function that takes all parsed components and returns the best parse result
 */
export const resolveComponents = (
  components: ParseComponent[],
  inputText: string
): ParseComponent | null => {
  // Group compatible components
  const groups = groupCompatibleComponents(components);

  // console.log(JSON.stringify(groups, null, 2));

  // Resolve each group
  const results = groups
    .map(group => resolveGroup(group))
    .filter((result): result is ParseComponent => result !== null);

  // console.log(JSON.stringify(results, null, 2));
  
  if (results.length === 0) return null;
  
  // Select best result based on:
  // 1. Coverage of input text
  // 2. Confidence score
  // 3. Number of components combined
  return results.reduce((best, current) => {
    const bestScore = 
      calculateCoverage(best, inputText.length) * best.confidence;
    const currentScore = 
      calculateCoverage(current, inputText.length) * current.confidence;
    
    return currentScore > bestScore ? current : best;
  }, results[0]);
}; 