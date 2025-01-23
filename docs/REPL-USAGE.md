## Using the Natural Language Date Parser in Node.js REPL

You can try out the library interactively using Node.js REPL. Here's how:

1. Start the TypeScript REPL:
```bash
npx ts-node
```

2. Import the library:
```javascript
const { createNLDP } = require('./src/nldp')
```

3. Create a parser instance (with timezone):
```javascript
// Default UTC timezone
const parser = createNLDP()

// Automatically use system's local timezone
const localParser = createNLDP({
  useLocalTimezone: true
})

// Or with specific timezone
const parserWithTZ = createNLDP({
  timeZone: 'America/New_York'  // or your timezone like 'America/Los_Angeles', 'Europe/London', etc.
})
```

4. Try parsing different date strings:
```javascript
// Basic date parsing (will use specified timezone)
localParser.parse('tomorrow at 3pm')  // Uses your system timezone
parserWithTZ.parse('next tuesday from 3pm to 5pm')
parserWithTZ.parse('beginning of March')

// Time of day
parserWithTZ.parse('tomorrow morning')
parserWithTZ.parse('next tuesday evening')

// Enable debug mode to see more details
parserWithTZ.parse('tomorrow at 3pm', { debug: true })

// You can also specify timezone per parse call
parser.parse('tomorrow at 3pm', { timeZone: 'America/New_York' })
// Or use local timezone for a specific call
parser.parse('tomorrow at 3pm', { useLocalTimezone: true })
```

### Example Phrases You Can Try

The parser understands many natural language formats:
- Relative dates: "3 days from now", "next week"
- Specific times: "at noon", "3:30 PM"
- Date ranges: "3:30 PM to 5:00 PM"
- Time of day: "morning", "afternoon", "evening"
- Month references: "beginning of next month", "end of March"
- Day references: "next Monday", "this Friday"
- Combined formats: "next Monday at noon", "tomorrow morning at 9am"

### Common Timezones
- US East Coast: 'America/New_York'
- US West Coast: 'America/Los_Angeles'
- UK: 'Europe/London'
- Central Europe: 'Europe/Paris'
- Australia: 'Australia/Sydney'
- Japan: 'Asia/Tokyo'

To exit the REPL, press Ctrl+C twice or type `.exit` 