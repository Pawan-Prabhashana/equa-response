/**
 * MONTE CARLO ROBUSTNESS ENGINE
 * 
 * Tests playbook performance under uncertainty.
 * Runs 30 lightweight randomized simulations with varying:
 * - Flood depths (±X%)
 * - Road failures (X% probability)
 * - Shelter intake (±X%)
 * - Sensor confidence (degrades by X%)
 * 
 * Outputs:
 * - Success rate (% runs with acceptable performance)
 * - Worst/best/average scores
 * - Confidence grade (A/B/C/D/F)
 * - Score distributions
 */

import type { Playbook, PlaybookScores } from './playbooks';
import { generatePlaybookRun } from './playbookEngine';
import type { Incident, Shelter } from './api';
import type { Asset } from '@/store/operationsStore';
import type { OperationalState } from './dataPipeline';
import { SeededRNG, rngForRun } from './seededRng';

// ============================================================================
// TYPES
// ============================================================================

export interface UncertaintyParams {
  floodDepthVariabilityPct: number;     // ±0-30% (e.g., 0.15 = ±15%)
  roadFailureProbabilityPct: number;    // 0-30% (e.g., 0.10 = 10% chance)
  shelterIntakeVariabilityPct: number;  // ±0-30% (e.g., 0.20 = ±20%)
  sensorConfidenceDegradePct: number;   // 0-30% (e.g., 0.15 = 15% worse)
}

export interface MonteCarloRun {
  runNumber: number;
  seed: number;
  scores: PlaybookScores;
  success: boolean; // True if scores meet minimum thresholds
  failureReason?: string;
}

export interface MonteCarloResult {
  playbook: Playbook;
  uncertaintyParams: UncertaintyParams;
  runs: MonteCarloRun[];
  
  // Aggregated statistics
  successRate: number; // 0-1 (percentage of successful runs)
  worstCase: PlaybookScores;
  bestCase: PlaybookScores;
  averageCase: PlaybookScores;
  confidenceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // Score distributions (for charts)
  distributions: {
    equity: number[];
    efficiency: number[];
    overloadAvoidance: number[];
    travelSafety: number[];
    executionFeasibility: number[];
    overall: number[];
  };
}

// ============================================================================
// MONTE CARLO ENGINE
// ============================================================================

/**
 * Run Monte Carlo robustness test on a single playbook
 */
export function runMonteCarloTest(
  playbook: Playbook,
  scenarioId: string,
  baseOperationalState: OperationalState,
  baseIncidents: Incident[],
  baseShelters: Shelter[],
  baseAssets: Asset[],
  uncertaintyParams: UncertaintyParams,
  numRuns: number = 30
): MonteCarloResult {
  
  const runs: MonteCarloRun[] = [];
  
  // Run simulations with varying conditions
  for (let i = 0; i < numRuns; i++) {
    const rng = rngForRun(scenarioId + playbook.id, i);
    
    // Apply uncertainty to input data
    const perturbedState = applyUncertainty(
      baseOperationalState,
      baseIncidents,
      baseShelters,
      baseAssets,
      uncertaintyParams,
      rng
    );
    
    // Run playbook simulation with perturbed data
    const playbookRun = generatePlaybookRun(
      playbook,
      scenarioId,
      perturbedState.operationalState,
      perturbedState.incidents,
      perturbedState.shelters,
      perturbedState.assets,
      perturbedState.operationalState.ghostRoads
    );
    
    // Evaluate success
    const success = evaluateSuccess(playbookRun.scores);
    const failureReason = success ? undefined : identifyFailureReason(playbookRun.scores);
    
    runs.push({
      runNumber: i + 1,
      seed: rng.nextInt(0, 999999),
      scores: playbookRun.scores,
      success,
      failureReason
    });
  }
  
  // Compute aggregated statistics
  const successRate = runs.filter(r => r.success).length / numRuns;
  
  const worstCase = computeWorstCase(runs);
  const bestCase = computeBestCase(runs);
  const averageCase = computeAverageCase(runs);
  
  const confidenceGrade = computeConfidenceGrade(successRate, worstCase);
  
  const distributions = computeDistributions(runs);
  
  
  return {
    playbook,
    uncertaintyParams,
    runs,
    successRate,
    worstCase,
    bestCase,
    averageCase,
    confidenceGrade,
    distributions
  };
}

// ============================================================================
// UNCERTAINTY APPLICATION
// ============================================================================

