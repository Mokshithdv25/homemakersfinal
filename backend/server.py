from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    license_number: Optional[str] = None
    short_bio: Optional[str] = None
    specialties: Optional[List[str]] = None
    photos: Optional[List[str]] = None  # base64 data URLs
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
    license_number: Optional[str] = None
    short_bio: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    photos: List[str] = Field(default_factory=list)
    profile_strength: int = 15
    step: int = 1
    published: bool = False
    slug: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def _slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "pro"


async def _doc_to_portfolio(doc: dict) -> Portfolio:
    for key in ("created_at", "updated_at"):
        if isinstance(doc.get(key), str):
            doc[key] = datetime.fromisoformat(doc[key])
    return Portfolio(**doc)


@api_router.get("/")
async def root():
    return {"message": "HomeMaker API"}


@api_router.post("/portfolio", response_model=Portfolio)
async def create_portfolio(payload: PortfolioCreate):
    portfolio = Portfolio(craft=payload.craft, profile_strength=25, step=1)
    doc = portfolio.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.portfolios.insert_one(doc)
    return portfolio


@api_router.get("/portfolio/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str):
    doc = await db.portfolios.find_one({"id": portfolio_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return await _doc_to_portfolio(doc)


@api_router.patch("/portfolio/{portfolio_id}", response_model=Portfolio)
async def update_portfolio(portfolio_id: str, payload: PortfolioUpdate):
    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.portfolios.find_one_and_update(
        {"id": portfolio_id},
        {"$set": update_fields},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return await _doc_to_portfolio(result)


@api_router.post("/portfolio/{portfolio_id}/publish", response_model=Portfolio)
async def publish_portfolio(portfolio_id: str):
    doc = await db.portfolios.find_one({"id": portfolio_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if not doc.get("full_name") or not doc.get("craft"):
        raise HTTPException(status_code=400, detail="Profile incomplete")

    base = _slugify(doc.get("full_name"))
    slug = base
    # Ensure uniqueness
    existing = await db.portfolios.find_one(
        {"slug": slug, "id": {"$ne": portfolio_id}}, {"_id": 0, "slug": 1}
    )
    if existing:
        slug = f"{base}-{doc['id'][:6]}"

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = await db.portfolios.find_one_and_update(
        {"id": portfolio_id},
        {"$set": {
            "slug": slug,
            "published": True,
            "profile_strength": 100,
            "step": 4,
            "updated_at": now_iso,
        }},
        return_document=True,
        projection={"_id": 0},
    )
    return await _doc_to_portfolio(updated)


@api_router.get("/profile/{slug}", response_model=Portfolio)
async def public_profile(slug: str):
    doc = await db.portfolios.find_one(
        {"slug": slug, "published": True},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return await _doc_to_portfolio(doc)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
