/**
 * Optimization Store - Shared state for logistics and route optimization
 * Uses Zustand for lightweight state management across God-View and Logistics pages
 */

import { create } from 'zustand';
import { optimizeRoute, type Incident, type Resource, type OptimizationResponse, type Shelter, type DigitalTwin } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface RankedIncident extends Incident {
  rank: number;
  priorityScore: number;
  waitProxy: number;
  efficiencyScore: number;
  equityScore: number;
}

export interface OptimizationMetrics {
  efficiencyScore: number;
  equityVariance: number;
  routeDistanceKm?: number;
  deltaDistanceKm?: number;
  deltaEtaMin?: number;
}

interface OptimizationState {
  // Core data
  alpha: number;
  incidents: Incident[];
  resources: Resource[];
  depot: [number, number];
  shelters: Shelter[];
  
  // Ranked output
  rankedIncidents: RankedIncident[];
  
  // Optimization results
  optimizedRoute: OptimizationResponse | null;
  prevOptimizedRoute: OptimizationResponse | null;
  
  // Metrics
  metrics: OptimizationMetrics;
  
  // UI state
  isOptimizing: boolean;
  selectedShelterId: string | null;
  
  // Digital Twin state
  digitalTwin: DigitalTwin | null;
  twinFrameIndex: number;
  
  // Actions
  setAlpha: (alpha: number) => void;
  setScenarioData: (incidents: Incident[], resources: Resource[], depot: [number, number], shelters?: Shelter[]) => void;
  setShelters: (shelters: Shelter[]) => void;
  selectShelter: (id: string | null) => void;
  rankIncidents: () => void;
  runOptimization: () => Promise<void>;
  setDigitalTwin: (dt: DigitalTwin | null) => void;
  setTwinFrameIndex: (index: number) => void;
  reset: () => void;
}

// ============================================
// RANKING ALGORITHM
// ============================================

function calculateWaitProxy(incident: Incident, resources: Resource[]): number {
  if (resources.length === 0) return 60; // Default 60 min if no resources
  
  // Find nearest available resource
  const availableResources = resources.filter(r => r.status === "IDLE");
  if (availableResources.length === 0) return 90; // Longer wait if all busy
  
  // Calculate distance to nearest resource
  const distances = availableResources.map(r => {
    const latDiff = incident.lat - r.lat;
    const lonDiff = incident.lon - r.lon;
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  });
  
  const minDistance = Math.min(...distances);
  
  // Convert distance to wait time proxy (rough estimate: 1 degree ~= 111km, avg speed 40km/h)
  const distanceKm = minDistance * 111;
  const waitMinutes = (distanceKm / 40) * 60;
  
  // Add severity penalty (higher severity = more urgent = less tolerance for wait)
  const severityPenalty = (10 - incident.severity) * 2;
  
  return Math.max(5, waitMinutes + severityPenalty);
}

function normalizeScores(scores: number[]): number[] {
  if (scores.length === 0) return [];
  
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  
  if (range === 0) return scores.map(() => 0.5);
  
  return scores.map(s => (s - min) / range);
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  
  return variance;
}

function rankIncidentsByAlpha(
  incidents: Incident[],
  resources: Resource[],
  alpha: number
): { ranked: RankedIncident[]; metrics: Pick<OptimizationMetrics, 'efficiencyScore' | 'equityVariance'> } {
  if (incidents.length === 0) {
    return {
      ranked: [],
      metrics: { efficiencyScore: 0, equityVariance: 0 }
    };
  }
  
  // Calculate wait proxies for all incidents
  const waitProxies = incidents.map(inc => calculateWaitProxy(inc, resources));
  
  // Calculate efficiency scores (lives/severity per wait time)
  const efficiencyScores = incidents.map((inc, idx) => {
    const lives = inc.severity * 10; // Proxy: higher severity = more people affected
    const wait = waitProxies[idx];
    return lives / (wait + 1);
  });
  
  // Calculate equity scores (higher wait = higher priority under equity)
  const equityScores = [...waitProxies]; // Copy for normalization
  
  // Normalize both score types
  const normalizedEfficiency = normalizeScores(efficiencyScores);
  const normalizedEquity = normalizeScores(equityScores);
  
  // Calculate final priority scores
  const priorityScores = incidents.map((_, idx) => {
    const effScore = normalizedEfficiency[idx];
    const eqScore = normalizedEquity[idx];
    return (1 - alpha) * effScore + alpha * eqScore;
  });
  
  // Create ranked incidents
  const rankedIncidents: RankedIncident[] = incidents.map((inc, idx) => ({
    ...inc,
    rank: 0, // Will be set after sorting
    priorityScore: priorityScores[idx],
    waitProxy: waitProxies[idx],
    efficiencyScore: efficiencyScores[idx],
    equityScore: equityScores[idx]
  }));
  
  // Sort by priority score (descending)
  rankedIncidents.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Assign ranks
  rankedIncidents.forEach((inc, idx) => {
    inc.rank = idx + 1;
  });
  
  // Calculate metrics
  const avgEfficiency = efficiencyScores.reduce((sum, v) => sum + v, 0) / efficiencyScores.length;
  const waitVariance = calculateVariance(waitProxies);
  
  return {
    ranked: rankedIncidents,
    metrics: {
      efficiencyScore: avgEfficiency,
      equityVariance: waitVariance
    }
  };
}

// ============================================
// ZUSTAND STORE
// ============================================

const initialMetrics: OptimizationMetrics = {
  efficiencyScore: 0,
  equityVariance: 0,
  routeDistanceKm: undefined,
  deltaDistanceKm: undefined,
  deltaEtaMin: undefined
};

