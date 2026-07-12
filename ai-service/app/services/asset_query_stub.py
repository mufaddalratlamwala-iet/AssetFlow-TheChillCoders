"""
TODO (backend team): replace the body of `execute_asset_query` with a real
call to your existing asset search logic / Mongo query, using the same
filters your `GET /assets` endpoint already accepts:

    category, status, department, location, idle_days_min, search_text

This stub exists only so the AI service is runnable/testable in isolation.
Wire it up like:

    from app.db.assets import query_assets  # your real Mongoose/PyMongo query
    def execute_asset_query(filters: dict) -> list[dict]:
        return query_assets(**filters)
"""

from app.schemas import AssetFilters


def execute_asset_query(filters: AssetFilters) -> list[dict]:
    # --- STUB DATA - replace with real DB call ---
    mock_assets = [
        {
            "asset_tag": "AF-0114",
            "name": "Dell Latitude 5430",
            "category": "Electronics",
            "status": "Available",
            "department": "HR",
            "location": "Bangalore",
            "idle_days": 132,
        },
        {
            "asset_tag": "AF-0201",
            "name": "Office Chair",
            "category": "Furniture",
            "status": "Available",
            "department": "HR",
            "location": "Warehouse",
            "idle_days": 40,
        },
    ]

    results = mock_assets
    if filters.category:
        results = [a for a in results if a["category"].lower() == filters.category.lower()]
    if filters.status:
        results = [a for a in results if a["status"].lower() == filters.status.lower()]
    if filters.department:
        results = [a for a in results if a["department"].lower() == filters.department.lower()]
    if filters.location:
        results = [a for a in results if a["location"].lower() == filters.location.lower()]
    if filters.idle_days_min is not None:
        results = [a for a in results if a.get("idle_days", 0) >= filters.idle_days_min]

    return results
