import json
import logging
from fastapi import HTTPException
from app.config import settings
from app.openai_client import client
from app.tools import QUERY_ASSETS_TOOL
from app.schemas import AssetFilters, SearchResponse
from app.services.asset_query_stub import execute_asset_query

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an AssetFlow search assistant.

Your only responsibility is to convert a user's natural language request
into arguments for the query_assets tool.

Rules:
- Never answer the user.
- Never invent assets.
- Never invent counts.
- Never invent departments.
- Never invent locations.
- Omit unknown fields.

Category mapping:
Laptop, Desktop, Monitor, Keyboard, Mouse, Printer
→ Electronics

Chair, Desk, Table, Sofa, Cabinet
→ Furniture

If the user searches by:
- asset tag
- serial number
- brand
- model

populate search_text.

Always prefer structured filters over search_text whenever possible.
"""

REPLY_INSTRUCTIONS = """
You just ran a search and got real results back from the database (provided
below as function output). Write a short, natural, conversational reply
summarizing what was found.

Rules:
- Mention the actual count.
- Mention specific asset names and asset tags (not just a number) - at least
  the first few, more if the list is short enough to list all of them.
- Where useful, mention a relevant detail per asset (status, location, or
  category) - whatever's most relevant to what was asked.
- ONLY use assets present in the provided data. Never invent or assume any
  asset that isn't in the list.
- If there are more results than you list individually, say so
  (e.g. "...and 3 more").
- Keep it to 2-4 sentences. Sound like a helpful colleague, not a report.
- If the list is empty, say so plainly and, if useful, suggest loosening the
  search (different department/status/etc).
"""

MAX_RESULTS_IN_PROMPT = 15


def _parse_tool_call(response) -> tuple[str, dict]:
    """Returns (call_id, parsed_arguments) for the query_assets tool call."""
    for item in response.output:
        if (
            getattr(item, "type", None) == "function_call"
            and item.name == "query_assets"
        ):
            return item.call_id, json.loads(item.arguments)

    raise HTTPException(
        status_code=502,
        detail="Model did not return structured filters.",
    )


def _summarize_for_prompt(results: list[dict]) -> list[dict]:
    """Trim + slim each asset down to the fields worth putting in front of the
    model, so the reply-generation call stays cheap regardless of how wide
    the raw Mongo documents are."""
    slim = []
    for asset in results[:MAX_RESULTS_IN_PROMPT]:
        slim.append({
            "assetTag": asset.get("assetTag"),
            "name": asset.get("name"),
            "status": asset.get("status"),
            "location": asset.get("location"),
            "category": asset.get("category"),
        })
    return slim


def _compose_reply_fallback(filters: AssetFilters, results: list[dict]) -> str:
    """Used only if the natural-language generation call fails - keeps the
    endpoint from ever returning a broken response."""
    count = len(results)
    if count == 0:
        return "No matching assets found."
    parts = [f"{count} asset{'s' if count != 1 else ''} found"]
    if filters.category:
        parts.append(f"in {filters.category}")
    if filters.department:
        parts.append(f"under {filters.department}")
    if filters.status:
        parts.append(f"with status {filters.status}")
    return " ".join(parts) + "."


def _generate_natural_reply(previous_response_id: str, call_id: str, results: list[dict]) -> str:
    """Second turn: give the model the real results and let it write the
    actual sentence, instead of a fixed template."""
    try:
        reply_response = client.responses.create(
            model=settings.openai_search_model,
            previous_response_id=previous_response_id,
            instructions=REPLY_INSTRUCTIONS,
            input=[
                {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": json.dumps(_summarize_for_prompt(results)),
                }
            ],
        )
        text = getattr(reply_response, "output_text", None)
        if text:
            return text.strip()
    except Exception as e:  # noqa: BLE001
        logger.warning("Natural reply generation failed, falling back to template: %s", e)

    return None


def parse_and_search(query: str) -> SearchResponse:
    try:
        response = client.responses.create(
            model=settings.openai_search_model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query},
            ],
            tools=[QUERY_ASSETS_TOOL],
            tool_choice={"type": "function", "name": "query_assets"},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}") from e

    call_id, raw_filters = _parse_tool_call(response)
    logger.info("Extracted Raw Filters: %s", raw_filters)

    filters = AssetFilters(**raw_filters)
    logger.info("Extracted Filters: %s", filters.model_dump())

    results = execute_asset_query(filters)
    logger.info("Returned %d assets", len(results))

    reply = _generate_natural_reply(response.id, call_id, results)
    if not reply:
        reply = _compose_reply_fallback(filters, results)

    return SearchResponse(filters=filters, results=results, reply=reply)