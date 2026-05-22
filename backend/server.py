from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import re
import json
import base64
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def _xai_api_key(purpose: Literal["image", "plan"] = "plan") -> str:
    """xAI key: XAI_API_KEY first, then purpose-specific HM_* keys."""
    names = (
        ["XAI_API_KEY", "HM_AI_IMAGE_API_KEY", "HM_AI_PLAN_API_KEY"]
        if purpose == "image"
        else ["XAI_API_KEY", "HM_AI_PLAN_API_KEY", "HM_AI_IMAGE_API_KEY"]
    )
    for name in names:
        val = os.getenv(name, "").strip()
        if val:
            return val
    return ""


def _parse_estimate_plan_json(parsed: dict) -> Optional[AIEstimatePlanResponse]:
    estimate_lines = parsed.get("estimate_lines") or []
    milestones = parsed.get("milestones") or []
    summary = str(parsed.get("project_summary") or "").strip()
    if not estimate_lines or not milestones or not summary:
        return None

    total = 0
    normalized_lines = []
    for line in estimate_lines:
        amount = int(float(line.get("amount_inr", 0) or 0))
        total += max(amount, 0)
        normalized_lines.append(
            {
                "label": str(line.get("label") or "Line item"),
                "amount_inr": max(amount, 0),
                "note": str(line.get("note") or ""),
            }
        )

    normalized_milestones = [
        {
            "title": str(m.get("title") or "Milestone"),
            "timeframe": str(m.get("timeframe") or ""),
        }
        for m in milestones
    ]

    return AIEstimatePlanResponse(
        estimate_lines=normalized_lines,
        milestones=normalized_milestones,
        project_summary=summary,
        total_indicative_inr=total,
        mock=False,
        provider_note="",
    )


def _brief_budget_inr(brief: dict) -> Optional[int]:
    """Parse homeowner budget cap from wizard brief (lakhs or crores)."""
    raw = brief.get("budgetInr")
    if raw is not None:
        try:
            n = int(float(raw))
            return max(n, 0) if n > 0 else None
        except (TypeError, ValueError):
            pass
    try:
        amount = int(float(brief.get("budgetAmount") or 0))
    except (TypeError, ValueError):
        amount = 0
    if amount <= 0:
        return None
    unit = str(brief.get("budgetUnit") or "Lakhs").lower()
    if unit.startswith("cr"):
        return amount * 10_000_000
    return amount * 100_000


def _estimate_system_prompt(flow: FlowKind) -> str:
    if flow == "remodel":
        return (
            "You are an interior remodel cost estimator for Indian homes (single room or zone only). "
            "Return strict JSON only with keys: estimate_lines, milestones, project_summary. "
            "estimate_lines: array of {label, amount_inr, note} — 4-6 lines for ROOM-SCALE work only "
            "(demolition/prep, civil/carpentry, electrical/lighting, finishes/fixtures, soft furnishings, contingency). "
            "NEVER include whole-house items: no RCC frame, no structure & shell, no G+1/3BHK, no foundation, "
            "no external works, no boundary wall, no facade package. "
            "milestones: array of {title, timeframe} for a remodel (design lock, procurement, execution, handover). "
            "The sum of amount_inr MUST stay within the homeowner budgetInr in the brief (use 90-100% of cap; "
            "contingency is one line inside the cap, not on top). "
            "project_summary: 2-3 sentences referencing room, budget band, and timeline only. No markdown."
        )
    return (
        "You are a construction planning assistant for Indian residential new-build projects. "
        "Return strict JSON only with keys: estimate_lines, milestones, project_summary. "
        "estimate_lines: array of {label, amount_inr, note}. "
        "milestones: array of {title, timeframe}. "
        "Use realistic INR ranges for the city/region in the brief. No markdown."
    )


_REMODEL_WRONG_ESTIMATE = re.compile(
    r"structure\s*&\s*shell|\brcc\b|g\+[0-9]?|3\s*bhk|facade\s*package|"
    r"foundation\s*&\s*plinth|external\s*works|boundary\s*wall",
    re.IGNORECASE,
)


