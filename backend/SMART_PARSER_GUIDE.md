# Smart Parser - Quick Reference Guide

## What Is This?

A **completely free** natural language parser for attendance that requires **no AI APIs**. Works offline, unlimited usage, instant responses.

---

## Supported Input Formats

### 1. Simple List
```
Input: "101, 102, 103 absent"
Result: Marks students 101, 102, 103 as absent
```

### 2. Natural Language
```
Input: "Mark 104 and 105 as OD"
Result: Marks students 104, 105 as on duty
```

### 3. Range
```
Input: "Roll numbers 106 to 110 present"
Result: Marks students 106-110 as present
```

### 4. With "Students" Keyword
```
Input: "Students 111, 112 are absent"
Result: Marks students 111, 112 as absent
```

### 5. Exception Pattern
```
Input: "Everyone present except 113, 114"
Result: Marks students 113, 114 as absent
```

### 6. Multiple Individual Statuses
```
Input: "115 absent, 116 od, 117 present"
Result: Marks each student with their specific status
```

### 7. From-To Range
```
Input: "From 118 to 120 are on duty"
Result: Marks students 118-120 as on duty
```

---

## Supported Status Keywords

| Status | Recognized Keywords |
|--------|-------------------|
| **Absent** | absent, not present, missing, away |
| **Present** | present, here, attended, came |
| **OD** | od, on duty, official duty, on-duty |
| **Leave** | leave, on leave, sick, medical |

---

## Common Typos Handled

The parser automatically corrects:
- `absnt` → `absent`
- `abscent` → `absent`
- `presen` → `present`
- `o.d.` → `od`

---

## Error Messages

If input cannot be parsed, you'll get helpful suggestions:

```
Could not parse input.

Try these formats:
• Try: '101, 102, 103 absent'
• Try: 'Mark 104 as OD'
• Try: 'Roll numbers 105 to 110 present'
```

---

## API Response

```json
{
  "response": "✓ Marked 5 students as Present: 106, 107, 108, 109, 110",
  "processed_count": 5,
  "parser_used": "smart_parser",
  "pattern_type": "range"
}
```

---

## Benefits

✅ **Free** - No API costs  
✅ **Fast** - <1ms response time  
✅ **Offline** - Works without internet  
✅ **Unlimited** - No rate limits  
✅ **Reliable** - 100% uptime  

---

## Testing

To test the parser:

```bash
cd c:\AttMate\backend
python smart_parser.py
```

This runs all test cases and shows parsing results.

---

## Integration

Already integrated in `main.py`:

```python
from smart_parser import AdvancedAttendanceParser

parser = AdvancedAttendanceParser()
result = parser.parse(message, class_id, subject_id)
```

No configuration needed - works immediately!
