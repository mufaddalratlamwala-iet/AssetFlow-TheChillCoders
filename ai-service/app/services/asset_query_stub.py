from bson import ObjectId
import logging
from app.db import db
from app.schemas import AssetFilters
logger = logging.getLogger(__name__)


def execute_asset_query(filters: AssetFilters) -> list[dict]:
    assets = db.assets

    query = {}
    logger.info("Database Name: %s", db.name)
    logger.info("Collections: %s", db.list_collection_names())
    # Category
    if filters.category:
        category = db.assetcategories.find_one(
            {
                "name": {
                    "$regex": f"^{filters.category}$",
                    "$options": "i",
                }
            }
        )

        if category:
            query["categoryId"] = category["_id"]
        else:
            return []

    # Status
    if filters.status:
        query["status"] = filters.status

    # Location
    if filters.location:
        query["location"] = {
            "$regex": filters.location,
            "$options": "i",
        }

    # Search Text
    if filters.search_text:
        query["$or"] = [
            {
                "assetTag": {
                    "$regex": filters.search_text,
                    "$options": "i",
                }
            },
            {
                "serialNumber": {
                    "$regex": filters.search_text,
                    "$options": "i",
                }
            },
            {
                "name": {
                    "$regex": filters.search_text,
                    "$options": "i",
                }
            },
        ]

    # Department
    if filters.department:
        department = db.departments.find_one(
            {
                "name": {
                    "$regex": f"^{filters.department}$",
                    "$options": "i",
                }
            }
        )

        if not department:
            return []

        allocation_asset_ids = db.allocations.distinct(
            "assetId",
            {
                "departmentId": department["_id"],
                "status": "Active",
            },
        )

        if not allocation_asset_ids:
            return []

        query["_id"] = {"$in": allocation_asset_ids}

    logger.info("Mongo Query: %s", query)

    cursor = (
        assets.find(query)
        .sort("createdAt", -1)
        .limit(25)
    )

    results = []

    for asset in cursor:

        asset["_id"] = str(asset["_id"])

        if isinstance(asset.get("categoryId"), ObjectId):

            category = db.assetcategories.find_one(
                {"_id": asset["categoryId"]}
            )

            asset["category"] = (
                category["name"] if category else None
            )

            asset["categoryId"] = str(asset["categoryId"])

        results.append(asset)

    logger.info("Mongo returned %d assets", len(results))

    return results