def _estimate_looks_like_new_build(lines: List[dict]) -> bool:
    for line in lines or []:
        blob = f"{line.get('label', '')} {line.get('note', '')}"
        if _REMODEL_WRONG_ESTIMATE.search(blob):
            return True
    return False


def _remodel_estimate_from_brief(brief: dict) -> AIEstimatePlanResponse:
    """Deterministic remodel estimate anchored to homeowner budget cap."""
    cap = _brief_budget_inr(brief) or 700_000
    room = str(brief.get("room") or "room")
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    finish = str(brief.get("finishTier") or "mid-range")
    timeline = str(brief.get("completionTime") or brief.get("startTimeline") or "per brief")

    weights = [
        ("Demolition & site prep (indicative)", 0.08, f"{room} — dust control, protection, strip-out"),
        ("Civil & carpentry (indicative)", 0.34, "Layout tweaks, storage, false ceiling allowance"),
        ("Electrical & lighting (indicative)", 0.16, "Points, fixtures, dimming — per dealbreakers"),
        ("Finishes & fixtures (indicative)", 0.34, f"{finish} tier — paint, flooring, loose furniture"),
        ("Contingency (within cap)", 0.08, "Buffer for site surprises — stays inside your budget band"),
    ]
    estimate_lines = []
    running = 0
    for label, pct, note in weights[:-1]:
        amt = int(round(cap * pct))
        running += amt
        estimate_lines.append({"label": label, "amount_inr": amt, "note": note})
    last_amt = max(cap - running, 0)
    estimate_lines.append(
        {"label": weights[-1][0], "amount_inr": last_amt, "note": weights[-1][2]}
    )
    total = sum(int(x["amount_inr"]) for x in estimate_lines)

    return AIEstimatePlanResponse(
        estimate_lines=estimate_lines,
        milestones=[
            {"title": "Concept lock & material samples", "timeframe": "Weeks 1–2"},
            {"title": "Working drawings & vendor BOQ", "timeframe": "Weeks 3–5"},
            {"title": "Execution on site", "timeframe": timeline},
            {"title": "Snag, handover & styling", "timeframe": "Final week"},
        ],
        project_summary=(
            f"Indicative {room.lower()} remodel in {loc} scoped to your stated budget band "
            f"(≈ {total // 100_000} L all-in, ex-GST). Room-size allowances only — not a full-home build."
        ),
        total_indicative_inr=total,
        mock=False,
        provider_note="Remodel estimate aligned to your wizard budget (room scope).",
    )


def _grok_estimate_plan(
    flow: FlowKind, brief: dict, image_bundle: Optional[dict]
) -> Optional[AIEstimatePlanResponse]:
    key = _xai_api_key("plan")
    if not key:
        return None

    model = os.getenv("GROK_CHAT_MODEL", "grok-3-mini").strip() or "grok-3-mini"
    flow_label = "remodel" if flow == "remodel" else "new home build"
    brief_json = json.dumps(brief or {}, ensure_ascii=False)
    image_json = json.dumps(image_bundle or {}, ensure_ascii=False)
    constraints = _brief_constraints_summary(flow, brief)
    budget_inr = _brief_budget_inr(brief)
    budget_line = (
        f"Budget cap (INR, hard limit): {budget_inr}\n" if budget_inr else ""
    )
    user_prompt = (
        f"Flow: {flow_label}\n"
        f"{budget_line}"
        f"Structured constraints:\n{constraints}\n\n"
        f"Full brief JSON: {brief_json}\n"
        f"Image bundle JSON: {image_json}\n"
        "Return 4-6 estimate_lines and 4-6 milestones."
    )

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": 0.25 if flow == "remodel" else 0.3,
                "messages": [
                    {"role": "system", "content": _estimate_system_prompt(flow)},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=60,
        )
        resp.raise_for_status()
        payload = resp.json()
        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "{}")
        )
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
        parsed = json.loads(content)
        result = _parse_estimate_plan_json(parsed)
        if result is None:
            if flow == "remodel":
                return _remodel_estimate_from_brief(brief)
            return None
        if flow == "remodel":
            cap = budget_inr
            if _estimate_looks_like_new_build(result.estimate_lines):
                logger.warning("Grok returned new-build-style lines for remodel; using budget-anchored estimate")
                return _remodel_estimate_from_brief(brief)
            if cap and result.total_indicative_inr and result.total_indicative_inr > int(cap * 1.15):
                logger.warning(
                    "Grok remodel total %s exceeds budget cap %s; using budget-anchored estimate",
                    result.total_indicative_inr,
                    cap,
                )
                return _remodel_estimate_from_brief(brief)
        result.provider_note = f"Generated by xAI {model} (Grok)."
        return result
    except Exception as exc:
        logger.exception("Grok estimate-plan generation failed: %s", exc)
        return None


