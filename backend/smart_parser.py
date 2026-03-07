import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import date

class SmartAttendanceParser:
    """
    Powerful Natural Language Parser for Teachers.
    Handles:
    1. Session Logging ("Log: Today we covered SQL...")
    2. Attendance Queries ("Who is absent today?")
    3. Multi-status Attendance ("1, 2 absent, 3 OD, 4, 5 present")
    4. Exceptions ("Everyone present except 10, 11")
    5. Ranges ("Roll 1 to 10 on duty")
    """

    STATUS_MAP = {
        'present': ['present', 'here', 'attended', 'came', 'in class', 'p'],
        'absent': ['absent', 'not present', 'missing', 'away', 'skip', 'skipped', 'a'],
        'od': ['od', 'on duty', 'official duty', 'on-duty', 'duty', 'o'],
        'leave': ['leave', 'on leave', 'sick', 'medical', 'emergency', 'l']
    }

    def __init__(self):
        # Normalize status keywords for faster lookup
        self.status_lookup = {}
        for std, keywords in self.STATUS_MAP.items():
            for kw in keywords:
                self.status_lookup[kw] = std.capitalize()

    def parse(self, message: str, class_id: int, subject_id: int) -> Dict[str, Any]:
        # 1. Clean message - Remove "Session N" suffix added by frontend
        message = re.sub(r'\s*Session\s*\d+\s*$', '', message, flags=re.IGNORECASE).strip()
        
        # 2. Check for Session Logging Intent
        # Pattern: "Log: [content]" or "Logged: [content]" or "Session Log: [content]"
        log_match = re.match(r'^(?:session\s+)?log(?:ged)?:\s*(.*)', message, re.IGNORECASE | re.DOTALL)
        if log_match:
            content = log_match.group(1).strip()
            if content:
                return {
                    'pattern_type': 'log',
                    'content': content,
                    'confidence': 1.0
                }

        # 3. Check for Queries
        # Pattern: "Who is absent?", "Which students are present?", "Show OD students"
        query_pattern = re.compile(r'(?:who|which|show|list)\s*(?:students?|are|were|is|was)?\s*(absent|present|od|on\s*duty|leave)(?:\s+(?:on|for)?\s*(today|yesterday|\d{4}-\d{2}-\d{2}))?\s*\??', re.IGNORECASE)
        query_match = query_pattern.search(message)
        if query_match:
            status_str = query_match.group(1)
            date_str = query_match.group(2)
            return {
                'pattern_type': 'query',
                'status': self._normalize_status(status_str),
                'query_date': date_str,
                'class_id': class_id,
                'subject_id': subject_id,
                'confidence': 1.0
            }

        # 4. Handle "Everyone [Status] except [Rolls]"
        exception_pattern = re.compile(r'(?:everyone|all|whole\s*class)\s+(?:is|are|was|were)?\s*(present|absent)\s+except\s+([\d,\s&and]+)', re.IGNORECASE)
        exc_match = exception_pattern.search(message)
        if exc_match:
            base_status = exc_match.group(1).lower()
            except_rolls = self._extract_numbers(exc_match.group(2))
            # If everyone is present except X, then X is absent
            result_status = 'Absent' if base_status == 'present' else 'Present'
            return {
                'pattern_type': 'exception',
                'roll_numbers': except_rolls,
                'status': result_status,
                'class_id': class_id,
                'subject_id': subject_id,
                'confidence': 0.9,
                'note': f"Marking exceptions as {result_status}. Others assumed {base_status.capitalize()}."
            }

        # 5. Handle Ranges ("1 to 10 absent")
        range_pattern = re.compile(r'(?:roll\s*numbers?\s*)?(\d+)\s+(?:to|-|through)\s+(\d+)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE)
        range_match = range_pattern.search(message)
        if range_match:
            start, end = int(range_match.group(1)), int(range_match.group(2))
            status_str = range_match.group(3)
            rolls = [str(i) for i in range(start, end + 1)]
            return {
                'pattern_type': 'range',
                'roll_numbers': rolls,
                'status': self._normalize_status(status_str),
                'class_id': class_id,
                'subject_id': subject_id,
                'confidence': 1.0
            }

        # 6. Robust Multi-status Parsing
        # Example: "101 absent, 102, 103 OD, 104 present"
        status_regex = r'\b(absent|present|od|on\s*duty|leave|p|a|o|l)\b'
        parts = re.split(status_regex, message, flags=re.IGNORECASE)
        
        entries = []
        # re.split with groups returns [text, status, text, status...]
        for i in range(0, len(parts) - 1, 2):
            text_context = parts[i]
            status_found = parts[i+1]
            
            rolls = self._extract_numbers(text_context)
            status = self._normalize_status(status_found)
            
            for r in rolls:
                entries.append({'roll_number': r, 'status': status})
        
        if entries:
            # Deduplicate - last mention wins
            final_map = {}
            for entry in entries:
                final_map[entry['roll_number']] = entry['status']
            
            return {
                'pattern_type': 'multiple',
                'entries': [{'roll_number': r, 'status': s} for r, s in final_map.items()],
                'class_id': class_id,
                'subject_id': subject_id,
                'confidence': 1.0
            }

        # 7. Final Fallback: Just look for a status and any numbers
        possible_status = re.search(status_regex, message, re.IGNORECASE)
        if possible_status:
            status = self._normalize_status(possible_status.group(1))
            rolls = self._extract_numbers(message)
            if rolls:
                return {
                    'pattern_type': 'fallback',
                    'roll_numbers': rolls,
                    'status': status,
                    'class_id': class_id,
                    'subject_id': subject_id,
                    'confidence': 0.8
                }

        return {
            'error': "I couldn't understand that. You can say '101 absent', 'Log: Today we started SQL', or 'Who is absent today?'",
            'confidence': 0.0
        }

    def _extract_numbers(self, text: str) -> List[str]:
        # Clean text by removing any non-numeric and non-separator characters
        # But keep spaces and commas
        clean = re.sub(r'[^\d\s,]', ' ', text)
        return re.findall(r'\b\d+\b', clean)

    def _normalize_status(self, status_str: str) -> str:
        s = status_str.lower().strip()
        # Direct lookup
        if s in self.status_lookup:
            return self.status_lookup[s]
        
        # Partial match
        if 'duty' in s: return 'OD'
        if 'leave' in s: return 'Leave'
        if 'abs' in s: return 'Absent'
        if 'pres' in s: return 'Present'
        
        return 'Absent' # Default

class AdvancedAttendanceParser(SmartAttendanceParser):
    """Placeholder for future enhancements like spell check."""
    pass
