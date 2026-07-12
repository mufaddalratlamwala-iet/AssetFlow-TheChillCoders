from fastapi import APIRouter, UploadFile, File

from app.schemas import ExtractedAssetFields
from app.services.extraction_service import extract_asset_fields

router = APIRouter(prefix="/ai/registration", tags=["registration"])


@router.post("/extract", response_model=ExtractedAssetFields)
async def extract(file: UploadFile = File(...)) -> ExtractedAssetFields:
    """
    Screen 4 - "Auto Fill with AI" / "Upload Invoice / Asset Photo".

    Accepts a PDF invoice or a JPG/PNG device photo, returns structured
    fields to pre-fill the Register Asset form. Nothing is written to the
    database here - the frontend still calls the existing POST /assets
    endpoint once the user verifies and clicks "Register Asset".
    """
    return await extract_asset_fields(file)
