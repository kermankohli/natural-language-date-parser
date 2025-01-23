import { DateTime } from 'luxon';
import { ParseResult } from '../types/types';
import { ParseTrace } from '../utils/debug-trace';

export type ComponentType = 'date' | 'time' | 'range' | 'modifier';

export interface ParseComponent {
  type: ComponentType;
  span: { start: number; end: number };
  confidence: number;
  value: DateTime | { start: DateTime; end: DateTime };
  debugTrace?: ParseTrace;
  metadata?: {
    isRelative?: boolean;
    isTimeOfDay?: boolean;
    isOrdinal?: boolean;
    isAbsolute?: boolean;
    isTimeRange?: boolean;
    isPartialMonth?: boolean;
    isOrdinalWeek?: boolean;
    isFuzzyRange?: boolean;
    modifiers?: string[];
    originalText: string;
  }
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
  return date.set({
    hour: time.hour,
    minute: time.minute,
    second: time.second
  });
};

/**
 * Resolve a group of compatible components into a final parse result
 */
export const resolveGroup = (components: ParseComponent[]): ParseComponent | null => {
  // Sort components by type priority: date > time > range > modifier
  const sortedByType = [...components].sort((a, b) => {
    const priority = { date: 3, time: 2, range: 1, modifier: 0 };
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
        const range = component.value as { start: DateTime; end: DateTime };
        timeRange = range;
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
      return {
        type: 'range',
        value: { start, end },
        span,
        confidence: components.reduce((acc, c) => acc * c.confidence, 1),
        metadata: {
          originalText: components.map(c => c.metadata?.originalText).join(' ')
        }
      };
    }
    // Otherwise just return the range
    return {
      type: 'range',
      value: timeRange,
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).join(' ')
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
        originalText: components.map(c => c.metadata?.originalText).join(' ')
      }
    };
  }

  // If we just have a date
  if (baseDate) {
    return {
      type: 'date',
      value: baseDate,
      span,
      confidence: components.reduce((acc, c) => acc * c.confidence, 1),
      metadata: {
        originalText: components.map(c => c.metadata?.originalText).join(' ')
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
        originalText: components.map(c => c.metadata?.originalText).join(' ')
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
  
  // Resolve each group
  const results = groups
    .map(group => resolveGroup(group))
    .filter((result): result is ParseComponent => result !== null);
  
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