import { Logger } from './Logger';

export interface RuleMatchTrace {
  ruleName: string;
  input: string;
  matched: boolean;
  pattern?: string;
  matches?: string[];
}

export interface ParseTrace {
  input: string;
  matchAttempts: RuleMatchTrace[];
  finalResult?: any;
}

export type DebugTraceState = {
  currentTrace: ParseTrace | null;
};

const createDebugTraceState = (): DebugTraceState => ({
  currentTrace: null
});

export const createDebugTrace = () => {
  const state = createDebugTraceState();

  return {
    startTrace: (input: string) => {
      state.currentTrace = {
        input,
        matchAttempts: []
      };
    },

    addRuleMatch: (trace: RuleMatchTrace) => {
      if (!state.currentTrace) return;
      
      state.currentTrace.matchAttempts.push(trace);
      Logger.debug('Rule match attempt', {
        ruleName: trace.ruleName,
        input: trace.input,
        matched: trace.matched,
        pattern: trace.pattern,
        matches: trace.matches
      });
    },

    endTrace: () => {
      if (!state.currentTrace) return;
      
      Logger.debug('Parse complete', {
        input: state.currentTrace.input,
        matchAttempts: state.currentTrace.matchAttempts
      });

      state.currentTrace = null;
    },

    getTrace: (): ParseTrace | null => state.currentTrace,

    clear: () => {
      state.currentTrace = null;
    }
  };
};

// Create a singleton instance for backward compatibility
export const debugTrace = createDebugTrace(); 