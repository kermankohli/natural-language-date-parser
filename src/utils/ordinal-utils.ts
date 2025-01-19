export function getOrdinalNumber(ordinal: string): number {
  // Handle numeric ordinals like "2nd", "3rd", etc.
  const numericMatch = ordinal.match(/^(\d+)(?:st|nd|rd|th)?$/i);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }
  
  const ORDINALS = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
    last: -1, penultimate: -2, ultimate: -1,
    'second to last': -2, 'third to last': -3
  };
  
  return ORDINALS[ordinal as keyof typeof ORDINALS] || 0;
} 