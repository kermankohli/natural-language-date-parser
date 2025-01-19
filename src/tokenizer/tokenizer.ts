/**
 * Options for tokenization
 */
export interface TokenizerOptions {
  preserveQuotes?: boolean;      // Keep quotes in tokens
  normalizeSpaces?: boolean;     // Convert multiple spaces to single space
  lowercaseTokens?: boolean;     // Convert tokens to lowercase
}

const DEFAULT_OPTIONS: TokenizerOptions = {
  preserveQuotes: false,
  normalizeSpaces: true,
  lowercaseTokens: true,
};

/**
 * Tokenizes an input string into an array of tokens
 */
export function tokenize(input: string, options: TokenizerOptions = DEFAULT_OPTIONS): string[] {
  if (!input) return [];
  
  let processed = input;

  // Normalize spaces if requested
  if (options.normalizeSpaces) {
    processed = processed.replace(/\s+/g, ' ').trim();
  }

  // Convert to lowercase if requested
  if (options.lowercaseTokens) {
    processed = processed.toLowerCase();
  }

  // Handle quoted strings
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;
  
  for (let i = 0; i < processed.length; i++) {
    const char = processed[i];
    
    if (char === '"' || char === "'") {
      if (options.preserveQuotes) {
        currentToken += char;
      }
      inQuotes = !inQuotes;
      continue;
    }
    
    if (inQuotes) {
      currentToken += char;
    } else if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
} 