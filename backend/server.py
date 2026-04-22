from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ===== Portfolio Models =====
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


class PortfolioCreate(BaseModel):
    craft: CraftType


class PortfolioUpdate(BaseModel):
    craft: Optional[CraftType] = None
    name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None
    specialties: Optional[List[str]] = None


class Portfolio(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    craft: CraftType
    name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    profile_strength: int = 15
    step: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/")
async def root():
    return {"message": "HomeMaker API"}


@api_router.post("/portfolio", response_model=Portfolio)
async def create_portfolio(payload: PortfolioCreate):
    portfolio = Portfolio(craft=payload.craft)
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
    for key in ("created_at", "updated_at"):
        if isinstance(doc.get(key), str):
            doc[key] = datetime.fromisoformat(doc[key])
    return Portfolio(**doc)


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
    for key in ("created_at", "updated_at"):
        if isinstance(result.get(key), str):
            result[key] = datetime.fromisoformat(result[key])
    return Portfolio(**result)


# Include the router in the main app
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
