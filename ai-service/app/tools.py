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
        "uploaded invoice document or a photo of a device.\n\n"
        "STRICT RULES:\n"
        "- If a field cannot be determined with reasonable certainty, OMIT "
        "the key entirely. Never use 0, an empty string, or a guessed "
        "placeholder value for a field that isn't actually present in the input.\n"
        "- warranty_months must ONLY be set if the document explicitly states "
        "a warranty period. Do not default it to 0 - omit it if not mentioned.\n"
        "- confidence must reflect how complete the IDENTIFYING fields are "
        "(brand, model, serial_number) - not just whether you answered the "
        "call. If brand, model, and serial_number are all missing, confidence "
        "must be 0.4 or lower even if vendor/cost/date were extracted "
        "successfully, since the asset cannot yet be uniquely identified.\n"
        "- product_name should be the plain item description from the "
        "invoice line item (e.g. 'Wireless Bluetooth Headphones'), used as a "
        "fallback display name when no brand/model is available."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "product_name": {"type": "string"},
            "brand": {"type": "string"},
            "model": {"type": "string"},
            "serial_number": {"type": "string"},
            "purchase_date": {
                "type": "string",
                "description": "ISO date format YYYY-MM-DD, if determinable",
            },
            "vendor": {"type": "string"},
            "cost": {
                "type": "number",
                "description": "Price of THIS line item (not the invoice grand total, if multiple items are listed)",
            },
            "warranty_months": {"type": "integer"},
            "estimated_category": {
                "type": "string",
                "description": "e.g. Electronics, Furniture, Vehicles",
            },
            "confidence": {
                "type": "number",
                "description": "0.0-1.0, calibrated per the STRICT RULES above",
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