def _grok_image_timeout_sec() -> int:
    try:
        return max(12, min(90, int(os.getenv("GROK_IMAGE_TIMEOUT", "24"))))
    except ValueError:
        return 24


def _grok_generate_image(
    prompt: str, aspect_ratio: str = "16:9", timeout_sec: Optional[int] = None
) -> Optional[str]:
    key = _xai_api_key("image")
    if not key:
        return None

    model = os.getenv("GROK_IMAGE_MODEL", "grok-imagine-image").strip() or "grok-imagine-image"
    timeout = timeout_sec if timeout_sec is not None else _grok_image_timeout_sec()
    try:
        resp = requests.post(
            "https://api.x.ai/v1/images/generations",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "n": 1,
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json().get("data") or []
        if not data:
            return None
        item = data[0]
        url = item.get("url")
        if url:
            return str(url)
        b64 = item.get("b64_json")
        if b64:
            return f"data:image/jpeg;base64,{b64}"
        return None
    except Exception as exc:
        logger.exception("Grok image generation failed: %s", exc)
        return None


def _brief_list(val) -> str:
    if val is None:
        return ""
    if isinstance(val, list):
        return ", ".join(str(x) for x in val if x)
    return str(val).strip()


def _brief_style_hint(brief: dict) -> str:
    parts = []
    for key in (
        "resolvedArchStyle",
        "archPrimary",
        "archTraditionalVariant",
        "styles",
        "style",
        "designStyle",
        "aesthetic",
        "theme",
        "vibe",
    ):
        val = brief.get(key)
        if val:
            parts.append(_brief_list(val) if key == "styles" else str(val))
    return ", ".join(dict.fromkeys(p for p in parts if p)) or "modern Indian residential"


def _brief_constraints_summary(flow: FlowKind, brief: dict) -> str:
    """Turn wizard JSON into a short constraint block for Grok prompts."""
    loc = str(brief.get("location") or "India").strip()
    style = _brief_style_hint(brief)
    lines = [f"Location: {loc}", f"Style: {style}"]

    if flow == "remodel":
        room = str(brief.get("room") or "room")
        lines.append(f"Room / space: {room}")
        lines.append("Project type: interior remodel (single room/zone — NOT a new house build)")
        size = brief.get("roomSizeLabel") or ""
        if size:
            lines.append(f"Room size: {size}")
        ptype = brief.get("propertyType") or brief.get("ptype")
        if ptype:
            lines.append(f"Property: {ptype}")
        for label, key in (
            ("Goals", "mainGoal"),
            ("Pain points", "painPoints"),
            ("Change level", "changeLevel"),
            ("Layout", "layoutOk"),
            ("Must keep", "mustKeep"),
            ("Dealbreakers", "dealbreakers3"),
            ("Finish tier", "finishTier"),
            ("Timeline", "startTimeline"),
        ):
            v = brief.get(key)
            if v:
                lines.append(f"{label}: {_brief_list(v) if isinstance(v, list) else v}")
        cap = _brief_budget_inr(brief)
        if cap:
            lines.append(f"Budget cap (INR): {cap} — total estimate must not exceed this")
    else:
        floors = str(brief.get("floors") or "G+1")
        dim_w = brief.get("dimW")
        dim_l = brief.get("dimL")
        if dim_w and dim_l:
            lines.append(f"Plot: {dim_w} ft × {dim_l} ft")
        lines.append(f"Floors: {floors}")
        for label, key in (
            ("Lifestyle", "lifestyle"),
            ("Exterior prefs", "exteriorPrefs"),
            ("Finish tier", "finishTier"),
            ("Kitchen", "kitchen"),
            ("Family size", "familyMembers"),
        ):
            v = brief.get(key)
            if v:
                lines.append(f"{label}: {_brief_list(v) if isinstance(v, list) else v}")

    budget = (
        brief.get("budgetLabel")
        or brief.get("budget")
        or brief.get("budgetTier")
    )
    if not budget and brief.get("budgetAmount"):
        unit = brief.get("budgetUnit") or "Lakhs"
        budget = f"₹{brief['budgetAmount']} {unit}"
    if budget:
        lines.append(f"Budget band: {budget}")

    vision = str(brief.get("dreamVision") or brief.get("homeVision") or "").strip()
    if vision:
        lines.append(f"Homeowner vision: {vision[:500]}")

    return "\n".join(lines)


def _grok_v0_image_prompts(flow: FlowKind, brief: dict) -> List[tuple]:
    """Returns list of (label, hint, prompt, aspect_ratio)."""
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    style = _brief_style_hint(brief)
    room = str(brief.get("room") or "living space")
    floors = str(brief.get("floors") or "G+1")
    constraints = _brief_constraints_summary(flow, brief)

    if flow == "remodel":
        indoor_only = (
            "STRICT: indoor photograph ONLY — no building exterior, no facade, no roofline, "
            "no street view, no cars, no aerial. Show the furnished room interior.\n"
        )
        base = (
            f"Photorealistic interior design visualization for a {room} remodel in {loc}, India.\n"
            f"{indoor_only}"
            f"Constraints from homeowner brief:\n{constraints}\n"
        )
        return [
            (
                "Interior direction A",
                f"{room} — palette and joinery",
                base
                + "Variant A: main palette, joinery, and seating layout. Warm natural window light. No text, no watermark.",
                "4:3",
            ),
            (
                "Interior direction B",
                "Alternate materials / lighting",
                base
                + "Variant B: alternate wall finish, flooring, and lighting mood. Same room, different materials. No text, no watermark.",
                "4:3",
            ),
            (
                "Interior direction C",
                "Refined finish variant",
                base
                + "Variant C: refined premium finish level inside the room. No text, no watermark.",
                "4:3",
            ),
        ]


def _grok_remodel_floor_plan_prompts(brief: dict) -> List[tuple]:
    """Layout sketches for remodel — interior plan, not building exterior."""
    loc = str(brief.get("location") or "India").split(",")[0].strip() or "India"
    room = str(brief.get("room") or "living room")
    size = str(brief.get("roomSizeLabel") or "medium room")
    style = _brief_style_hint(brief)
    base = (
        f"Architectural interior layout plan drawing, top-down view, {room} in {loc}, India. "
        f"Room size: {size}. Style: {style}. "
        "Black ink lines on white paper, furniture placement, doors/windows as symbols. "
        "NO exterior elevation, NO house facade, NO 3D building render. No text labels, no watermark.\n"
    )
    return [
        (
            f"{room} — layout v0 (plan sketch)",
            "Furniture + circulation overlay on room footprint (indicative)",
            base + "Focus: sofa, TV unit, circulation paths.",
            "4:3",
        ),
        (
            "Services & ceiling v0",
            "Lighting grid + services assumptions for discussion",
            base + "Focus: ceiling plan, light positions, AC diffuser symbols.",
            "4:3",
        ),
    ]

    base = (
        f"Photorealistic residential architecture in {loc}, India. {floors} home.\n"
        f"Constraints from homeowner brief:\n{constraints}\n"
    )
    return [
        (
            "Front elevation v0",
            "Street-facing façade concept",
            base + "Front elevation, street-facing façade, clear daylight. No text, no watermark.",
            "16:9",
        ),
        (
            "Rear / garden elevation",
            "Outdoor connection",
            base + "Rear elevation with garden or courtyard connection. No text, no watermark.",
            "16:9",
        ),
        (
            "Massing & roof study",
            "Materials + roofline",
            base + "Three-quarter massing view showing roofline and materials. No text, no watermark.",
            "16:9",
        ),
    ]


def _generate_specs_parallel(
    specs: List[Tuple[str, str, str, str]], max_workers: int = 3
) -> List[dict]:
    """Run Grok image calls in parallel so Render's ~30s HTTP limit is not exceeded."""
    if not specs:
        return []

    timeout = _grok_image_timeout_sec()

    def _one(spec: Tuple[str, str, str, str]) -> Optional[dict]:
        label, hint, prompt, aspect = spec
        url = _grok_generate_image(prompt, aspect_ratio=aspect, timeout_sec=timeout)
        if not url:
            return None
        return {"url": url, "label": label, "hint": hint}

    workers = max(1, min(max_workers, len(specs)))
    out: List[dict] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(_one, s) for s in specs]
        for fut in as_completed(futures):
            try:
                item = fut.result()
                if item:
                    out.append(item)
            except Exception as exc:
                logger.warning("Parallel Grok image task failed: %s", exc)
    return out