interface PerturbedData {
  operationalState: OperationalState;
  incidents: Incident[];
  shelters: Shelter[];
  assets: Asset[];
}

function applyUncertainty(
  baseState: OperationalState,
  baseIncidents: Incident[],
  baseShelters: Shelter[],
  baseAssets: Asset[],
  params: UncertaintyParams,
  rng: SeededRNG
): PerturbedData {
  // Clone data to avoid mutations
  const state = JSON.parse(JSON.stringify(baseState)) as OperationalState;
  const incidents = JSON.parse(JSON.stringify(baseIncidents)) as Incident[];
  const shelters = JSON.parse(JSON.stringify(baseShelters)) as Shelter[];
  const assets = JSON.parse(JSON.stringify(baseAssets)) as Asset[];
  
  // 1. Perturb flood depths
  if (state.floodPolygons && params.floodDepthVariabilityPct > 0) {
    state.floodPolygons.forEach((flood) => {
      flood.depth_m = rng.applyVariability(flood.depth_m, params.floodDepthVariabilityPct);
    });
  }
  
  // 2. Randomly fail roads (ghost roads increase)
  if (state.ghostRoads && params.roadFailureProbabilityPct > 0) {
    // Add random road failures (simplified - in production, would check road network)
    const numNewFailures = Math.floor(rng.next() * 3); // 0-2 new failures
    for (let i = 0; i < numNewFailures; i++) {
      if (rng.rollDice(params.roadFailureProbabilityPct)) {
        state.ghostRoads.push({
          id: `ghost_mc_${i}`,
          hazard: 'FLOOD',
          reason: 'Monte Carlo simulated failure',
          coords: [[6.5 + rng.nextFloat(-0.1, 0.1), 80.0 + rng.nextFloat(-0.1, 0.1)], 
                   [6.5 + rng.nextFloat(-0.1, 0.1), 80.0 + rng.nextFloat(-0.1, 0.1)]]
        });
      }
    }
  }
  
  // 3. Perturb shelter capacity/intake (more aggressive)
  if (params.shelterIntakeVariabilityPct > 0) {
    shelters.forEach(shelter => {
      // Vary capacity more aggressively
      const capacityMultiplier = 1 + rng.nextFloat(
        -params.shelterIntakeVariabilityPct * 1.5,
        params.shelterIntakeVariabilityPct * 1.5
      );
      shelter.capacity = Math.max(10, Math.floor(shelter.capacity * capacityMultiplier));
      
      // Vary occupancy even more (simulates people arriving faster/slower)
      const occupancyMultiplier = 1 + rng.nextFloat(
        -params.shelterIntakeVariabilityPct * 2,
        params.shelterIntakeVariabilityPct * 2
      );
      shelter.current_occupancy = Math.max(0, Math.min(
        shelter.capacity,
        Math.floor(shelter.current_occupancy * occupancyMultiplier)
      ));
    });
  }
  
  // 4. Degrade sensor confidence (affects incident severity perception)
  if (params.sensorConfidenceDegradePct > 0) {
    incidents.forEach(incident => {
      // Reduce perceived severity (simulates sensor noise)
      const degradation = rng.nextFloat(0, params.sensorConfidenceDegradePct * 20); // More aggressive
      incident.severity = Math.max(1, Math.min(10, incident.severity - degradation));
    });
  }
  
  // 5. Randomly affect asset availability
  if (params.roadFailureProbabilityPct > 0) {
    assets.forEach(asset => {
      // Randomly change asset status based on road failure probability
      if (rng.rollDice(params.roadFailureProbabilityPct * 0.5)) {
        if (asset.status === 'READY') {
          asset.status = 'DEPLOYED'; // Asset becomes unavailable
        }
      }
    });
  }
  
  // 6. Add random new incidents (simulates evolving situation)
  if (params.floodDepthVariabilityPct > 0.1 && rng.rollDice(0.3)) {
    const numNewIncidents = rng.nextInt(0, 2);
    for (let i = 0; i < numNewIncidents; i++) {
      incidents.push({
        id: `mc_incident_${Date.now()}_${i}`,
        type: 'FLOOD',
        severity: rng.nextFloat(5, 9),
        lat: 6.5 + rng.nextFloat(-0.3, 0.3),
        lon: 80.0 + rng.nextFloat(-0.3, 0.3),
        description: 'Monte Carlo simulated incident',
        verified: true,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return { operationalState: state, incidents, shelters, assets };
}

// ============================================================================
// SUCCESS EVALUATION
// ============================================================================

/**
 * Determine if a run is "successful"
 * Criteria:
 * - Shelter load < 95%
 * - Missions feasible >= 80%
 * - Overall score >= 60
 */
function evaluateSuccess(scores: PlaybookScores): boolean {
  return (
    scores.overloadAvoidance >= 80 && // Shelter load OK
    scores.executionFeasibility >= 80 && // Missions feasible
    scores.overall >= 60 // Minimum acceptable score
  );
}

function identifyFailureReason(scores: PlaybookScores): string {
  if (scores.overloadAvoidance < 80) {
    return `Shelter overload (${scores.overloadAvoidance.toFixed(0)}/100)`;
  }
  if (scores.executionFeasibility < 80) {
    return `Infeasible missions (${scores.executionFeasibility.toFixed(0)}/100)`;
  }
  if (scores.overall < 60) {
    return `Low overall score (${scores.overall.toFixed(0)}/100)`;
  }
  return 'Unknown failure';
}

// ============================================================================
// STATISTICS COMPUTATION
// ============================================================================

function computeWorstCase(runs: MonteCarloRun[]): PlaybookScores {
  return {
    equity: Math.min(...runs.map(r => r.scores.equity)),
    efficiency: Math.min(...runs.map(r => r.scores.efficiency)),
    overloadAvoidance: Math.min(...runs.map(r => r.scores.overloadAvoidance)),
    travelSafety: Math.min(...runs.map(r => r.scores.travelSafety)),
    executionFeasibility: Math.min(...runs.map(r => r.scores.executionFeasibility)),
    overall: Math.min(...runs.map(r => r.scores.overall))
  };
}

function computeBestCase(runs: MonteCarloRun[]): PlaybookScores {
  return {
    equity: Math.max(...runs.map(r => r.scores.equity)),
    efficiency: Math.max(...runs.map(r => r.scores.efficiency)),
    overloadAvoidance: Math.max(...runs.map(r => r.scores.overloadAvoidance)),
    travelSafety: Math.max(...runs.map(r => r.scores.travelSafety)),
    executionFeasibility: Math.max(...runs.map(r => r.scores.executionFeasibility)),
    overall: Math.max(...runs.map(r => r.scores.overall))
  };
}

function computeAverageCase(runs: MonteCarloRun[]): PlaybookScores {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    equity: avg(runs.map(r => r.scores.equity)),
    efficiency: avg(runs.map(r => r.scores.efficiency)),
    overloadAvoidance: avg(runs.map(r => r.scores.overloadAvoidance)),
    travelSafety: avg(runs.map(r => r.scores.travelSafety)),
    executionFeasibility: avg(runs.map(r => r.scores.executionFeasibility)),
    overall: avg(runs.map(r => r.scores.overall))
  };
}

function computeConfidenceGrade(
  successRate: number,
  worstCase: PlaybookScores
): 'A' | 'B' | 'C' | 'D' | 'F' {
  // Grade based on success rate AND worst-case resilience
  if (successRate >= 0.95 && worstCase.overall >= 70) return 'A'; // Excellent resilience
  if (successRate >= 0.85 && worstCase.overall >= 60) return 'B'; // Good resilience
  if (successRate >= 0.70 && worstCase.overall >= 50) return 'C'; // Acceptable resilience
  if (successRate >= 0.50 && worstCase.overall >= 40) return 'D'; // Weak resilience
  return 'F'; // Fails under uncertainty
}

function computeDistributions(runs: MonteCarloRun[]): MonteCarloResult['distributions'] {
  return {
    equity: runs.map(r => r.scores.equity),
    efficiency: runs.map(r => r.scores.efficiency),
    overloadAvoidance: runs.map(r => r.scores.overloadAvoidance),
    travelSafety: runs.map(r => r.scores.travelSafety),
    executionFeasibility: runs.map(r => r.scores.executionFeasibility),
    overall: runs.map(r => r.scores.overall)
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compute variance of a score distribution (for confidence intervals)
 */
export function computeVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Compute standard deviation
 */
export function computeStdDev(values: number[]): number {
  return Math.sqrt(computeVariance(values));
}

/**
 * Get percentile value (e.g., 10th percentile = worst 10%)
 */
export function getPercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sorted.length);
  return sorted[index];
}
