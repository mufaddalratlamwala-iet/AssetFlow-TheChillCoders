import base64
import json

from fastapi import UploadFile, HTTPException

from app.config import settings
from app.openai_client import client
from app.tools import EXTRACT_ASSET_FIELDS_TOOL
from app.schemas import ExtractedAssetFields

REVIEW_THRESHOLD = 0.6

IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
PDF_MIME_TYPE = "application/pdf"


def _build_input_content(file_bytes: bytes, mime_type: str) -> list[dict]:

    b64 = base64.b64encode(file_bytes).decode("utf-8")

    prompt_text = (
        "Extract asset registration details from this file. It may be a "
        "purchase invoice or a photo of the physical device. Call the "
        "extract_asset_fields function with everything you can determine. "
        "If a field cannot be determined, omit it rather than guessing."
    )

    if mime_type in IMAGE_MIME_TYPES:
        return [
            {"type": "input_text", "text": prompt_text},
            {
                "type": "input_image",
                "image_url": f"data:{mime_type};base64,{b64}",
            },
        ]

    if mime_type == PDF_MIME_TYPE:
        return [
            {"type": "input_text", "text": prompt_text},
            {
                "type": "input_file",
                "filename": "invoice.pdf",
                "file_data": f"data:{mime_type};base64,{b64}",
            },
        ]

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type '{mime_type}'. Upload a PDF invoice or a JPG/PNG photo.",
    )


def _parse_tool_call(response) -> dict:
    
    for item in response.output:
        if getattr(item, "type", None) == "function_call" and item.name == "extract_asset_fields":
            return json.loads(item.arguments)

    raise HTTPException(
        status_code=502,
        detail="Model did not return a structured extraction. Try again or upload a clearer file.",
    )


def _normalize_and_flag(data: dict) -> ExtractedAssetFields:

    string_fields = [
        "product_name", "brand", "model", "serial_number",
        "vendor", "estimated_category", "purchase_date",
    ]
    for key in string_fields:
        if data.get(key) == "":
            data[key] = None

        if data.get("warranty_months") == 0:
            data["warranty_months"] = None
            
    confidence = float(data.get("confidence", 0))
    identity_fields_present = any(
        data.get(f) for f in ("brand", "model", "serial_number")
    )

    needs_review = (confidence < REVIEW_THRESHOLD) or (not identity_fields_present)

    return ExtractedAssetFields(**data, needs_review=needs_review)


async def extract_asset_fields(file: UploadFile) -> ExtractedAssetFields:
    file_bytes = await file.read()

    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="File too large.")

    mime_type = file.content_type or "application/octet-stream"
    content = _build_input_content(file_bytes, mime_type)

    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=[{"role": "user", "content": content}],
            tools=[EXTRACT_ASSET_FIELDS_TOOL],
            tool_choice={"type": "function", "name": "extract_asset_fields"},
        )
    except Exception as e:  # noqa: BLE001 - surface as a clean 502 to the caller
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}") from e

    data = _parse_tool_call(response)
    return _normalize_and_flag(data)
