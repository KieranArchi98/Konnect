from datetime import datetime, date
from typing import Any, Union, Dict, List

def convert_datetime_to_string(obj: Any) -> Any:
    """Recursively convert datetime objects to ISO strings"""
    if isinstance(obj, dict):
        return {k: convert_datetime_to_string(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_string(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    elif hasattr(obj, 'isoformat'):  # Handle other datetime-like objects
        return obj.isoformat()
    elif hasattr(obj, 'strftime'):  # Handle date objects
        return obj.strftime('%Y-%m-%dT%H:%M:%S')
    else:
        return obj 