export const useOptimizationStore = create<OptimizationState>((set, get) => ({
  // Initial state
  alpha: 0.5,
  incidents: [],
  resources: [],
  depot: [7.87, 80.77],
  shelters: [],
  rankedIncidents: [],
  optimizedRoute: null,
  prevOptimizedRoute: null,
  metrics: initialMetrics,
  isOptimizing: false,
  selectedShelterId: null,
  digitalTwin: null,
  twinFrameIndex: 0,
  
  // Set alpha and trigger ranking
  setAlpha: (alpha: number) => {
    set({ alpha });
    get().rankIncidents();
  },
  
  // Set scenario data
  setScenarioData: (incidents: Incident[], resources: Resource[], depot: [number, number], shelters?: Shelter[]) => {
    set({ incidents, resources, depot, shelters: shelters || [] });
    get().rankIncidents();
  },
  
  // Set shelters
  setShelters: (shelters: Shelter[]) => {
    set({ shelters });
  },
  
  // Select shelter
  selectShelter: (id: string | null) => {
    set({ selectedShelterId: id });
  },
  
  // Set digital twin
  setDigitalTwin: (dt: DigitalTwin | null) => {
    set({ digitalTwin: dt, twinFrameIndex: 0 });
  },
  
  // Set twin frame index
  setTwinFrameIndex: (index: number) => {
    set({ twinFrameIndex: index });
  },
  
  // Rank incidents based on current alpha
  rankIncidents: () => {
    const { incidents, resources, alpha } = get();
    
    const { ranked, metrics: rankMetrics } = rankIncidentsByAlpha(incidents, resources, alpha);
    
    set(state => ({
      rankedIncidents: ranked,
      metrics: {
        ...state.metrics,
        efficiencyScore: rankMetrics.efficiencyScore,
        equityVariance: rankMetrics.equityVariance
      }
    }));
  },
  
  // Run route optimization
  runOptimization: async () => {
    const { incidents, resources, alpha, depot, optimizedRoute: currentRoute } = get();
    
    if (incidents.length === 0 || resources.length === 0) {
      console.warn('Cannot optimize: no incidents or resources');
      return;
    }
    
    set({ isOptimizing: true });
    
    try {
      const result = await optimizeRoute({
        incidents,
        resources,
        alpha,
        depot
      });
      
      // Calculate delta metrics if we have a previous route
      let deltaDistanceKm: number | undefined;
      let deltaEtaMin: number | undefined;
      
      if (currentRoute && currentRoute.total_distance_km && result.total_distance_km) {
        deltaDistanceKm = result.total_distance_km - currentRoute.total_distance_km;
        
        // Estimate ETA change (assume 35 km/h average speed)
        const prevEtaMin = (currentRoute.total_distance_km / 35) * 60;
        const newEtaMin = (result.total_distance_km / 35) * 60;
        deltaEtaMin = newEtaMin - prevEtaMin;
      }
      
      set(state => ({
        optimizedRoute: result,
        prevOptimizedRoute: currentRoute,
        metrics: {
          ...state.metrics,
          routeDistanceKm: result.total_distance_km,
          deltaDistanceKm,
          deltaEtaMin
        },
        isOptimizing: false
      }));
      
      // Record to decision ledger (if enabled in system settings)
      try {
        const { useSystemSettings } = await import('./systemSettings');
        const { addLedgerEntry } = useSystemSettings.getState();
        const finalMetrics = get().metrics;
        
        addLedgerEntry({
          scenarioId: 'current_scenario', // Could be enhanced to track actual scenario ID
          alpha,
          efficiencyScore: finalMetrics.efficiencyScore,
          equityVariance: finalMetrics.equityVariance,
          routeDistanceKm: result.total_distance_km || 0,
          deltaDistanceKm: deltaDistanceKm || 0,
          triggeredConstraints: [], // Could be enhanced to track actual constraints
        });
      } catch (ledgerError) {
        console.warn('Failed to record ledger entry:', ledgerError);
      }

      // Propose plan for approval workflow
      try {
        const { useOperationsStore } = await import('./operationsStore');
        const { proposePlan } = useOperationsStore.getState();
        const finalMetrics = get().metrics;
        
        const planPayload = {
          scenarioId: 'current_scenario',
          alpha,
          optimizedRoute: result,
          metrics: {
            efficiencyScore: finalMetrics.efficiencyScore,
            equityVariance: finalMetrics.equityVariance,
            routeDistanceKm: result.total_distance_km || 0
          },
          constraintsTriggered: [] // Could be enhanced to track actual constraints
        };
        
        
        proposePlan(planPayload);
        
        
        // Verify the plan was stored
        const storeState = useOperationsStore.getState();
        if (storeState.proposedPlan) {
        } else {
          console.error('[Logistics → Plan Store] ✗ ERROR: proposedPlan is still null after calling proposePlan!');
        }
      } catch (planError) {
        console.error('[Logistics → Plan Store] FAILED to propose plan:', planError);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      set({ isOptimizing: false });
    }
  },
  
  // Reset state
  reset: () => {
    set({
      alpha: 0.5,
      incidents: [],
      resources: [],
      depot: [7.87, 80.77],
      shelters: [],
      rankedIncidents: [],
      optimizedRoute: null,
      prevOptimizedRoute: null,
      metrics: initialMetrics,
      isOptimizing: false,
      selectedShelterId: null,
      digitalTwin: null,
      twinFrameIndex: 0
    });
  }
}));
