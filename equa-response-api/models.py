"""
Pydantic Data Models for Equa-Response API
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class Location(BaseModel):
    """Geographic coordinates"""
    lat: float
    lon: float


class Incident(BaseModel):
    """Single incident/disaster event"""
    id: str
    type: str
    severity: int = Field(..., ge=1, le=10, description="Severity from 1-10")
    lat: float
    lon: float
    description: str
    verified: bool
    timestamp: str


class Resource(BaseModel):
    """Rescue resource (boat, truck, etc.)"""
    id: str
    type: str
    status: str
    lat: float
    lon: float
    capacity: int


class OptimizationRequest(BaseModel):
    """
    Request model for optimization endpoint
    
    The alpha slider controls the optimization strategy:
    - alpha = 0.0 (Efficiency): Prioritize nearest incidents first
    - alpha = 1.0 (Equity): Prioritize highest severity incidents first
    - alpha = 0.5 (Balanced): Mix of both strategies
    """
    incidents: List[Incident]
    resources: List[Resource]
    alpha: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0, 
        description="Optimization weight: 0=efficiency (distance), 1=equity (severity)"
    )
    depot: List[float] = Field(
        default=[7.8731, 80.7718],  # Default to Sri Lanka center
        description="Starting point [lat, lon] for route calculation"
    )


class OptimizationResponse(BaseModel):
    """Response model for optimization endpoint"""
    path: List[List[float]] = Field(
        description="Ordered list of coordinates [[lat, lon], ...] forming optimized route"
    )
    ordered_incidents: List[Incident] = Field(
        description="Incidents in optimized visit order"
    )
    total_distance_km: float = Field(
        description="Total route distance in kilometers"
    )
    algorithm: str = Field(
        description="Algorithm used for optimization"
    )
    alpha_used: float = Field(
        description="Alpha value used (0=efficiency, 1=equity)"
    )


class ScenarioMetadata(BaseModel):
    """Lightweight scenario info for list view"""
    id: str
    name: str
    description: str
    center: List[float]
    zoom: int
    incident_count: int
    resource_count: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    data_loaded: bool
    scenario_count: int