def _remodel_static_floor_plans(brief: dict) -> List[dict]:
    """Indicative layout cards — interior-scoped stock (not building exteriors)."""
    room = str(brief.get("room") or "Room")
    return [
        {
            "url": "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=1000&q=80",
            "label": f"{room} — layout v0 (indicative)",
            "hint": "Furniture + circulation overlay for discussion (not GFC)",
        },
        {
            "url": "https://images.unsplash.com/photo-1615874694520-474822394e73?w=1000&q=80",
            "label": "Services & ceiling v0 (indicative)",
            "hint": "Lighting + services assumptions — confirm with your pro",
        },
    ]


def _grok_v0_images(flow: FlowKind, brief: dict) -> Optional[AIV0ImagesResponse]:
    if not _xai_api_key("image"):
        logger.warning("Grok images skipped: no XAI_API_KEY / HM_AI_IMAGE_API_KEY")
        return None

    try:
        default_moods = "2" if flow == "remodel" else "3"
        mood_count = max(1, min(5, int(os.getenv("GROK_V0_MOOD_IMAGES", default_moods))))
    except ValueError:
        mood_count = 2 if flow == "remodel" else 3

    mood_specs = _grok_v0_image_prompts(flow, brief)[:mood_count]
    images = _generate_specs_parallel(mood_specs, max_workers=mood_count)

    floor_plans: List[dict] = []
    if flow == "remodel":
        gen_fp = os.getenv("GROK_V0_REMODEL_FLOOR_PLANS", "0").strip().lower() in (
            "1",
            "true",
            "yes",
        )
        if gen_fp:
            fp_specs = _grok_remodel_floor_plan_prompts(brief)
            floor_plans = _generate_specs_parallel(fp_specs, max_workers=2)
        if not floor_plans:
            floor_plans = _remodel_static_floor_plans(brief)
    else:
        floor_plans = list(_mock_v0_images(flow, brief).floor_plans or [])

    if not images:
        logger.warning("Grok returned zero images for flow=%s", flow)
        return None

    model = os.getenv("GROK_IMAGE_MODEL", "grok-imagine-image").strip() or "grok-imagine-image"
    fp_note = (
        " Layout cards are indicative references."
        if flow == "remodel"
        else " Floor plans are indicative placeholders."
    )
    return AIV0ImagesResponse(
        images=images,
        floor_plans=floor_plans,
        mock=False,
        provider_note=(
            f"Generated {len(images)} concept image(s) via xAI {model} (parallel, ~$0.02/img)."
            + fp_note
        ),
    )


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
        return _remodel_estimate_from_brief(brief)

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


