# 🗓 Natural Language Date Parser

A modular, preference-based date/time parser that handles natural language expressions with confidence scoring and debugging capabilities.

[![npm version](https://img.shields.io/npm/v/natural-language-date-parser.svg)](https://www.npmjs.com/package/natural-language-date-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 📝 Parse natural language date/time expressions
- 🌍 Timezone-aware with full DST support
- ⚙️ Configurable preferences (week start, reference date)
- 🎯 Confidence scoring for parse results
- 🐛 Debug mode with detailed parse traces
- 📦 Modular rule system for easy extension

## 🚀 Quick Start

```typescript
import { NLDP } from 'natural-language-date-parser';

const parser = new NLDP({
    referenceDate: new Date(),
    weekStartsOn: 1, // Monday
    timeZone: 'America/New_York'
});

const result = parser.parse('next Monday at 3pm');
console.log(result);
```

## 📖 Supported Expressions

### 🗓 Absolute Dates
- ISO format: "2024-03-20", "03/20/2024"
- Month names: "January 5, 2025", "Jan 5th, 2025"
- Day first: "5 January 2025", "5th Jan 2025"
- Current year: "January 5", "5th Jan"

### ⏰ Time
- 12-hour: "3:30 PM", "3pm"
- 24-hour: "15:30"
- Special times: "noon", "midnight"
- With dates: "March 20th at 3:30 PM"

### 📅 Relative Days
- Simple: "today", "tomorrow", "yesterday"
- Extended: "day after tomorrow", "day before yesterday"
- Offset: "3 days from now", "2 days ago"
- Next weekday: "next Monday", "next Friday"

### 📊 Ordinal Days
- Month-based: "first Monday in March", "last Friday in March"
- Numeric: "2nd Thursday in March"
- Month end: "last day of month", "penultimate day"
- Position: "third to last day of month"

### 📦 Week Expressions
- Simple: "this week", "next week", "last week"
- Extended: "week after next"
- Offset: "3 weeks from now"
- With weekday start preference

### 📋 Month Parts
- Segments: "early March", "mid March", "late March"
- Halves: "first half of April", "second half of April"
- Boundaries: "beginning of April", "end of March"

### 🎯 Fuzzy Ranges
- Weekends: "this weekend", "next weekend"
- Multiple: "next 2 weekends", "following 3 weekends"
- Month parts: "first 3 days of next month", "last 5 days of March"

### 🔄 Combined Expressions
- Date + Time: "tomorrow at 3pm", "next Monday at 3:30pm"
- Relative + Time: "3 days from now at noon"
- Ordinal + Time: "1st of April at midnight"

All expressions support:
- 🌍 Timezone awareness
- 📊 Confidence scoring
- 🎯 Range or single date output
- 🐛 Detailed debug traces

## ⚙️ Configuration

```typescript
interface DateParsePreferences {
    referenceDate?: Date;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    timeZone?: string;
    debug?: boolean;
}
```

## 🔍 Debug Mode

Enable detailed parsing traces:

```typescript
const result = parser.parse('next Monday at 3pm', { debug: true });
```

## 🧪 Testing

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

This project is open-sourced under the MIT License - see the [LICENSE](LICENSE) file for details.
