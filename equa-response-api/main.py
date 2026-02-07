from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import os
import math

app = FastAPI(title="Equa-Response API", version="1.0")

# CORS: Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Data models
# =========================

class Incident(BaseModel):
    id: str
    type: str
    severity: int = Field(..., ge=1, le=10)
    lat: float
    lon: float
    description: str
    verified: bool
    timestamp: str

class Resource(BaseModel):
    id: str
    type: str
    status: str
    lat: float
    lon: float
    capacity: int

class OptimizationRequest(BaseModel):
    incidents: List[Incident]
    resources: List[Resource]
    alpha: float = Field(0.5, ge=0.0, le=1.0)
    depot: List[float] = Field(default=[7.87, 80.77])  # [lat, lon]

# =========================
# Helpers
# =========================

def load_data() -> Dict[str, Any]:
    """
    Opens data/scenarios.json and returns the dict.
    Handles FileNotFoundError cleanly.
    """
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, "data", "scenarios.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="data/scenarios.json not found.")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in scenarios.json: {e}")

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Distance between two coords in km (Haversine).
    """
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return r * c

def calculate_route(incidents: List[Incident], depot: List[float], alpha: float) -> List[List[float]]:
    """
    Sort incidents using dynamic score:
      Score = (Distance_km * (1 - alpha)) - (Severity * alpha * 10)

    Lower score = higher priority.
    Returns path as list of coordinates: [[lat, lon], ...]
    """
    if not incidents:
        return [depot]

    # greedy walk (recalculates distance from current position)
    remaining = incidents.copy()
    current = depot
    path: List[List[float]] = [depot]

    while remaining:
        best_i: Optional[Incident] = None
        best_score = float("inf")

        for inc in remaining:
            dist = haversine_km(current[0], current[1], inc.lat, inc.lon)
            score = (dist * (1 - alpha)) - (inc.severity * alpha * 10)

            if score < best_score:
                best_score = score
                best_i = inc

        if best_i is None:
            break

        path.append([best_i.lat, best_i.lon])
        current = [best_i.lat, best_i.lon]
        remaining.remove(best_i)

    return path

def compute_total_distance(path: List[List[float]]) -> float:
    if len(path) < 2:
        return 0.0
    total = 0.0
    for i in range(1, len(path)):
        total += haversine_km(path[i-1][0], path[i-1][1], path[i][0], path[i][1])
    return total

# =========================
# Endpoints
# =========================

@app.get("/")
def root():
    return {"status": "Equa-Response API Online", "version": "1.0"}

@app.get("/health")
def health():
    data = load_data()
    scenarios = data.get("scenarios", [])
    return {
        "status": "healthy",
        "version": "1.0",
        "data_loaded": True,
        "scenario_count": len(scenarios),
    }

@app.get("/scenarios")
def get_scenarios():
    """
    Return scenario metadata only (lightweight).
    """
    data = load_data()
    scenarios = data.get("scenarios", [])

    meta = []
    for s in scenarios:
        meta.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "description": s.get("description"),
            "center": s.get("center"),
            "zoom": s.get("zoom", 8),
            "incident_count": len(s.get("incidents", [])),
            "resource_count": len(s.get("resources", [])),
        })

    return {"count": len(meta), "scenarios": meta}

@app.get("/scenarios/{scenario_id}")
def get_scenario_details(scenario_id: str):
    data = load_data()
    scenarios = data.get("scenarios", [])

    for s in scenarios:
        if s.get("id") == scenario_id:
            return {"scenario": s}

    raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

@app.post("/optimize")
def optimize(req: OptimizationRequest):
    """
    Returns {"path": [[lat, lon], ...], ...extras}
    """
    depot = req.depot if req.depot and len(req.depot) == 2 else [7.87, 80.77]
    alpha = float(req.alpha)

    path = calculate_route(req.incidents, depot, alpha)
    total_km = compute_total_distance(path)

    # ordered incidents in the same order as path (excluding depot)
    ordered = []
    coords_to_inc = {(inc.lat, inc.lon): inc for inc in req.incidents}
    for p in path[1:]:
        inc = coords_to_inc.get((p[0], p[1]))
        if inc:
            ordered.append(inc)

    return {
        "path": path,
        "ordered_incidents": [i.dict() for i in ordered],
        "total_distance_km": total_km,
        "algorithm": "DynamicScore: (dist*(1-alpha))-(severity*alpha*10)",
        "alpha_used": alpha,
    }
