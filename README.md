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
console.log(result);``

## 📖 Supported Expressions

- **Absolute Dates**: "2024-03-20", "03/20/2024"
- **Date-Time**: "2024-03-20T15:30:00Z", "March 20th at 3:30 PM"
- **Time**: "3:30 PM", "15:30", "noon", "midnight"
- **Relative**: "today", "tomorrow", "next week"
- **Fuzzy Ranges**: "next weekend", "beginning of month"
- **Combined**: "tomorrow at 3pm", "next Monday at noon"

## ⚙️ Configuration

```typescript
interface DateParsePreferences {
    referenceDate?: Date;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    timeZone?: string;
    debug?: boolean;
}```

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
