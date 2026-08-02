/**
 * Equa-Response API Client
 * Type-safe API client for communicating with the FastAPI backend
 */

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type IncidentType = "FLOOD" | "LANDSLIDE" | "WIND" | "NEED" | "TOURIST" | "FIRE" | "EARTHQUAKE";
export type ResourceType = "BOAT" | "TRUCK" | "HELICOPTER" | "AMBULANCE" | "RESCUE_TEAM";
export type ResourceStatus = "IDLE" | "BUSY" | "MAINTENANCE" | "OFFLINE";

/**
 * Single disaster incident
 */
export interface Incident {
  id: string;
  type: IncidentType;
  severity: number; // 1-10
  lat: number;
  lon: number;
  description: string;
  verified: boolean;
  timestamp: string;
}

/**
 * Emergency resource (vehicle, personnel, equipment)
 */
export interface Resource {
  id: string;
  type: ResourceType;
  status: ResourceStatus;
  lat: number;
  lon: number;
  capacity: number;
}

/**
 * Blocked/hazardous road segment
 */
export type GhostRoad = {
  id: string;
  hazard: string;
  reason: string;
  coords: Array<[number, number]>;
};

/**
 * Cyclone cone of uncertainty
 */
export type CycloneCone = {
  hours: number;
  polygon: Array<[number, number]>;
  centerline: Array<[number, number]>;
};

/**
 * Flood risk polygon with depth data
 */
export type FloodPolygon = {
  id: string;
  depth_m: number;
  risk: "LOW" | "MODERATE" | "HIGH" | "EXTREME" | string;
  polygon: Array<[number, number]>;
};

/**
 * Emergency shelter with capacity tracking
 */
export type Shelter = {
  id: string;
  name: string;
  location: [number, number]; // [lat, lon]
  capacity: number;
  current_occupancy: number;
  intake_rate_per_min?: number;
  status?: "OPEN" | "FULL" | "CLOSED" | string;
};

/**
 * Digital Twin frame - time-indexed snapshot of scenario state
 */
export type DigitalTwinFrame = {
  t: number;                     // frame index
  label: string;                 // e.g., "T+1h"
  incidents: Incident[];
  ghost_roads?: GhostRoad[];
  flood_polygons?: FloodPolygon[];
  cyclone_cone?: CycloneCone | null;
  shelters?: Shelter[];
};

/**
 * Digital Twin - complete time-series simulation
 */
export type DigitalTwin = {
  start_ts: string;              // ISO timestamp
  step_minutes: number;          // Time between frames
  frames: DigitalTwinFrame[];
};

/**
 * Travel-Guard: Tourist zone definition
 */
export type TouristZone = {
  id: string;
  name: string;
  center: [number, number];
  radius_km: number;
  category: string;
};

/**
 * Travel-Guard: Safe destination for evacuation
 */
export type SafeDestination = {
  id: string;
  name: string;
  location: [number, number];
  type: "CITY" | "AIRPORT" | "INLAND" | string;
};

/**
 * Travel-Guard: Pre-defined safe corridor route
 */
export type GreenCorridor = {
  id: string;
  from_zone_id: string;
  to_dest_id: string;
  avoid: string[];
  path: Array<[number, number]>;
};

/**
 * Travel-Guard: Configuration for tourist safety system
 */
export type TravelGuardConfig = {
  tourist_zones: TouristZone[];
  safe_destinations: SafeDestination[];
  green_corridors: GreenCorridor[];
};

/**
 * Scenario metadata (lightweight, for listing)
 */
export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  center: [number, number]; // [lat, lon]
  zoom: number;
  incident_count: number;
  resource_count: number;
}

/**
 * Complete scenario with all details
 */
export interface ScenarioDetails {
  id: string;
  name: string;
  description: string;
  center: [number, number];
  zoom: number;
  incidents: Incident[];
  resources: Resource[];
  ghost_roads?: GhostRoad[];
  cyclone_cone?: CycloneCone;
  flood_polygons?: FloodPolygon[];
  shelters?: Shelter[];
  digital_twin?: DigitalTwin;
  travel_guard?: TravelGuardConfig;
}

/**
 * Response from /scenarios endpoint
 */
export interface ScenariosListResponse {
  count: number;
  scenarios: ScenarioMetadata[];
}

/**
 * Response from /scenarios/{id} endpoint
 */
export interface ScenarioDetailsResponse {
  scenario: ScenarioDetails;
}

/**
 * Request for /optimize endpoint
 */
