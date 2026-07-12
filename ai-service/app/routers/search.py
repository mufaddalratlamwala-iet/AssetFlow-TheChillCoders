from fastapi import APIRouter

from app.schemas import SearchRequest, SearchResponse
from app.services.search_service import parse_and_search

router = APIRouter(prefix="/ai/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(payload: SearchRequest) -> SearchResponse:
    """
    Screen 4 - "Ask AssetFlow AI..." natural-language search bar.

    Translates the question into structured filters (category, status,
    department, location, idle_days_min) via a forced tool call, then runs
    them against the asset query layer (stubbed in asset_query_stub.py -
    backend team wires this to the real DB query used by GET /assets).

    NOTE: this is a simple synchronous REST endpoint for easy integration.
    If you want multi-turn follow-ups ("now just the Dell ones") without
    resending context, upgrade this to an OpenAI Realtime WebSocket session
    later - the tool schema in app/tools.py stays the same either way.
    """
    return parse_and_search(payload.query)
