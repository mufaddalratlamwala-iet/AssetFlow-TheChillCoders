import json

from fastapi import HTTPException

from app.config import settings
from app.openai_client import client
from app.tools import QUERY_ASSETS_TOOL
from app.schemas import AssetFilters, SearchResponse
from app.services.asset_query_stub import execute_asset_query


def _parse_tool_call(response) -> dict:
    for item in response.output:
        if getattr(item, "type", None) == "function_call" and item.name == "query_assets":
            return json.loads(item.arguments)

    raise HTTPException(
        status_code=502,
        detail="Model did not return structured filters for this query.",
    )


def _compose_reply(filters: AssetFilters, results: list[dict]) -> str:
    """Lightweight templated reply - no extra model call needed. Swap for an
    LLM-generated summary later if you want more natural phrasing."""
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


def parse_and_search(query: str) -> SearchResponse:
    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "Translate the user's asset search question into query_assets "
                        "filter arguments. Never invent asset data or counts."
                    ),
                },
                {"role": "user", "content": query},
            ],
            tools=[QUERY_ASSETS_TOOL],
            tool_choice={"type": "function", "name": "query_assets"},
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}") from e

    raw_filters = _parse_tool_call(response)
    filters = AssetFilters(**raw_filters)

    results = execute_asset_query(filters)  # TODO: backend team swaps stub for real DB query
    reply = _compose_reply(filters, results)

    return SearchResponse(filters=filters, results=results, reply=reply)
