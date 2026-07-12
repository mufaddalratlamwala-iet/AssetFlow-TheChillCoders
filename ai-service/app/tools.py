"""
OpenAI tool (function) definitions.

These force the model to return STRUCTURED JSON instead of freeform text.
Do not edit the parameter names/types without also updating app/schemas.py
and the corresponding service file, since they are matched 1:1.
"""

EXTRACT_ASSET_FIELDS_TOOL = {
    "type": "function",
    "name": "extract_asset_fields",
    "description": (
        "Return structured asset registration fields extracted from an "
        "uploaded invoice document or a photo of a device. Use null/empty "
        "for any field that cannot be determined from the input."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "brand": {"type": "string"},
            "model": {"type": "string"},
            "serial_number": {"type": "string"},
            "purchase_date": {
                "type": "string",
                "description": "ISO date format YYYY-MM-DD, if determinable",
            },
            "vendor": {"type": "string"},
            "cost": {"type": "number"},
            "warranty_months": {"type": "integer"},
            "estimated_category": {
                "type": "string",
                "description": "e.g. Electronics, Furniture, Vehicles",
            },
            "confidence": {
                "type": "number",
                "description": "0.0-1.0 overall confidence in the extraction",
            },
        },
        "required": ["confidence"],
        "additionalProperties": False,
    },
}

QUERY_ASSETS_TOOL = {
    "type": "function",
    "name": "query_assets",
    "description": (
        "Translate a natural-language asset search question into structured "
        "filter arguments matching AssetFlow's existing asset search filters. "
        "Do not invent data - only propose filter values."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "category": {"type": "string"},
            "status": {
                "type": "string",
                "enum": [
                    "Available",
                    "Allocated",
                    "Reserved",
                    "Under Maintenance",
                    "Lost",
                    "Retired",
                    "Disposed",
                ],
            },
            "department": {"type": "string"},
            "location": {"type": "string"},
            "idle_days_min": {
                "type": "integer",
                "description": "Minimum days since last allocation activity, if the question implies 'idle' or 'unused for X'",
            },
            "search_text": {
                "type": "string",
                "description": "Free-text fallback (asset tag, serial, name) if no structured filter clearly applies",
            },
        },
        "additionalProperties": False,
    },
}
