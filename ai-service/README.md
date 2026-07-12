# AssetFlow AI Service

Minimal FastAPI service for the two MVP AI features on Screen 4:
1. **Smart Asset Registration** — extract fields from an invoice/photo
2. **Natural Language Asset Search** — translate a question into structured filters

Both use OpenAI only (Responses API + forced tool/function calling) — no separate OCR library.

---

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`

---

## Endpoints

### 1. `POST /ai/registration/extract`
`multipart/form-data`, field name `file` (PDF invoice or JPG/PNG photo).

```bash
curl -X POST http://localhost:1/ai/registration/extract \
  -F "file=@invoice.pdf"
```

Response:
```json
{
  "product_name": "Wireless Bluetooth Headphones",
  "brand": null,
  "model": null,
  "serial_number": null,
  "purchase_date": "2025-08-12",
  "vendor": "ABC Retail Pvt Ltd",
  "cost": 1499.0,
  "warranty_months": null,
  "estimated_category": "Electronics",
  "confidence": 0.35,
  "needs_review": true
}
```
`needs_review: true` when confidence < 0.6, **or** when `brand`, `model`, and `serial_number` are all missing — this is forced server-side, not left to the model's self-reported confidence. Marketplace invoices (Flipkart, Amazon, etc.) often list a generic product description with no manufacturer info — in that case, `product_name` is provided as a fallback so the UI can still pre-fill the asset's **Name** field, while the form clearly flags itself as needing manual identification detail before saving.

**This endpoint never writes to the database.** The frontend still calls your existing `POST /assets` once the user verifies and clicks "Register Asset".

### 2. `POST /ai/search`
```bash
curl -X POST http://localhost:8000/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query": "show idle laptops in HR"}'
```

Response:
```json
{
  "filters": {
    "category": "Electronics",
    "status": "Available",
    "department": "HR",
    "location": null,
    "idle_days_min": 90,
    "search_text": null
  },
  "results": [ ...asset documents... ],
  "reply": "1 asset found in Electronics under HR."
}
```

---

## Integration — what your backend team needs to do

**The only file you need to touch is `app/services/asset_query_stub.py`.**

Replace `execute_asset_query()` with a call into your real asset search logic —
the same one that powers `GET /assets?category=&status=&department=&location=`.
The filter field names already match that endpoint's query params, so it should
be close to a drop-in swap:

```python
# app/services/asset_query_stub.py
from app.db.assets import query_assets   # your real Mongo/PyMongo query

def execute_asset_query(filters: AssetFilters) -> list[dict]:
    return query_assets(
        category=filters.category,
        status=filters.status,
        department=filters.department,
        location=filters.location,
        idle_days_min=filters.idle_days_min,
        search_text=filters.search_text,
    )
```

Nothing else needs to change — the router, the tool schema, and the OpenAI
call are all independent of your DB layer.

---

## Notes

- Model is configurable via `OPENAI_MODEL` in `.env` — any vision + tool-calling
  capable model works (default `gpt-4.1`).
- `/ai/search` is a plain synchronous REST endpoint for easy integration. If you
  later want multi-turn follow-ups ("now just the Dell ones") without resending
  context each time, upgrade to an OpenAI Realtime WebSocket session — the tool
  schema in `app/tools.py` (`query_assets`) stays exactly the same either way.
- Auth/role checks are NOT included here — mount this service behind your
  existing JWT/role middleware, or add a dependency that validates the
  Authorization header before calling these routes.
- Max upload size is capped via `MAX_UPLOAD_SIZE_BYTES` in `.env` (default 10MB).

---

## Project structure

```
ai-service/
├── app/
│   ├── main.py                        FastAPI app + CORS + routers
│   ├── config.py                      env var loading
│   ├── openai_client.py               shared OpenAI client instance
│   ├── tools.py                       function-calling schemas (both features)
│   ├── schemas.py                     Pydantic request/response models
│   ├── routers/
│   │   ├── registration.py            POST /ai/registration/extract
│   │   └── search.py                  POST /ai/search
│   └── services/
│       ├── extraction_service.py      invoice/photo -> structured fields
│       ├── search_service.py          NL query -> structured filters
│       └── asset_query_stub.py        <- REPLACE with real DB query
├── requirements.txt
├── .env.example
└── README.md
```
