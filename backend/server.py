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

try:
    from supabase import create_client as create_supabase_client
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------------------------------------------------------------------------
# MongoDB Atlas connection
# ---------------------------------------------------------------------------
from pymongo import MongoClient

_supabase = None
_mongo_client = None
_db = None
_portfolios = None

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
if _SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
    _supabase = create_supabase_client(SUPABASE_URL, SUPABASE_KEY)
else:
    _mongo_client = MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    _db = _mongo_client[os.getenv("DB_NAME", "homemaker")]
    _portfolios = _db["portfolios"]


def _repo_mode() -> str:
    return "supabase" if _supabase is not None else "mongo"


def _load_portfolio(portfolio_id: str) -> dict | None:
    if _repo_mode() == "supabase":
        res = _supabase.table("portfolios").select("*").eq("id", portfolio_id).limit(1).execute()
        rows = res.data or []
        return rows[0] if rows else None
    return _portfolios.find_one({"id": portfolio_id}, {"_id": 0})


def _find_portfolio_by_slug(slug: str, published_only: bool = False) -> dict | None:
    if _repo_mode() == "supabase":
        q = _supabase.table("portfolios").select("*").eq("slug", slug)
        if published_only:
            q = q.eq("published", True)
        res = q.limit(1).execute()
        rows = res.data or []
        return rows[0] if rows else None
    query = {"slug": slug}
    if published_only:
        query["published"] = True
    return _portfolios.find_one(query, {"_id": 0})


def _save_portfolio(doc: dict):
    if _repo_mode() == "supabase":
        _supabase.table("portfolios").upsert(doc, on_conflict="id").execute()
        return
    _portfolios.replace_one({"id": doc["id"]}, doc, upsert=True)


def _slug_exists(slug: str, portfolio_id: str) -> bool:
    if _repo_mode() == "supabase":
        res = (
            _supabase.table("portfolios")
            .select("id")
            .eq("slug", slug)
            .neq("id", portfolio_id)
            .limit(1)
            .execute()
        )
        return bool(res.data)
    existing = _portfolios.find_one({"slug": slug, "id": {"$ne": portfolio_id}}, {"_id": 0})
    return existing is not None


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
    if _slug_exists(slug, portfolio_id):
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
    doc = _find_portfolio_by_slug(slug, published_only=True)
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
    floor_plans: Optional[List[dict]] = None
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
    total_indicative_inr: Optional[int] = None
    mock: bool = True
    provider_note: Optional[str] = None


def _mock_v0_images(flow: FlowKind, brief: dict) -> AIV0ImagesResponse:
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    room = str(brief.get("room") or "Room")
    floors = str(brief.get("floors") or "G+1")
    if flow == "remodel":
        return AIV0ImagesResponse(
            floor_plans=[
                {
                    "url": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80",
                    "label": f"{room} — layout v0 (plan sketch)",
                    "hint": "Furniture + circulation overlay (indicative)",
                },
                {
                    "url": "https://images.unsplash.com/photo-1582268611958-ebfd161ef9ce?w=1000&q=80",
                    "label": "Services & ceiling v0",
                    "hint": "Lighting grid + services assumptions",
                },
            ],
            images=[
                {
                    "url": "https://images.unsplash.com/photo-1616594039964-3b6b8f9fbe16?w=640&q=75",
                    "label": "Interior mood A",
                    "hint": "Palette + joinery direction",
                },
                {
                    "url": "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=640&q=75",
                    "label": "Interior mood B",
                    "hint": "Alternate materials / lighting",
                },
                {
                    "url": "https://images.unsplash.com/photo-1615874694520-474822394e73?w=640&q=75",
                    "label": "Interior mood C",
                    "hint": "Premium finish variant",
                },
            ],
            mock=True,
            provider_note="Replace with HM_AI_IMAGE_API_KEY provider call.",
        )

    return AIV0ImagesResponse(
        floor_plans=[
            {
                "url": "/floorplan_ground.png",
                "label": "Ground floor plan v0",
                "hint": f"Zoning + room grid for {loc} (indicative, not GFC)",
            },
            {
                "url": "/floorplan_first.png",
                "label": "First floor plan v0" if floors != "G" else "Alternate ground plan v0",
                "hint": "Upper level blocking + baths" if floors != "G" else "Second layout option from same brief",
            },
        ],
        images=[
            {
                "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=75",
                "label": "Front elevation v0",
                "hint": "Street-facing façade concept",
            },
            {
                "url": "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=75",
                "label": "Rear / garden elevation",
                "hint": "Opening pattern + outdoor connection",
            },
            {
                "url": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=75",
                "label": "Massing & roof study",
                "hint": "Materials + roofline option",
            },
        ],
        mock=True,
        provider_note="Replace with HM_AI_IMAGE_API_KEY provider call.",
    )


def _mock_estimate_plan(flow: FlowKind, brief: dict, image_bundle: Optional[dict]) -> AIEstimatePlanResponse:
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    if flow == "remodel":
        estimate_lines = [
            {"label": "Demolition / prep (indicative)", "amount_inr": 55000, "note": f"{loc} interior scope"},
            {"label": "Civil + carpentry (indicative)", "amount_inr": 240000, "note": "Layout/storage updates"},
            {"label": "Electrical + lighting (indicative)", "amount_inr": 85000, "note": "Interior services allowance"},
            {"label": "Finishes + fixtures (indicative)", "amount_inr": 190000, "note": "Depends on finish tier"},
        ]
        summary = f"Dummy remodel estimate + milestones for {loc}. Replace with HM_AI_PLAN_API_KEY output later."
    else:
        estimate_lines = [
            {"label": "Structure & shell (indicative)", "amount_inr": 2650000, "note": f"{loc} floor plan + exterior v0"},
            {"label": "Exterior facade package", "amount_inr": 620000, "note": "Elevation style + materials allowance"},
            {"label": "Core interiors (indicative)", "amount_inr": 980000, "note": "Kitchen, wardrobes, baths baseline"},
            {"label": "Services (MEP rough-in)", "amount_inr": 540000, "note": "Electrical, plumbing, basic HVAC points"},
        ]
        summary = f"Dummy new-home estimate + milestones for {loc}. Replace with HM_AI_PLAN_API_KEY output later."
    total = sum(int(x["amount_inr"]) for x in estimate_lines if isinstance(x.get("amount_inr"), (int, float)))

    return AIEstimatePlanResponse(
        estimate_lines=estimate_lines,
        milestones=[
            {"title": "Design lock & consensus", "timeframe": "Weeks 1–4"},
            {"title": "Working drawings / GFC", "timeframe": "Weeks 5–10"},
            {"title": "Site execution start", "timeframe": "Per your schedule"},
        ],
        project_summary=summary,
        total_indicative_inr=total,
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
    # Always return mock design and floor plans as requested by user
    return _mock_v0_images(payload.flow, payload.brief)


@api_router.post("/ai/estimate-plan", response_model=AIEstimatePlanResponse)
async def ai_estimate_plan(payload: AIEstimatePlanRequest):
    # Always return mock estimate as requested by user
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
