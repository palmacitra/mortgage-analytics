"""
Hyper Mortgage Agentic Tool — FastAPI Backend
Ultra-lightweight: no DB server, no ORM, pure in-memory JSON.
Target RAM: < 120 MB for this process.
"""

import json
import math
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── In-memory store (populated at startup) ────────────────────────────────────
CUSTOMERS: dict = {}
PROPERTY_PRICES: dict = {}

# ── Constants (Bank BTN KPR standard rules 2024) ──────────────────────────────
BTN_KPR_TENOR_MONTHS  = 240        # 20-year standard tenor
BTN_KPR_ANNUAL_RATE   = 0.0775     # 7.75% p.a. fixed (BTN KPR Subsidi reference)
BTN_MAX_DTI_RATIO     = 0.40       # BI rule: total debt ≤ 40% gross income
DP_PERCENTAGE         = 0.10       # Minimum Down-Payment 10% for KPR Non-Subsidi
SUBSIDI_DP            = 0.01       # 1% DP for KPR FLPP/Subsidi (income < 8 jt)
SUBSIDI_INCOME_LIMIT  = 8_000_000  # FLPP income ceiling (IDR/month)

# ── Lifespan: load data once at startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load synthetic customer data and property prices into memory at startup."""
    global CUSTOMERS, PROPERTY_PRICES

    # Resolve path relative to this file so the server can be started from any cwd
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "synthetic_customers.json")

    if not os.path.exists(data_path):
        raise RuntimeError(f"Data file not found: {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    CUSTOMERS = {c["id"]: c for c in raw["customers"]}
    PROPERTY_PRICES = raw["property_prices_per_district"]

    print(f"[startup] Loaded {len(CUSTOMERS)} customers and {len(PROPERTY_PRICES)} districts.")
    yield
    # Shutdown: nothing to clean up for in-memory store
    print("[shutdown] Server stopped.")


# ── Bootstrap ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Hyper Mortgage Agentic Tool API",
    description="AI-driven mortgage pre-approval engine — Proof of Concept",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Relaxed for PoC/demo — restrict to frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper: Monthly annuity mortgage installment ──────────────────────────────
def monthly_installment(
    principal: float,
    annual_rate: float = BTN_KPR_ANNUAL_RATE,
    months: int = BTN_KPR_TENOR_MONTHS,
) -> float:
    """Standard amortizing installment (Anuitas) formula used by Indonesian banks."""
    if principal <= 0:
        return 0.0
    r = annual_rate / 12
    if r == 0:
        return principal / months
    return principal * r * (1 + r) ** months / ((1 + r) ** months - 1)


# ── Core Scoring Engine ────────────────────────────────────────────────────────
def scoring_engine(customer: dict) -> dict:
    """
    Deterministic credit underwriting model based on:
      - BI Regulation No. 17/10/PBI/2015
      - BTN KPR guidelines 2024

    Returns a rich analysis dict consumed by the frontend.
    """
    income = float(customer["monthly_income_idr"])
    rent   = float(customer["current_rent_idr"])
    debt   = float(customer["existing_debt_idr"])
    credit = customer["credit_history"]   # "Good" | "Bad"
    loc    = customer["location"]

    # Guard: income must be positive to avoid division by zero
    if income <= 0:
        raise ValueError("monthly_income_idr must be positive")

    # ── 1. Debt-to-Income Ratio ────────────────────────────────────────────────
    dti_current     = debt / income
    max_new_payment = max(0.0, (income * BTN_MAX_DTI_RATIO) - debt)

    # ── 2. Maximum Affordable House Price ─────────────────────────────────────
    max_loan_principal = max_new_payment * BTN_KPR_TENOR_MONTHS

    dp_rate        = SUBSIDI_DP if income <= SUBSIDI_INCOME_LIMIT else DP_PERCENTAGE
    # Avoid division by zero if dp_rate is somehow 1.0
    divisor        = max(0.01, 1 - dp_rate)
    max_house_price = max_loan_principal / divisor
    down_payment   = max_house_price * dp_rate

    # ── 3. Estimated Monthly Mortgage vs. Current Rent ────────────────────────
    proposed_installment    = monthly_installment(max_loan_principal)
    rent_vs_mortgage_delta  = proposed_installment - rent

    # ── 4. Affordability Score (0–100) ────────────────────────────────────────
    score = 100.0

    # a) DTI penalty
    if dti_current > 0.30:
        score -= min(25.0, (dti_current - 0.30) * 200)

    # b) Credit history penalty
    if credit == "Bad":
        score -= 30.0

    # c) Rent-to-income ratio (healthy < 35%)
    rent_ratio = rent / income
    if rent_ratio > 0.35:
        score -= min(15.0, (rent_ratio - 0.35) * 100)

    # d) Income sufficiency vs. cheapest local market
    local_price = PROPERTY_PRICES.get(loc, {}).get("avg_type36_price", 600_000_000)
    required_income = local_price / (BTN_MAX_DTI_RATIO * BTN_KPR_TENOR_MONTHS)
    if income < required_income:
        gap_ratio = (required_income - income) / required_income
        score -= min(20.0, gap_ratio * 40)

    # e) Stable employment bonus
    stable_types = {"Karyawan Tetap", "Profesional", "Direktur", "Manajer Senior"}
    if customer.get("employment_type") in stable_types:
        score += 5.0

    score = max(0.0, min(100.0, round(score, 1)))

    # ── 5. Risk Classification ─────────────────────────────────────────────────
    if score >= 70 and credit == "Good":
        risk_level      = "Low"
        approval_status = "Pre-Approved"
    elif score >= 45:
        risk_level      = "Medium"
        approval_status = "Pending Review"
    else:
        risk_level      = "High"
        approval_status = "Tidak Disetujui"

    # ── 6. District Recommendations ───────────────────────────────────────────
    recommended = _recommend_districts(max_house_price, loc)

    # ── 7. KPR Programme eligibility ──────────────────────────────────────────
    kpr_program = (
        "KPR FLPP (Subsidi)" if income <= SUBSIDI_INCOME_LIMIT else "KPR Non-Subsidi BTN"
    )

    return {
        "customer_id"          : customer["id"],
        "customer_name"        : customer["name"],
        "affordability_score"  : score,
        "risk_level"           : risk_level,
        "approval_status"      : approval_status,
        "kpr_program"          : kpr_program,
        "financials": {
            "monthly_income_idr"       : income,
            "existing_debt_idr"        : debt,
            "current_rent_idr"         : rent,
            "dti_ratio_pct"            : round(dti_current * 100, 2),
            "max_dti_allowed_pct"      : BTN_MAX_DTI_RATIO * 100,
            "max_loan_principal_idr"   : round(max_loan_principal),
            "max_house_price_idr"      : round(max_house_price),
            "down_payment_idr"         : round(down_payment),
            "proposed_installment_idr" : round(proposed_installment),
            "rent_vs_mortgage_delta"   : round(rent_vs_mortgage_delta),
            "dp_rate_pct"              : dp_rate * 100,
            "tenor_months"             : BTN_KPR_TENOR_MONTHS,
            "annual_interest_rate_pct" : BTN_KPR_ANNUAL_RATE * 100,
        },
        "recommended_districts": recommended,
    }


def _recommend_districts(max_price: float, home_district: str) -> list:
    """Return up to 4 districts where Type-36 or Type-45 fits the budget."""
    results = []
    for district, data in PROPERTY_PRICES.items():
        t36 = data["avg_type36_price"]
        t45 = data["avg_type45_price"]
        if t36 <= max_price:
            if t45 <= max_price:
                unit_type = "Type 45"
                price_est = t45
            else:
                unit_type = "Type 36"
                price_est = t36
            results.append(
                {
                    "district"           : district,
                    "recommended_unit"   : unit_type,
                    "price_estimate"     : price_est,
                    "price_per_sqm"      : data["price_per_sqm"],
                    "is_home_district"   : district == home_district,
                    "description"        : data["description"],
                }
            )
    # Sort: home district first, then by price ascending
    results.sort(key=lambda x: (not x["is_home_district"], x["price_estimate"]))
    return results[:4]


# ── API Endpoints ──────────────────────────────────────────────────────────────

@app.get("/api/customers", summary="List all synthetic customers")
def list_customers():
    """Returns all customer profiles (without running analysis)."""
    return {
        "total"     : len(CUSTOMERS),
        "customers" : list(CUSTOMERS.values()),
    }


class AnalyzeRequest(BaseModel):
    customer_id: str


@app.post("/api/analyze", summary="Run mortgage scoring for a customer")
def analyze_customer(req: AnalyzeRequest):
    """
    Core endpoint: accepts a customer ID, runs the scoring engine,
    and returns a full affordability analysis.
    """
    customer = CUSTOMERS.get(req.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer '{req.customer_id}' not found")
    try:
        return scoring_engine(customer)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.get("/api/market-data", summary="Return property market prices per district")
def market_data():
    """Returns static property price dictionary for chart rendering."""
    return {
        "source"    : "Synthetic Data — Hyper Mortgage Agentic Tool PoC 2024",
        "currency"  : "IDR",
        "districts" : PROPERTY_PRICES,
    }


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "customers_loaded": len(CUSTOMERS)}


# ── Dev entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