def _openai_estimate_plan(flow: FlowKind, brief: dict, image_bundle: Optional[dict]) -> Optional[AIEstimatePlanResponse]:
    key = (
        os.getenv("HM_AI_PLAN_API_KEY", "").strip()
        or os.getenv("OPENAI_API_KEY", "").strip()
    )
    if not key:
        return None

    flow_label = "remodel" if flow == "remodel" else "new home build"
    brief_json = json.dumps(brief or {}, ensure_ascii=False)
    image_json = json.dumps(image_bundle or {}, ensure_ascii=False)
    constraints = _brief_constraints_summary(flow, brief)
    budget_inr = _brief_budget_inr(brief)
    budget_line = (
        f"Budget cap (INR, hard limit): {budget_inr}\n" if budget_inr else ""
    )

    user_prompt = (
        f"Flow: {flow_label}\n"
        f"{budget_line}"
        f"Structured constraints:\n{constraints}\n\n"
        f"Brief JSON: {brief_json}\n"
        f"Image bundle JSON: {image_json}\n"
        "Return 4-6 estimate lines and 4-6 milestones."
    )

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "temperature": 0.25 if flow == "remodel" else 0.3,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": _estimate_system_prompt(flow)},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=30,
        )
        resp.raise_for_status()
        payload = resp.json()
        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "{}")
        )
        parsed = json.loads(content)
        result = _parse_estimate_plan_json(parsed)
        if result is None:
            if flow == "remodel":
                return _remodel_estimate_from_brief(brief)
            return None
        if flow == "remodel" and (
            _estimate_looks_like_new_build(result.estimate_lines)
            or (
                budget_inr
                and result.total_indicative_inr
                and result.total_indicative_inr > int(budget_inr * 1.15)
            )
        ):
            return _remodel_estimate_from_brief(brief)
        result.provider_note = "Generated by OpenAI gpt-4o-mini via HM_AI_PLAN_API_KEY."
        return result
    except Exception as exc:
        logger.exception("OpenAI estimate-plan generation failed: %s", exc)
        return None


