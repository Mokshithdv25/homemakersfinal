from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import re
import json
import base64
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

# Gemini SDK
try:
    from google import genai as google_genai
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------------------------------------------------------------------------
# MongoDB Atlas connection
# ---------------------------------------------------------------------------
from pymongo import MongoClient

_mongo_client = MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
_db = _mongo_client[os.getenv("DB_NAME", "homemaker")]
_portfolios = _db["portfolios"]


def _load_portfolio(portfolio_id: str) -> dict | None:
    return _portfolios.find_one({"id": portfolio_id}, {"_id": 0})


def _save_portfolio(doc: dict):
    _portfolios.replace_one({"id": doc["id"]}, doc, upsert=True)


app = FastAPI()
api_router = APIRouter(prefix="/api")


CraftType = Literal[
    "architect",
    "designer",
    "engineer",
    "contractor",
    "plumber",
    "electrician",
    "painter",
    "carpenter",
]

EXPERIENCE_VALUES = {
    "<1 Year": 0,
    "1-2 Years": 2,
    "3-5 Years": 5,
    "6-8 Years": 8,
    "8+ Years": 8,
}


class PortfolioCreate(BaseModel):
    craft: CraftType


class PortfolioUpdate(BaseModel):
    craft: Optional[CraftType] = None
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    city: Optional[str] = None
    years_experience: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    short_bio: Optional[str] = None
    specialties: Optional[List[str]] = None
    photos: Optional[List[str]] = None  # base64 data URLs
    cover_photo: Optional[str] = None
    profile_photo: Optional[str] = None
    step: Optional[int] = None
    profile_strength: Optional[int] = None


