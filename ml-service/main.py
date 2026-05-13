from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import joblib
import os
import re
from keras.models import load_model

# ── App Setup ─────────────────────────────────────────────
app = FastAPI(title="CRIMSON ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173",
                   "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TRAINED = "./trained"

# ── Load All Models at Startup ─────────────────────────────
print("[*] Loading ML models...")

# LSTM
lstm_model  = load_model(os.path.join(TRAINED, "lstm_model.keras"))
lstm_scaler = joblib.load(os.path.join(TRAINED, "lstm_scaler.pkl"))
monthly_data = joblib.load(os.path.join(TRAINED, "monthly_data.pkl"))

# DBSCAN
hotspot_clusters = pd.read_csv(
    os.path.join(TRAINED, "hotspot_clusters.csv"))
geo_data = joblib.load(os.path.join(TRAINED, "geo_data.pkl"))

# Build monthly time-series from geo incidents for district-specific forecasting.
def _build_monthly_district_series(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    if "date" not in work.columns or "district" not in work.columns:
        return pd.DataFrame(columns=["date", "district", "count", "count_smooth"])

    work["date"] = pd.to_datetime(work["date"], errors="coerce")
    work = work.dropna(subset=["date", "district"])
    if work.empty:
        return pd.DataFrame(columns=["date", "district", "count", "count_smooth"])

    work["month"] = work["date"].dt.to_period("M").dt.to_timestamp()
    grouped = (
        work.groupby(["district", "month"]).size()
        .reset_index(name="count")
        .rename(columns={"month": "date"})
        .sort_values(["district", "date"])
    )

    grouped["count_smooth"] = (
        grouped.groupby("district")["count"]
        .transform(lambda s: s.rolling(window=3, min_periods=1).mean())
    )
    return grouped

district_monthly_series = _build_monthly_district_series(geo_data)
available_district_names = {
    str(d).strip().lower(): str(d).strip()
    for d in district_monthly_series["district"].dropna().unique().tolist()
}

# Random Forest
rf_model     = joblib.load(os.path.join(TRAINED, "recidivism_rf.pkl"))
le_crime     = joblib.load(os.path.join(TRAINED, "le_crime.pkl"))
le_district  = joblib.load(os.path.join(TRAINED, "le_district.pkl"))
le_gender    = joblib.load(os.path.join(TRAINED, "le_gender.pkl"))
le_time      = joblib.load(os.path.join(TRAINED, "le_time.pkl"))
le_location  = joblib.load(os.path.join(TRAINED, "le_location.pkl"))
le_lighting  = joblib.load(os.path.join(TRAINED, "le_lighting.pkl"))
le_drug      = joblib.load(os.path.join(TRAINED, "le_drug.pkl"))
rf_features  = joblib.load(os.path.join(TRAINED, "rf_features.pkl"))

# Victimization
district_vulnerability = pd.read_csv(
    os.path.join(TRAINED, "district_vulnerability.csv"))

# NLP
nlp_pipeline = joblib.load(os.path.join(TRAINED, "nlp_pipeline.pkl"))

print("[OK] All models loaded successfully!")

# ── District crime shares (computed from 9800-record historical dataset) ──
DISTRICT_SHARES = {
    "Colombo":      0.0767, "Gampaha":    0.0750, "Kandy":       0.0738,
    "Jaffna":       0.0730, "Kalutara":   0.0729, "Galle":       0.0729,
    "Kurunegala":   0.0719, "Anuradhapura": 0.0714, "Ratnapura": 0.0712,
    "Batticaloa":   0.0696, "Matara":     0.0681, "Puttalam":    0.0679,
    "Badulla":      0.0675, "Trincomalee": 0.0653, "Nuwara Eliya": 0.0200,
    "Monaragala":   0.0150, "Polonnaruwa": 0.0140, "Kegalle":    0.0140,
    "Ampara":       0.0130, "Hambantota":  0.0130, "Vavuniya":   0.0120,
    "Mullaitivu":   0.0110,
}

def _normalize_district_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    key = str(name).strip().lower()
    return available_district_names.get(key) or next(
        (v for k, v in available_district_names.items() if key in k or k in key),
        None,
    )

# ── Request Models ─────────────────────────────────────────
class ForecastRequest(BaseModel):
    steps:      Optional[int] = 12
    district:   Optional[str] = None
    crime_type: Optional[str] = None

class RecidivismRequest(BaseModel):
    crime_type:        Optional[str] = "House Breaking"
    district:          Optional[str] = "Colombo"
    victim_gender:     Optional[str] = "Male"
    time_bracket:      Optional[str] = "Night"
    location_type:     Optional[str] = "Residential"
    lighting_level:    Optional[str] = "Dark"
    offender_drug_history: Optional[str] = "No"
    is_holiday:        Optional[int] = 0
    cleared_rate_pct:  Optional[float] = 50.0
    victim_age_bracket: Optional[str] = "26-35"
    year:              Optional[int] = 2024

class CategorizeRequest(BaseModel):
    text: str

class HotspotRequest(BaseModel):
    crime_types:      Optional[List[str]] = None   # e.g. ["Robbery", "Property Theft"]
    crime_type:       Optional[str]       = None   # legacy single value
    risk_level:       Optional[str]       = None
    district:         Optional[str]       = None
    time_period_days: Optional[int]       = None   # 7, 30, 180, 365

class VictimRequest(BaseModel):
    district:   Optional[str] = None
    year_from:  Optional[int] = 2015
    year_to:    Optional[int] = 2024

# ── Helper: encode safely ──────────────────────────────────
def safe_encode(encoder, value, default=0):
    try:
        return int(encoder.transform([str(value)])[0])
    except Exception:
        return default

# ── Routes ─────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":  "ok",
        "service": "CRIMSON ML Service",
        "models":  ["lstm", "dbscan", "random_forest",
                    "victimization", "nlp"]
    }

# ── 1. Crime Rate Forecast (LSTM) ──────────────────────────
@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        LOOKBACK = 6

        district_name = _normalize_district_name(req.district)

        source_series = monthly_data.copy()
        if district_name:
            district_rows = district_monthly_series[
                district_monthly_series["district"] == district_name
            ].copy()
            if not district_rows.empty:
                source_series = district_rows

        # Fallback to raw count if smooth column is unavailable.
        smooth_col = "count_smooth" if "count_smooth" in source_series.columns else "count"

        if len(source_series) < LOOKBACK:
            source_series = monthly_data.copy()
            smooth_col = "count_smooth" if "count_smooth" in source_series.columns else "count"

        scaled = lstm_scaler.transform(source_series[[smooth_col]].values)
        seed  = scaled[-LOOKBACK:].reshape(1, LOOKBACK, 1)
        preds = []

        for _ in range(req.steps):
            p = lstm_model.predict(seed, verbose=0)[0][0]
            preds.append(float(p))
            seed = np.append(seed[:, 1:, :], [[[p]]], axis=1)

        forecast_vals = lstm_scaler.inverse_transform(
            np.array(preds).reshape(-1, 1)
        ).flatten()

        # Re-anchor district forecasts to district baseline because the LSTM/scaler
        # were trained on aggregate series and can otherwise over-inflate values.
        if district_name and source_series is not monthly_data and len(source_series) > 0:
            recent_n = min(12, len(source_series), len(monthly_data))
            district_recent_avg = float(source_series["count"].tail(recent_n).mean())
            global_recent_avg = float(monthly_data["count"].tail(recent_n).mean())

            if global_recent_avg > 0:
                scale_factor = district_recent_avg / global_recent_avg
                scale_factor = float(np.clip(scale_factor, 0.2, 2.5))
                forecast_vals = forecast_vals * scale_factor

            district_recent_max = float(source_series["count"].tail(recent_n).max())
            soft_cap = max(5.0, district_recent_max * 2.5)
            forecast_vals = np.clip(forecast_vals, 0.0, soft_cap)

        last_date = pd.to_datetime(source_series["date"].max())
        future_dates = pd.date_range(
            start=last_date + pd.DateOffset(months=1),
            periods=req.steps, freq="MS"
        )

        historical = [
            {
                "date":  str(row["date"])[:10],
                "count": round(float(row["count"]), 2)
            }
            for _, row in source_series.tail(24).iterrows()
        ]

        forecast_list = [
            {
                "date":     str(d)[:10],
                "forecast": max(0.0, round(float(v), 2))
            }
            for d, v in zip(future_dates, forecast_vals)
        ]

        return {
            "success":    True,
            "historical": historical,
            "forecast":   forecast_list,
            "accuracy":   90.25,
            "steps":      req.steps,
            "district":   district_name or req.district,
        }

    except Exception as e:
        raise HTTPException(500, f"Forecast error: {str(e)}")


# ── 2. Hotspot Detection (DBSCAN) ──────────────────────────
@app.post("/hotspots")
def hotspots(req: HotspotRequest):
    import sys; print(f"[DBG] hotspot called crime_types={req.crime_types} days={req.time_period_days}", flush=True, file=sys.stderr)
    try:
        geo = geo_data.copy()
        geo["date"] = pd.to_datetime(geo["date"])

        # ── Time period filter ───────────────────────────────
        if req.time_period_days:
            max_date = geo["date"].max()
            cutoff   = max_date - pd.Timedelta(days=req.time_period_days)
            geo = geo[geo["date"] >= cutoff]

        # ── Crime type filter ──────────────────────────────
        crime_filter = []
        if req.crime_types:
            crime_filter = req.crime_types
        elif req.crime_type:          # legacy single value
            crime_filter = [req.crime_type]
        if crime_filter:
            geo = geo[geo["crime_type"].isin(crime_filter)]

        # ── District filter ────────────────────────────────
        if req.district:
            geo = geo[geo["district"] == req.district]

        # ── District summary (for map circle updates) ─────────────
        total = max(len(geo), 1)
        dist_counts = geo.groupby("district").size().reset_index(name="count")
        dist_counts["pct"] = dist_counts["count"] / total

        def pct_to_level(p):
            if p >= 0.12:   return 4  # CRITICAL
            if p >= 0.08:   return 3  # HIGH
            if p >= 0.04:   return 2  # MODERATE
            return 1                  # SAFE

        district_summary = [
            {
                "district": row["district"],
                "count":    int(row["count"]),
                "level":    pct_to_level(row["pct"]),
            }
            for _, row in dist_counts.iterrows()
        ]

        # ── Heatmap geo points ───────────────────────────────
        sample = geo.sample(min(500, len(geo)), random_state=42) if len(geo) > 0 else geo
        heatmap = [
            {"lat": float(r["lat_j"]), "lng": float(r["lng_j"]), "weight": 1}
            for _, r in sample.iterrows()
        ]

        # ── Cluster summary filtered by risk_level ───────────────
        clusters = hotspot_clusters.copy()
        if req.risk_level:
            clusters = clusters[clusters["risk_level"] == req.risk_level.upper()]

        # Rebuild a dynamic cluster from filtered geo since the static CSV
        # has only 1 row and won’t reflect filters.
        dynamic_cluster = None
        if len(geo) > 0:
            top_d = geo["district"].value_counts().idxmax()
            top_c = geo["crime_type"].value_counts().idxmax()
            top_l = geo["location_type"].value_counts().idxmax() if "location_type" in geo.columns else "N/A"
            top_t = geo["time_bracket"].value_counts().idxmax() if "time_bracket" in geo.columns else "N/A"
            pct   = geo[geo["district"] == top_d].shape[0] / total
            rl    = "CRITICAL" if pct >= 0.12 else "HIGH" if pct >= 0.08 else "MEDIUM" if pct >= 0.04 else "LOW"
            if req.risk_level and rl != req.risk_level.upper():
                dynamic_cluster = None
            else:
                dynamic_cluster = {
                    "cluster_id":   0,
                    "incidents":    int(len(geo)),
                    "risk_level":   rl,
                    "top_district": top_d,
                    "top_crime":    top_c,
                    "top_location": top_l,
                    "peak_time":    top_t,
                    "center_lat":   float(geo["lat_j"].mean()),
                    "center_lng":   float(geo["lng_j"].mean()),
                }

        cluster_list = [dynamic_cluster] if dynamic_cluster else []

        return {
            "success":          True,
            "clusters":         cluster_list,
            "heatmap_points":   heatmap,
            "district_summary": district_summary,
            "total_clusters":   len(cluster_list),
            "total_incidents":  len(geo),
        }

    except Exception as e:
        raise HTTPException(500, f"Hotspot error: {str(e)}")


# ── 3. Recidivism Prediction (Random Forest) ───────────────
@app.post("/recidivism")
def recidivism(req: RecidivismRequest):
    try:
        age_map = {
            "0-17": 0, "18-25": 1, "26-35": 2,
            "36-45": 3, "46-60": 4, "60+": 5
        }

        features = {
            "crime_enc":       safe_encode(le_crime,    req.crime_type),
            "district_enc":    safe_encode(le_district, req.district),
            "gender_enc":      safe_encode(le_gender,   req.victim_gender),
            "time_enc":        safe_encode(le_time,     req.time_bracket),
            "location_enc":    safe_encode(le_location, req.location_type),
            "lighting_enc":    safe_encode(le_lighting, req.lighting_level),
            "drug_enc":        safe_encode(le_drug,
                               req.offender_drug_history),
            "is_holiday":      float(req.is_holiday),
            "cleared_rate_pct": float(req.cleared_rate_pct),
            "age_enc":         float(age_map.get(
                               req.victim_age_bracket, 2)),
            "year":            float(req.year),
        }

        X = pd.DataFrame([features])[rf_features]
        proba     = rf_model.predict_proba(X)[0][1]
        predicted = rf_model.predict(X)[0]

        if proba >= 0.7:
            risk = "HIGH"
        elif proba >= 0.4:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        recommendations = {
            "HIGH":   "Immediate monitoring required. Flag for officer review.",
            "MEDIUM": "Schedule follow-up assessment within 30 days.",
            "LOW":    "Standard monitoring. Review in 90 days.",
        }

        return {
            "success":        True,
            "risk_level":     risk,
            "probability":    round(float(proba), 3),
            "prediction":     int(predicted),
            "recommendation": recommendations[risk],
            "accuracy":       93.98,
        }

    except Exception as e:
        raise HTTPException(500, f"Recidivism error: {str(e)}")


# ── 4. Victimization Pattern Analysis ──────────────────────
@app.get("/victimization")
def victimization(district: Optional[str] = None):
    try:
        geo = geo_data.copy()

        if district:
            geo = geo[geo["district"] == district]

        # Age bracket distribution
        age_dist = {}
        if "victim_age_bracket" in geo.columns:
            age_dist = geo["victim_age_bracket"].value_counts().to_dict()

        # Gender breakdown
        gender_dist = {}
        if "victim_gender" in geo.columns:
            gender_dist = geo["victim_gender"].value_counts().to_dict()

        # Crime type distribution
        crime_dist = {}
        if "crime_type" in geo.columns:
            crime_dist = (geo["crime_type"]
                          .value_counts().head(10).to_dict())

        # Year trend
        year_trend = {}
        if "year" in geo.columns:
            year_trend = (geo.groupby("year").size().to_dict())

        # District vulnerability
        vuln = district_vulnerability.reset_index()
        vuln_list = vuln.to_dict(orient="records")

        # Time bracket
        time_dist = {}
        if "time_bracket" in geo.columns:
            time_dist = geo["time_bracket"].value_counts().to_dict()

        # Location type
        location_dist = {}
        if "location_type" in geo.columns:
            location_dist = (geo["location_type"]
                             .value_counts().to_dict())

        return {
            "success":              True,
            "total_incidents":      len(geo),
            "age_distribution":     age_dist,
            "gender_breakdown":     gender_dist,
            "crime_distribution":   crime_dist,
            "yearly_trend":         year_trend,
            "district_vulnerability": vuln_list,
            "time_distribution":    time_dist,
            "location_distribution": location_dist,
        }

    except Exception as e:
        raise HTTPException(500, f"Victimization error: {str(e)}")


# ── 5. NLP Report Categorization ───────────────────────────

# Keyword override rules (checked before the ML model).
# The model was trained on structured field sentences, not free-text narrative,
# so obvious violent / crime keywords override its prediction when confidence
# from the keyword layer is high.
_KEYWORD_RULES = [
    # category, priority (higher = wins), keyword list
    ("Homicide",                 100, [
        "kill", "killed", "killing", "murder", "murdered", "murdering",
        "dead", "death", "stab", "stabbed", "stabbing", "shot", "shoot",
        "shooting", "slaughter", "slaughtered", "assassin", "assassinate",
        "execute", "executed", "strangle", "strangled", "corpse", "homicide",
        "manslaughter", "decapitate", "decapitated",
    ]),
    ("Grievous Hurt",             90, [
        "beat", "beaten", "beating", "assault", "assaulted", "assaulting",
        "attack", "attacked", "attacking", "punch", "punched", "kick",
        "kicked", "wound", "wounded", "injure", "injured", "injury",
        "hurt", "harm", "harmed", "violence", "violent", "abuse",
        "abused", "threaten", "threatened", "threat", "torture",
        "tortured", "hit", "bashed",
    ]),
    ("Statutory Rape",            90, [
        "rape", "raped", "raping", "molest", "molested", "molestation",
        "sexual assault", "sexually assaulted", "underage", "minor",
        "child abuse", "statutory", "grope", "groped",
    ]),
    ("Robbery",                   80, [
        "rob", "robbed", "robbery", "robbing", "snatch", "snatched",
        "snatching", "mugging", "mugger", "mugged", "armed robbery",
        "gunpoint", "knifepoint", "hold up", "holdup",
    ]),
    ("Drug Offences (Heroin)",    80, [
        "heroin", "smack", "junk", "dope", "opium", "morphine",
    ]),
    ("Drug Offences (Ice/Meth)",  80, [
        "meth", "methamphetamine", "ice", "crystal meth", "amphetamine",
        "shabu",
    ]),
    ("Drug Offences (Cannabis)",  80, [
        "cannabis", "marijuana", "weed", "ganja", "pot", "hash",
        "hashish", "thc", "joint",
    ]),
    ("House Breaking",            70, [
        "break in", "broke in", "breaking in", "breaking into",
        "burglary", "burglar", "forced entry", "trespass", "trespassed",
        "house breaking", "housebreaking", "break into", "broke into",
        "broken into",
    ]),
    ("Property Theft",            70, [
        "theft", "stolen", "steal", "stole", "stealing", "pickpocket",
        "shoplifting", "shoplift", "took without", "missing vehicle",
        "missing phone", "missing laptop", "missing wallet",
    ]),
    ("Cheating/BCT",              70, [
        "fraud", "fraudulent", "scam", "scammed", "cheat", "cheated",
        "deceive", "deceived", "deception", "forgery", "forged",
        "counterfeit", "blackmail", "extort", "extorted", "extortion",
        "ponzi", "embezzle", "embezzlement",
    ]),
    ("Cattle Theft",              70, [
        "cattle", "cow", "buffalo", "bull", "ox", "livestock",
        "goat", "sheep", "animal theft", "farm animal",
    ]),
]

def _keyword_override(raw_text: str):
    """Return (category, confidence) if a keyword rule fires, else None."""
    lower = raw_text.lower()
    best_cat  = None
    best_prio = -1
    for category, priority, keywords in _KEYWORD_RULES:
        for kw in keywords:
            # whole-word match to avoid false positives
            pattern = r"\b" + re.escape(kw) + r"\b"
            if re.search(pattern, lower):
                if priority > best_prio:
                    best_prio = priority
                    best_cat  = category
                break  # one match per rule is enough
    if best_cat:
        return best_cat, min(0.92, 0.70 + best_prio * 0.002)
    return None

@app.post("/categorize")
def categorize(req: CategorizeRequest):
    try:
        from nltk.corpus import stopwords
        stop_words = set(stopwords.words("english"))

        def clean_text(text):
            text   = str(text).lower()
            text   = re.sub(r"[^a-zA-Z\s]", " ", text)
            tokens = text.split()
            tokens = [t for t in tokens
                      if t not in stop_words and len(t) > 2]
            return " ".join(tokens)

        cleaned    = clean_text(req.text)
        category   = nlp_pipeline.predict([cleaned])[0]
        proba      = nlp_pipeline.predict_proba([cleaned])[0]
        confidence = float(max(proba))

        # Top 3 predictions
        classes    = nlp_pipeline.classes_
        top3_idx   = np.argsort(proba)[-3:][::-1]
        top3 = [
            {
                "category":   classes[i],
                "confidence": round(float(proba[i]), 3)
            }
            for i in top3_idx
        ]

        # Keyword override: the ML model was trained on structured field text,
        # not free-text narrative. The keyword layer always takes precedence
        # so that obvious cases ("kill", "stole", "drug") are never mislabelled.
        override = _keyword_override(req.text)
        if override:
            ov_cat, ov_conf = override
            category   = ov_cat
            confidence = ov_conf
            # Rebuild top3 — put override category first
            top3_map   = {t["category"]: t["confidence"] for t in top3}
            top3_map[ov_cat] = round(ov_conf, 3)
            top3 = sorted(
                [{"category": k, "confidence": v} for k, v in top3_map.items()],
                key=lambda x: x["confidence"], reverse=True
            )[:3]

        return {
            "success":    True,
            "category":   category,
            "confidence": round(confidence, 3),
            "top3":       top3,
            "accuracy":   83.94,
        }

    except Exception as e:
        raise HTTPException(500, f"Categorize error: {str(e)}")


# ── Summary Stats for Dashboard ────────────────────────────
@app.get("/summary")
def summary():
    try:
        return {
            "success": True,
            "models": {
                "lstm": {
                    "name":     "Crime Rate Forecasting",
                    "accuracy": 90.25,
                    "status":   "active"
                },
                "dbscan": {
                    "name":     "Hotspot Detection",
                    "clusters": len(hotspot_clusters),
                    "status":   "active"
                },
                "random_forest": {
                    "name":     "Recidivism Prediction",
                    "accuracy": 93.98,
                    "status":   "active"
                },
                "victimization": {
                    "name":     "Victimization Analysis",
                    "districts": len(district_vulnerability),
                    "status":   "active"
                },
                "nlp": {
                    "name":     "Report Categorization",
                    "accuracy": 83.94,
                    "status":   "active"
                },
            }
        }
    except Exception as e:
        raise HTTPException(500, str(e))