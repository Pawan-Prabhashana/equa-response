/**
 * SHELTR-SAT: Shelter Satellite Predictive Model
 * Frontend-only mock for predicting shelter occupancy
 */

import type { Shelter } from './api';

// ============================================
// TYPES
// ============================================

export type ShelterPrediction = {
  predicted_occupancy_1h: number;
  predicted_percent_1h: number;
  predicted_status_1h: "OK" | "WARNING" | "FULL";
};

export type ShelterColorInfo = {
  stroke: string;
  fill: string;
  label: "GREEN" | "YELLOW" | "RED" | "FULL";
};

export type PredictionContext = {
  alpha?: number;        // From optimization store (equity vs efficiency)
  incidentLoad?: number; // Number of active incidents
};

// ============================================
// PREDICTION MODEL
// ============================================

/**
 * Predict shelter occupancy in 1 hour using a simple deterministic model
 * 
 * Model Logic:
 * - Base increase = intake_rate_per_min × 60 minutes
 * - Adjust for alpha (equity focus → slower intake as load balances)
 * - Adjust for incident load (more incidents → higher intake)
 * - Clamp to capacity
 */
export function predictOccupancy1h(
  shelter: Shelter,
  context?: PredictionContext
): ShelterPrediction {
  const alpha = context?.alpha ?? 0.5;
  const incidentLoad = context?.incidentLoad ?? 5;
  
  // Base intake rate (people per minute)
  const baseIntakeRate = shelter.intake_rate_per_min ?? 1.0;
  
  // Calculate adjustment factor
  let adjustmentFactor = 1.0;
  
  // Alpha effect: Higher equity focus (α→1) means load balancing
  // reduces intake to already high-occupancy shelters
  const currentPercent = (shelter.current_occupancy / shelter.capacity) * 100;
  if (alpha > 0.5 && currentPercent > 70) {
    // Reduce intake for high-occupancy shelters under equity mode
    const alphaEffect = (alpha - 0.5) * 0.2; // Max 10% reduction at α=1
    adjustmentFactor -= alphaEffect;
  }
  
  // Incident load effect: More active incidents → higher overall intake
  if (incidentLoad > 5) {
    const loadEffect = Math.min((incidentLoad - 5) * 0.02, 0.2); // Max +20%
    adjustmentFactor += loadEffect;
  } else if (incidentLoad < 5) {
    const loadEffect = (5 - incidentLoad) * 0.02; // Reduce if low incident load
    adjustmentFactor -= loadEffect;
  }
  
  // Clamp adjustment to reasonable range
  adjustmentFactor = Math.max(0.7, Math.min(1.3, adjustmentFactor));
  
  // Calculate predicted occupancy
  const baseIncrease = baseIntakeRate * 60; // People per hour
  const adjustedIncrease = baseIncrease * adjustmentFactor;
  const predictedOccupancy = Math.min(
    shelter.current_occupancy + adjustedIncrease,
    shelter.capacity
  );
  
  // Calculate percentage
  const predictedPercent = (predictedOccupancy / shelter.capacity) * 100;
  
  // Determine status
  let predictedStatus: "OK" | "WARNING" | "FULL";
  if (predictedPercent >= 99) {
    predictedStatus = "FULL";
  } else if (predictedPercent >= 80) {
    predictedStatus = "WARNING";
  } else {
    predictedStatus = "OK";
  }
  
  return {
    predicted_occupancy_1h: Math.round(predictedOccupancy),
    predicted_percent_1h: predictedPercent,
    predicted_status_1h: predictedStatus
  };
}

// ============================================
// COLOR CODING
// ============================================

/**
 * Get color coding for shelter based on current occupancy percentage
 * 
 * Thresholds:
 * - Green: < 50%
 * - Yellow: 50-79%
 * - Red: 80-98%
 * - Full: ≥ 99%
 */
export function getShelterColor(percentNow: number): ShelterColorInfo {
  if (percentNow >= 99) {
    return {
      stroke: "#ef4444", // red-500
      fill: "#dc2626",   // red-600
      label: "FULL"
    };
  } else if (percentNow >= 80) {
    return {
      stroke: "#ef4444", // red-500
      fill: "#f87171",   // red-400
      label: "RED"
    };
  } else if (percentNow >= 50) {
    return {
      stroke: "#eab308", // yellow-500
      fill: "#fbbf24",   // yellow-400
      label: "YELLOW"
    };
  } else {
    return {
      stroke: "#22c55e", // green-500
      fill: "#4ade80",   // green-400
      label: "GREEN"
    };
  }
}

/**
 * Get color coding for predicted occupancy
 * (Useful for styling predicted status badges)
 */
export function getPredictedColor(prediction: ShelterPrediction): ShelterColorInfo {
  return getShelterColor(prediction.predicted_percent_1h);
}

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Calculate current occupancy percentage
 */
export function getCurrentPercent(shelter: Shelter): number {
  return (shelter.current_occupancy / shelter.capacity) * 100;
}

/**
 * Check if shelter is at risk (≥80% now or predicted)
 */
export function isShelterAtRisk(
  shelter: Shelter,
  context?: PredictionContext
): boolean {
  const currentPercent = getCurrentPercent(shelter);
  if (currentPercent >= 80) return true;
  
  const prediction = predictOccupancy1h(shelter, context);
  return prediction.predicted_percent_1h >= 80;
}

/**
 * Get suggested action text for a shelter based on predictions
 */
export function getSuggestedAction(
  shelter: Shelter,
  context?: PredictionContext
): string {
  const prediction = predictOccupancy1h(shelter, context);
  
  if (prediction.predicted_status_1h === "FULL") {
    return "🛑 Stop routing here. Redirect to alternative shelters.";
  } else if (prediction.predicted_status_1h === "WARNING") {
    return "⚠️ Redirect intake to nearest low-load shelter.";
  } else if (getCurrentPercent(shelter) < 30) {
    return "✓ Available. Good capacity for intake.";
  } else {
    return "✓ Operating normally. Monitor load.";
  }
}

/**
 * Sort shelters by risk level (highest risk first)
 */
export function sortSheltersByRisk(
  shelters: Shelter[],
  context?: PredictionContext
): Shelter[] {
  return [...shelters].sort((a, b) => {
    const predA = predictOccupancy1h(a, context);
    const predB = predictOccupancy1h(b, context);
    
    // Sort by predicted percentage (descending)
    return predB.predicted_percent_1h - predA.predicted_percent_1h;
  });
}

/**
 * Filter shelters by status
 */
export function filterSheltersByStatus(
  shelters: Shelter[],
  filterType: "ALL" | "AT_RISK" | "FULL" | "OPEN",
  context?: PredictionContext
): Shelter[] {
  switch (filterType) {
    case "ALL":
      return shelters;
    
    case "AT_RISK":
      return shelters.filter(s => {
        const currentPercent = getCurrentPercent(s);
        const prediction = predictOccupancy1h(s, context);
        return currentPercent >= 80 || prediction.predicted_percent_1h >= 80;
      });
    
    case "FULL":
      return shelters.filter(s => {
        const currentPercent = getCurrentPercent(s);
        const status = (s.status || "OPEN").toUpperCase();
        return currentPercent >= 99 || status === "FULL";
      });
    
    case "OPEN":
      return shelters.filter(s => {
        const status = (s.status || "OPEN").toUpperCase();
        return status !== "CLOSED" && status !== "FULL";
      });
    
    default:
      return shelters;
  }
}
