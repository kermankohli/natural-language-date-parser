3.2 Language Pattern Types
Below is a non-exhaustive sampling of the patterns you might include. Each pattern will map to a semantic structure (e.g., RelativeDayReference, TimeOfDay, etc.).

Absolute Days / Dates
“January 5, 2025,” “5 January 2025,” “Jan 5th,” “2025-01-05.”
Multi-lingual forms if necessary (or different locales).
Relative Days
“today,” “tomorrow,” “yesterday,” “day after tomorrow,” “2 days from now,” “the day before yesterday.”
Named Days
“Monday,” “Tuesday,” “next Monday,” “last Tuesday,” “the Monday after next,” “the second Monday from now,” etc.
Relative Weeks
“this week,” “next week,” “the week after next,” “the second to last week,” “the first full week of October.”
Must anchor to user preference for start of week.
Ordinal References to Months / Weeks
“the third week of January,” “the second to last week of October,” “the first Monday in March.”
“the penultimate day of the month.”
Tied heavily to user preferences for partial vs. full weeks.
Partial Month References
“early April,” “mid-April,” “late April.”
Typically define as a range: early = 1–10, mid = 10–20, late = 20–30, etc. (customizable).
Year References
“this year,” “next year,” “the year after next,” “2027,” etc.
Time of Day
“4:00 p.m.,” “16:00,” “noon,” “midnight,” “in 2 hours,” etc.
Combining Date + Time
“Saturday after next at 4pm,” “the second Monday in March at 10:30 AM,” “tomorrow evening at 5.”
Typically parse the date part, then parse the time part, and combine.
Fuzzy Ranges
“next weekend,” “the second half of April,” “the next 2 weekends,” “the first 3 days of next month.”
These produce start and end timestamps.
Offsets / Shifts
“3 days after next Monday,” “1 week before Christmas,” etc.
Multiple Qualifiers
“the second to last Friday in June at 9pm,” etc.
The grammar needs to handle nesting or chaining: Ordinal + NamedDay + Month + TimeOfDay.