class Portfolio(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    craft: CraftType
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    city: Optional[str] = None
    years_experience: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    short_bio: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    photos: List[str] = Field(default_factory=list)
    cover_photo: Optional[str] = None
    profile_photo: Optional[str] = None
    profile_strength: int = 15
    step: int = 1
    published: bool = False
    slug: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "pro"


@api_router.get("/")
async def root():
    return {"message": "HomeMaker API"}


@api_router.post("/portfolio", response_model=Portfolio)
async def create_portfolio(payload: PortfolioCreate):
    portfolio = Portfolio(craft=payload.craft, profile_strength=25, step=1)
    _save_portfolio(portfolio.model_dump())
    return portfolio


@api_router.get("/portfolio/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str):
    doc = _load_portfolio(portfolio_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return Portfolio(**doc)


@api_router.patch("/portfolio/{portfolio_id}", response_model=Portfolio)
async def update_portfolio(portfolio_id: str, payload: PortfolioUpdate):
    doc = _load_portfolio(portfolio_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc.update(update_fields)
    _save_portfolio(doc)
    return Portfolio(**doc)


@api_router.post("/portfolio/{portfolio_id}/publish", response_model=Portfolio)
async def publish_portfolio(portfolio_id: str):
    doc = _load_portfolio(portfolio_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if not doc.get("full_name") or not doc.get("craft"):
        raise HTTPException(status_code=400, detail="Profile incomplete")

    base = _slugify(doc.get("full_name"))
    slug = base
    # Ensure slug uniqueness across all portfolios
    existing = _portfolios.find_one({"slug": slug, "id": {"$ne": portfolio_id}}, {"_id": 0})
    if existing:
        slug = f"{base}-{doc['id'][:6]}"

    doc.update({
        "slug": slug,
        "published": True,
        "profile_strength": 100,
        "step": 4,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    _save_portfolio(doc)
    return Portfolio(**doc)


@api_router.get("/profile/{slug}", response_model=Portfolio)
async def public_profile(slug: str):
    doc = _portfolios.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return Portfolio(**doc)



# ---------------------------------------------------------------------------
# AI — two separate concerns (different API keys at the edge)
#   HM_AI_IMAGE_API_KEY   → image / v0 visual generation
#   HM_AI_PLAN_API_KEY    → estimate + project structure (LLM or second provider)
# ---------------------------------------------------------------------------
FlowKind = Literal["new_home", "remodel"]


class AIV0ImagesRequest(BaseModel):
    flow: FlowKind
    brief: dict


class AIV0ImagesResponse(BaseModel):
    images: List[dict]
    mock: bool = True
    provider_note: Optional[str] = None


class AIEstimatePlanRequest(BaseModel):
    flow: FlowKind
    brief: dict
    image_bundle: Optional[dict] = None


class AIEstimatePlanResponse(BaseModel):
    estimate_lines: List[dict]
    milestones: List[dict]
    project_summary: Optional[str] = None
    mock: bool = True
    provider_note: Optional[str] = None


def _mock_v0_images(flow: FlowKind, brief: dict) -> AIV0ImagesResponse:
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    return AIV0ImagesResponse(
        images=[
            {
                "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&q=75",
                "label": "Direction A",
                "hint": f"Modern massing — {loc}",
            },
            {
                "url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=640&q=75",
                "label": "Direction B",
                "hint": f"Alternate facade — {loc}",
            },
            {
                "url": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=640&q=75",
                "label": "Direction C",
                "hint": f"Roof + materials study — {loc}",
            },
        ],
        mock=True,
        provider_note="Replace with HM_AI_IMAGE_API_KEY provider call.",
    )


def _mock_estimate_plan(flow: FlowKind, brief: dict, image_bundle: Optional[dict]) -> AIEstimatePlanResponse:
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    return AIEstimatePlanResponse(
        estimate_lines=[
            {"label": "Structure & shell (indicative)", "amount_inr": None, "note": f"Band for {loc} mid-range finish"},
            {"label": "Interior fit-out", "amount_inr": None, "note": "From finish tier + room mix in brief"},
            {"label": "Services (MEP rough-in)", "amount_inr": None, "note": "Typical % of construction for scope"},
        ],
        milestones=[
            {"title": "Design lock & consensus", "timeframe": "Weeks 1–4"},
            {"title": "Working drawings / GFC", "timeframe": "Weeks 5–10"},
            {"title": "Site execution start", "timeframe": "Per your schedule"},
        ],
        project_summary=f"Indicative cost bands and milestone skeleton for {loc}. Wire HM_AI_PLAN_API_KEY to replace with model output.",
        mock=True,
        provider_note="Replace with HM_AI_PLAN_API_KEY for LLM / estimation service.",
    )


def _gemini_client():
    if not _GENAI_AVAILABLE:
        return None
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not key:
        return None
    return google_genai.Client(api_key=key)


@api_router.post("/ai/v0-images", response_model=AIV0ImagesResponse)
async def ai_v0_images(payload: AIV0ImagesRequest):
    client = _gemini_client()
    if not client:
        logger.info("No GEMINI_API_KEY — returning mock images.")
        return _mock_v0_images(payload.flow, payload.brief)

    brief = payload.brief
    loc = str(brief.get("location") or "India").split(",")[0].strip()
    floors = brief.get("floors", "G+1")
    plot = brief.get("plotArea", "2400")
    facing = brief.get("facing", "North")
    style = brief.get("aesthetic", "modern")

    prompt = (
        f"Photorealistic exterior render of a {style} Indian residential house. "
        f"{floors} floors, {plot} sq ft plot, {facing}-facing, located in {loc}. "
        f"Warm afternoon lighting, clean architecture, no people, high detail."
    )

    try:
        response = client.models.generate_images(
            model="models/imagen-3.0-generate-002",
            prompt=prompt,
            config=genai_types.GenerateImagesConfig(number_of_images=3),
        )
        images = []
        for i, img in enumerate(response.generated_images):
            b64 = base64.b64encode(img.image.image_bytes).decode()
            images.append({
                "url": f"data:image/png;base64,{b64}",
                "label": f"Direction {chr(65 + i)}",
                "hint": prompt,
            })
        return AIV0ImagesResponse(images=images, mock=False)
    except Exception as exc:
        logger.error(f"Gemini image generation failed: {exc}")
        return _mock_v0_images(payload.flow, payload.brief)


@api_router.post("/ai/estimate-plan", response_model=AIEstimatePlanResponse)
async def ai_estimate_plan(payload: AIEstimatePlanRequest):
    client = _gemini_client()
    if not client:
        logger.info("No GEMINI_API_KEY — returning mock estimate.")
        return _mock_estimate_plan(payload.flow, payload.brief, payload.image_bundle)

    brief = payload.brief
    loc = str(brief.get("location") or "India").split(",")[0].strip()
    floors = brief.get("floors", "G+1")
    plot = brief.get("plotArea", "2400")
    bedrooms = brief.get("bedrooms", 3)
    finish = brief.get("finishTier", "mid-range")

    prompt = f"""You are a construction cost estimator in India.

Generate a cost estimate for:
- Location: {loc}
- Plot: {plot} sq ft
- Floors: {floors}
- Bedrooms: {bedrooms}
- Finish: {finish}

Return ONLY valid JSON (no markdown, no explanation) in exactly this format:
{{
  "estimate_lines": [
    {{"label": "Structure & shell", "amount_inr": 2800000, "note": "RCC frame, brick walls"}},
    {{"label": "Interior fit-out", "amount_inr": 1200000, "note": "Tiles, paint, fixtures"}},
    {{"label": "MEP (plumbing & electrical)", "amount_inr": 600000, "note": "Rough-in + fittings"}},
    {{"label": "External works", "amount_inr": 300000, "note": "Boundary wall, driveway"}},
    {{"label": "Contingency (10%)", "amount_inr": 490000, "note": "Buffer"}}
  ],
  "milestones": [
    {{"title": "Design lock", "timeframe": "Weeks 1–4"}},
    {{"title": "Working drawings", "timeframe": "Weeks 5–10"}},
    {{"title": "Foundation & plinth", "timeframe": "Weeks 11–18"}},
    {{"title": "Structure complete", "timeframe": "Weeks 19–36"}},
    {{"title": "Finishing & handover", "timeframe": "Weeks 37–52"}}
  ],
  "project_summary": "2-sentence plain-English summary of cost and timeline."
}}"""

    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        # strip markdown fences if model wraps in ```json
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
            if text.endswith("```"):
                text = text[:-3].strip()
        data = json.loads(text)
        return AIEstimatePlanResponse(
            estimate_lines=data["estimate_lines"],
            milestones=data["milestones"],
            project_summary=data.get("project_summary"),
            mock=False,
        )
    except Exception as exc:
        logger.error(f"Gemini estimate failed: {exc}")
        return _mock_estimate_plan(payload.flow, payload.brief, payload.image_bundle)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