export interface OptimizationRequest {
  incidents: Incident[];
  resources: Resource[];
  alpha: number; // 0.0 (efficiency) to 1.0 (equity)
  depot: [number, number]; // [lat, lon] starting point
}

/**
 * Response from /optimize endpoint
 */
export interface OptimizationResponse {
  path: Array<[number, number]>; // Ordered coordinates forming the route
  ordered_incidents: Incident[];
  total_distance_km: number;
  algorithm: string;
  alpha_used: number;
}

/**
 * API health status
 */
export interface HealthResponse {
  status: "healthy" | "degraded" | "offline";
  version: string;
  data_loaded: boolean;
  scenario_count: number;
}

/**
 * Generic API error
 */
export interface ApiError {
  detail: string;
  status?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check API health and connectivity
 */
export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

/**
 * Get list of all available scenarios (metadata only)
 * Lightweight response optimized for scenario selection UI
 * 
 * @returns List of scenario metadata without full incident details
 */
export async function fetchScenarios(): Promise<ScenarioMetadata[]> {
  const response = await apiFetch<ScenariosListResponse>("/scenarios");
  return response.scenarios;
}

/**
 * Get complete details for a specific scenario
 * Includes all incidents and resources
 * 
 * @param id - Scenario identifier (e.g., "kalutara_flood_2017")
 * @returns Full scenario data with incidents and resources
 */
export async function fetchScenarioDetails(id: string): Promise<ScenarioDetails> {
  const response = await apiFetch<ScenarioDetailsResponse>(`/scenarios/${id}`);
  return response.scenario;
}

/**
 * Optimize disaster response route using dynamic scoring algorithm
 * 
 * Balances efficiency (distance) vs equity (severity) based on alpha value:
 * - alpha = 0.0: Pure efficiency (nearest neighbor)
 * - alpha = 1.0: Pure equity (severity-first)
 * - alpha = 0.5: Balanced approach
 * 
 * @param request - Optimization parameters (incidents, resources, alpha, depot)
 * @returns Optimized route path and metrics
 */
export async function optimizeRoute(
  request: OptimizationRequest
): Promise<OptimizationResponse> {
  return apiFetch<OptimizationResponse>("/optimize", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get only incidents from a scenario
 * Convenience function that extracts incidents from full scenario
 * 
 * @param scenarioId - Scenario identifier
 * @returns Array of incidents
 */
export async function fetchScenarioIncidents(scenarioId: string): Promise<Incident[]> {
  const scenario = await fetchScenarioDetails(scenarioId);
  return scenario.incidents;
}

/**
 * Get only resources from a scenario
 * Convenience function that extracts resources from full scenario
 * 
 * @param scenarioId - Scenario identifier
 * @returns Array of resources
 */
export async function fetchScenarioResources(scenarioId: string): Promise<Resource[]> {
  const scenario = await fetchScenarioDetails(scenarioId);
  return scenario.resources;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get color for incident type (for map markers)
 */
export function getIncidentColor(type: IncidentType): string {
  const colors: Record<IncidentType, string> = {
    FLOOD: "#3b82f6", // Blue
    LANDSLIDE: "#f59e0b", // Orange
    WIND: "#ef4444", // Red
    FIRE: "#dc2626", // Dark Red
    EARTHQUAKE: "#8b5cf6", // Purple
    NEED: "#10b981", // Green
    TOURIST: "#ec4899", // Pink
  };
  return colors[type] || "#6b7280"; // Gray fallback
}

/**
 * Get severity level description
 */
export function getSeverityLevel(severity: number): {
  label: string;
  color: string;
} {
  if (severity >= 9) return { label: "CRITICAL", color: "#dc2626" };
  if (severity >= 7) return { label: "HIGH", color: "#f59e0b" };
  if (severity >= 5) return { label: "MEDIUM", color: "#eab308" };
  return { label: "LOW", color: "#10b981" };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  // Handle relative timestamps like "T-0", "T-15m"
  if (timestamp.startsWith("T-")) {
    const time = timestamp.substring(2);
    if (time === "0") return "NOW";
    return `${time} ago`;
  }
  return timestamp;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// EXPORTS
// ============================================

const api = {
  checkHealth,
  fetchScenarios,
  fetchScenarioDetails,
  fetchScenarioIncidents,
  fetchScenarioResources,
  optimizeRoute,
  // Utilities
  getIncidentColor,
  getSeverityLevel,
  formatTimestamp,
  calculateDistance,
};

export default api;