def _gemini_client():
    if not _GENAI_AVAILABLE:
        return None
    key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not key:
        return None
    return google_genai.Client(api_key=key)


@api_router.get("/ai/status")
async def ai_status():
    return {
        "grok_configured": bool(_xai_api_key("plan") or _xai_api_key("image")),
        "image_model": os.getenv("GROK_IMAGE_MODEL", "grok-imagine-image"),
        "chat_model": os.getenv("GROK_CHAT_MODEL", "grok-3-mini"),
    }


@api_router.post("/ai/v0-images", response_model=AIV0ImagesResponse)
async def ai_v0_images(payload: AIV0ImagesRequest):
    grok = _grok_v0_images(payload.flow, payload.brief)
    if grok is not None:
        return grok
    mock = _mock_v0_images(payload.flow, payload.brief)
    mock.provider_note = (
        "Demo placeholders — set XAI_API_KEY on Render (homemakers service) and redeploy. "
        + (mock.provider_note or "")
    )
    logger.warning("ai/v0-images falling back to mock for flow=%s", payload.flow)
    return mock


@api_router.post("/ai/estimate-plan", response_model=AIEstimatePlanResponse)
async def ai_estimate_plan(payload: AIEstimatePlanRequest):
    grok = _grok_estimate_plan(payload.flow, payload.brief, payload.image_bundle)
    if grok is not None:
        return grok
    llm = _openai_estimate_plan(payload.flow, payload.brief, payload.image_bundle)
    if llm is not None:
        if payload.flow == "remodel" and (
            _estimate_looks_like_new_build(llm.estimate_lines)
            or (
                _brief_budget_inr(payload.brief)
                and llm.total_indicative_inr
                and llm.total_indicative_inr
                > int(_brief_budget_inr(payload.brief) * 1.15)
            )
        ):
            return _remodel_estimate_from_brief(payload.brief)
        return llm
    if payload.flow == "remodel":
        return _remodel_estimate_from_brief(payload.brief)
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
