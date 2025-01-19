import { Logger } from './Logger';

export interface RuleMatchTrace {
  ruleName: string;
  input: string;
  matched: boolean;
  tokens?: string[];
  matchedGroups?: string[];
}

export interface ParseTrace {
  input: string;
  matchAttempts: RuleMatchTrace[];
  finalResult?: any;
}

export class DebugTrace {
  private static currentTrace: ParseTrace | null = null;

  static startTrace(input: string) {
    this.currentTrace = {
      input,
      matchAttempts: []
    };
  }

  static addRuleMatch(trace: RuleMatchTrace) {
    if (!this.currentTrace) return;
    
    this.currentTrace.matchAttempts.push(trace);
    Logger.debug(`Rule match attempt`, {
      ruleName: trace.ruleName,
      input: trace.input,
      matched: trace.matched,
      tokens: trace.tokens,
      matchedGroups: trace.matchedGroups
    });
  }

  static setFinalResult(result: any) {
    if (!this.currentTrace) return;
    
    this.currentTrace.finalResult = result;
    Logger.debug(`Parse complete`, {
      input: this.currentTrace.input,
      result
    });
  }

  static getTrace(): ParseTrace | null {
    return this.currentTrace;
  }

  static clear() {
    this.currentTrace = null;
  }
} 