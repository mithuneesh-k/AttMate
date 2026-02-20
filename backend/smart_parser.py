"""
Smart Natural Language Parser for Attendance
No AI required - uses pattern matching and NLP techniques
Handles complex natural language inputs without external APIs
"""

import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import date


class SmartAttendanceParser:
    """
    Advanced parser that understands natural language attendance inputs.
    No AI APIs needed - uses intelligent pattern matching.
    """
    
    # Status keywords mapping
    STATUS_KEYWORDS = {
        'absent': ['absent', 'not present', 'missing', 'away', 'skip', 'skipped'],
        'present': ['present', 'here', 'attended', 'came', 'in class'],
        'od': ['od', 'on duty', 'official duty', 'on-duty', 'duty'],
        'leave': ['leave', 'on leave', 'sick', 'medical', 'emergency']
    }
    
    # Common words to ignore
    IGNORE_WORDS = {'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 
                    'mark', 'student', 'students', 'roll', 'number', 'numbers',
                    'as', 'today', 'for', 'class', 'who', 'that'}
    
    def __init__(self):
        self.compiled_patterns = self._compile_patterns()
    
    def _compile_patterns(self) -> List[Dict[str, Any]]:
        """Compile regex patterns for different input formats."""
        return [
            # Pattern 1: "Roll numbers 101 to 105 absent" (MUST BE FIRST)
            {
                'pattern': re.compile(r'(?:roll\s+numbers?\s+)?(\d+)\s+(?:to|-)\s+(\d+)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'range'
            },
            # Pattern 2: "From 101 to 105 are absent"
            {
                'pattern': re.compile(r'from\s+(\d+)\s+to\s+(\d+)\s+(?:are|is)?\s*(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'range'
            },
            # Pattern 3: "101 absent, 102 od, 117 present" (multiple individual)
            {
                'pattern': re.compile(r'(\d+)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'individual_multiple'
            },
            # Pattern 4: "Everyone present except 101, 102"
            {
                'pattern': re.compile(r'(?:everyone|all)\s+(?:is\s+)?present\s+except\s+([\d,\s]+)', re.IGNORECASE),
                'type': 'except_present'
            },
            # Pattern 5: "Everyone absent except 101, 102"
            {
                'pattern': re.compile(r'(?:everyone|all)\s+(?:is\s+)?absent\s+except\s+([\d,\s]+)', re.IGNORECASE),
                'type': 'except_absent'
            },
            # Pattern 6: Multiple distinct lists: "144, 155 Od. 188 absent"
            {
                'pattern': re.compile(r'((?:\d+\s*(?:,|and|&|\.)?\s*)+)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'multiple_lists'
            },
            # Pattern 7: "Mark 101 and 102 as absent"
            {
                'pattern': re.compile(r'(?:mark\s+)?(\d+(?:\s*(?:and|,)\s*\d+)*)\s+(?:as\s+)?(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'natural_list'
            },
            # Pattern 8: "101, 102, 103 absent" or "1,2 absent"
            {
                'pattern': re.compile(r'([\d,\s]+?)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'simple_list'
            },
            # Pattern 9: "Students 111, 112 are absent"
            {
                'pattern': re.compile(r'(?:students?\s+)?([\d,\s]+?)\s+(?:is|are|was|were)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE),
                'type': 'simple_list'
            },
        ]
    
    def parse(self, message: str, class_id: int, subject_id: int) -> Dict[str, Any]:
        """
        Parse natural language input and extract attendance information.
        
        Args:
            message: Natural language input from faculty
            class_id: ID of the class
            subject_id: ID of the subject
            
        Returns:
            Dictionary with parsed attendance data
        """
        message = message.strip()
        
        # Try each pattern
        for pattern_info in self.compiled_patterns:
            result = self._try_pattern(message, pattern_info, class_id, subject_id)
            if result and (result.get('roll_numbers') or result.get('entries')):
                return result
        
        # If no pattern matched, return error
        return {
            'error': 'Could not parse input. Try formats like: "101, 102 absent" or "Mark 103 as OD"',
            'confidence': 0.0
        }
    
    def _try_pattern(self, message: str, pattern_info: Dict, class_id: int, subject_id: int) -> Optional[Dict[str, Any]]:
        # 1. First, check for multiple lists explicitly before loop
        multiple_lists_pattern = re.compile(r'((?:\d+\s*(?:,|and|&|\.)?\s*)+)\s+(absent|present|od|on\s*duty|leave)', re.IGNORECASE)
        matches = multiple_lists_pattern.findall(message)
        if matches and len(matches) > 1:
            entries = []
            for roll_str, status_str in matches:
                status = self._normalize_status(status_str)
                rolls = self._extract_roll_numbers(roll_str)
                for r in rolls:
                    entries.append({'roll_number': r, 'status': status})
            if entries:
                return {
                    'entries': entries,
                    'class_id': class_id,
                    'subject_id': subject_id,
                    'confidence': 1.0,
                    'pattern_type': 'multiple_lists' # Corrected pattern_type
                }
                
        # The original loop structure for other patterns
        pattern = pattern_info['pattern']
        pattern_type = pattern_info['type']
        
        if pattern_type == 'individual_multiple':
            # Special handling for multiple individual entries
            matches = pattern.findall(message)
            # Only use this pattern if there are multiple different statuses
            if matches and len(matches) > 1:
                # Check if there are different statuses
                statuses = set(self._normalize_status(status) for _, status in matches)
                if len(statuses) > 1:
                    return self._parse_individual_multiple(matches, class_id, subject_id)
            return None
                    
        match = pattern.search(message)
        if not match:
            return None
        
        if pattern_type == 'simple_list':
            return self._parse_simple_list(match, class_id, subject_id)
        elif pattern_type == 'natural_list':
            return self._parse_natural_list(match, class_id, subject_id)
        elif pattern_type == 'range':
            return self._parse_range(match, class_id, subject_id)
        elif pattern_type == 'except_present':
            return self._parse_except(match, class_id, subject_id, 'absent')
        elif pattern_type == 'except_absent':
            return self._parse_except(match, class_id, subject_id, 'present')
        
        return None
    
    def _parse_simple_list(self, match: re.Match, class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse simple list format: '101, 102, 103 absent'"""
        roll_str = match.group(1)
        status_str = match.group(2)
        
        roll_numbers = self._extract_roll_numbers(roll_str)
        status = self._normalize_status(status_str)
        
        return {
            'roll_numbers': roll_numbers,
            'status': status,
            'class_id': class_id,
            'subject_id': subject_id,
            'confidence': 1.0,
            'pattern_type': 'simple_list'
        }
    
    def _parse_natural_list(self, match: re.Match, class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse natural language list: 'Mark 101 and 102 as absent'"""
        roll_str = match.group(1)
        status_str = match.group(2)
        
        # Handle "and" separated numbers
        roll_str = roll_str.replace(' and ', ', ')
        roll_numbers = self._extract_roll_numbers(roll_str)
        status = self._normalize_status(status_str)
        
        return {
            'roll_numbers': roll_numbers,
            'status': status,
            'class_id': class_id,
            'subject_id': subject_id,
            'confidence': 1.0,
            'pattern_type': 'natural_list'
        }
    
    def _parse_range(self, match: re.Match, class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse range format: '101 to 105 absent'"""
        start = int(match.group(1))
        end = int(match.group(2))
        status_str = match.group(3)
        
        # Generate range
        roll_numbers = [str(i) for i in range(start, end + 1)]
        status = self._normalize_status(status_str)
        
        return {
            'roll_numbers': roll_numbers,
            'status': status,
            'class_id': class_id,
            'subject_id': subject_id,
            'confidence': 1.0,
            'pattern_type': 'range',
            'range_start': str(start),
            'range_end': str(end)
        }
    
    def _parse_except(self, match: re.Match, class_id: int, subject_id: int, exception_status: str) -> Dict[str, Any]:
        """Parse 'everyone present except' format."""
        roll_str = match.group(1)
        roll_numbers = self._extract_roll_numbers(roll_str)
        
        return {
            'roll_numbers': roll_numbers,
            'status': exception_status,
            'class_id': class_id,
            'subject_id': subject_id,
            'confidence': 0.9,  # Slightly lower as this requires knowing all students
            'pattern_type': 'exception',
            'note': 'Only marking exceptions. Others assumed opposite status.'
        }
    
    def _parse_individual_multiple(self, matches: List[Tuple], class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse multiple individual entries: '101 absent, 102 od, 103 present'"""
        entries = []
        for roll, status_str in matches:
            entries.append({
                'roll_number': roll,
                'status': self._normalize_status(status_str)
            })
        
        return {
            'entries': entries,
            'class_id': class_id,
            'subject_id': subject_id,
            'confidence': 1.0,
            'pattern_type': 'multiple_individual'
        }
    
    def _extract_roll_numbers(self, roll_str: str) -> List[str]:
        """Extract roll numbers from a string."""
        # Remove common words and clean up
        roll_str = re.sub(r'\b(?:' + '|'.join(self.IGNORE_WORDS) + r')\b', '', roll_str, flags=re.IGNORECASE)
        
        # Extract all numbers
        numbers = re.findall(r'\d+', roll_str)
        return numbers
    
    def _normalize_status(self, status_str: str) -> str:
        """Normalize status string to standard format."""
        status_str = re.sub(r'[^\w\s]', '', status_str).lower().strip()
        
        # Handle "on duty" variations
        if 'duty' in status_str or status_str == 'od':
            return 'OD'
        
        # Check against keywords
        for standard_status, keywords in self.STATUS_KEYWORDS.items():
            if any(keyword in status_str for keyword in keywords):
                return standard_status.capitalize()
        
        # Default to Absent if unclear
        return 'Absent'


class AdvancedAttendanceParser(SmartAttendanceParser):
    """
    Extended parser with additional features like:
    - Spell correction for common typos
    - Context awareness
    - Multi-language support (future)
    """
    
    # Add typo corrections mapping
    TYPO_CORRECTIONS = {
        'abssent': 'absent',
        'absense': 'absent',
        'abcent': 'absent',
        'pressent': 'present',
        'presunt': 'present',
        'prezent': 'present',
        'leve': 'leave'
    }
    
    def parse(self, message: str, class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse with typo correction."""
        # Apply typo corrections
        message_corrected = message
        for typo, correction in self.TYPO_CORRECTIONS.items():
            message_corrected = re.sub(r'\b' + typo + r'\b', correction, message_corrected, flags=re.IGNORECASE)
        
        # Use parent parser
        return super().parse(message_corrected, class_id, subject_id)
    
    def parse_with_suggestions(self, message: str, class_id: int, subject_id: int) -> Dict[str, Any]:
        """Parse and provide suggestions if parsing fails."""
        result = self.parse(message, class_id, subject_id)
        
        if 'error' in result:
            # Provide helpful suggestions
            result['suggestions'] = [
                "Try: '101, 102, 103 absent'",
                "Try: 'Mark 104 as OD'",
                "Try: 'Roll numbers 105 to 110 present'",
                "Try: 'Everyone present except 111'"
            ]
        
        return result


# Example usage and testing
if __name__ == "__main__":
    parser = AdvancedAttendanceParser()
    
    # Test cases
    test_inputs = [
        "101, 102, 103 absent",
        "Mark 104 and 105 as OD",
        "Roll numbers 106 to 110 present",
        "Students 111, 112 are absent",
        "Everyone present except 113, 114",
        "115 absent, 116 od, 117 present",
        "From 118 to 120 are on duty",
        "Mark students 121 and 122 as on leave",
    ]
    
    print("Testing Smart Attendance Parser\n" + "="*50)
    for test_input in test_inputs:
        result = parser.parse(test_input, class_id=1, subject_id=1)
        print(f"\nInput: {test_input}")
        print(f"Result: {result}")
