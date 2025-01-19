# Project Plan: Modular, Preference-Based Date/Time Parser

## Overview
We are building a modular date/time parsing library that:
- Uses function-level preferences for ambiguous or fuzzy expressions.
- Supports both single date/time and date ranges (e.g., "next weekend").
- Is structured to let contributors add new "rule modules" without modifying the core.

---

## Stages

### Stage 0: Project Setup
**Objective**  
- Initialize the repository.  
- Configure TypeScript (optional) and basic folder structure.

**Tasks**  
1. `mkdir my-date-parser && cd my-date-parser && npm init -y`.
2. Install dev dependencies (TypeScript, etc.) and create `packages/core` and `packages/rules-english` directories.

**Deliverables**  
- A working `package.json`.
- Basic folder skeleton (`core/src/`, `rules-english/src/`).

---

### Stage 1: Core Interfaces & Preferences
**Objective**  
- Define core TypeScript interfaces for `ParseResult`, `RuleModule`, etc.
- Outline how user preferences (e.g., `referenceDate`, `startOfWeek`) will be passed.

**Tasks**  
1. Create `interfaces.ts` in `packages/core/src/`.
2. Define `DateParsePreferences`, `ParseResult` (single vs. range), `IntermediateParse`, and `RuleModule`.

**Deliverables**  
- `interfaces.ts` with well-defined, exportable types.

**Success Criteria**  
- The types compile without errors.
- Code references `interfaces.ts` seamlessly.

---

### Stage 2: Tokenizer & Preprocessor
**Objective**  
- Implement a simple tokenizer that normalizes input and splits it into tokens.

**Tasks**  
1. Create `tokenizer.ts` in `packages/core/src/`.
2. Provide a `tokenize(input: string): string[]` function.

**Deliverables**  
- `tokenizer.ts` that handles basic punctuation and spacing.

**Success Criteria**  
- Quick tests verify tokens are correctly extracted for sample strings.

---

### Stage 3: Parser Engine Skeleton
**Objective**  
- Build a `ParserEngine` class that registers a set of rule modules and attempts to parse user input.

**Tasks**  
1. Create `parser-engine.ts` in `packages/core/src/`.
2. Reference `tokenizer.ts` and loop through rule modules to see if they match.

**Deliverables**  
- A minimal `parseDateTime(input, prefs)` method returning a placeholder result when rules match.

**Success Criteria**  
- Confirm a “dummy” rule can be matched, returning a placeholder parse result.

---

### Stage 4: Basic Rules (Absolute & Simple Relative)
**Objective**  
- In `rules-english`, define two modules: one for absolute ISO dates, one for simple relative terms ("today"/"tomorrow"/"yesterday").

**Tasks**  
1. Create `absolute-dates.ts` with a rule matching ISO-8601 strings (YYYY-MM-DD).
2. Create `relative-dates.ts` with rules for "today," "tomorrow," "yesterday."
3. Export them in `index.ts` as `englishRulesModule`.

**Deliverables**  
- `absolute-dates.ts`, `relative-dates.ts`, `index.ts` in `rules-english`.

**Success Criteria**  
- Test “2025-01-05” and “today” to see if they match rules in the parser engine.

---

### Stage 5: Interpretation & Preferences
**Objective**  
- Replace the placeholder interpretation with a real `interpret(intermediate, prefs)` function that uses user preferences.

**Tasks**  
1. Create `interpretation.ts` in `core/src/`.
2. Implement logic for "absoluteDateISO," "today," etc.
3. Update `parser-engine.ts` to call `interpret()`.

**Deliverables**  
- Real date objects for matches (e.g., "2025-01-05" → a valid `Date`).

**Success Criteria**  
- Verified with reference date overrides (e.g., parse "yesterday" with a custom anchor date).

---

### Stage 6: Range Rules & Past/Future Handling
**Objective**  
- Introduce examples of multi-day range expressions and references to the past (e.g., "3 days ago").

**Tasks**  
1. Create `range-rules.ts` in `rules-english`.
2. Add patterns like "next weekend" (range) and "X days ago" (past).
3. Enhance `interpretation.ts` to output range or single date accordingly.

**Deliverables**  
- A functional parser that can return `{ type: "range", start, end }`.

**Success Criteria**  
- "next weekend" → correct Saturday–Sunday range.
- "3 days ago" → correct single date in the past.

---

### Stage 7: Debug/Trace Logging
**Objective**  
- Provide visibility into which rule matched and how.

**Tasks**  
1. Create `debug-logger.ts` in `core/src/`.
2. Store matched rule, tokens, and final result in a `DebugTrace` object, printing if `debug = true`.

**Deliverables**  
- A debug mode for deeper insight.

**Success Criteria**  
- Running `parseDateTime("next weekend", { debug: true })` logs rule matches and results.

---

### Stage 8: Final Testing & Validation
**Objective**  
- Ensure broad coverage and finalize the library.

**Tasks**  
1. Write unit tests in `packages/core/tests/`.
2. Test all expressions with various `DateParsePreferences` (e.g., `referenceDate`, `startOfWeek`).
3. Confirm success in local environment or CI.

**Deliverables**  
- A test suite that verifies correct parsing behaviors.

**Success Criteria**  
- All tests pass.  
- Ready for extension with additional rules or language packs.

---

## Future Extensions
1. **Time-of-Day Parsing** (e.g. "4pm", "16:00").  
2. **Fuzzy/Ordinal Month Rules** ("the second to last week of October").  
3. **Localization / i18n** for multiple languages.  
4. **Hybrid ML Integration** for freeform text fallback.

---

## Contributing
- Fork the repo, create a branch, add or modify rule files, and open a pull request.  
- For new languages or specialized contexts, create a separate rules package (e.g., `rules-spanish`).

---

**End of Project Plan**

