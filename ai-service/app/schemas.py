from typing import Optional
from pydantic import BaseModel


class ExtractedAssetFields(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[str] = None
    vendor: Optional[str] = None
    cost: Optional[float] = None
    warranty_months: Optional[int] = None
    estimated_category: Optional[str] = None
    confidence: float
    needs_review: bool = False  # true when confidence < REVIEW_THRESHOLD, or core identity fields are missing


class SearchRequest(BaseModel):
    query: str


class AssetFilters(BaseModel):
    category: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    idle_days_min: Optional[int] = None
    search_text: Optional[str] = None


class SearchResponse(BaseModel):
    filters: AssetFilters
    results: list[dict]  # raw asset documents as returned by the DB layer
    reply: str  # short natural-language summary of what was found
