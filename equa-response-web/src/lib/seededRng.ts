/**
 * SEEDED RANDOM NUMBER GENERATOR
 * 
 * Provides deterministic pseudo-random numbers for Monte Carlo simulations.
 * Same seed = same sequence (critical for reproducible testing).
 * 
 * Uses Mulberry32 algorithm (fast, high-quality).
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    // Ensure seed is a positive 32-bit integer
    this.state = Math.abs(seed | 0);
    if (this.state === 0) this.state = 1;
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in [min, max]
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate random value with normal distribution (Box-Muller transform)
   * Mean = 0, StdDev = 1 (caller scales to desired range)
   */
  nextGaussian(): number {
    const u1 = this.next();
    const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Apply percentage variability to a value
   * Example: applyVariability(100, 0.2) → 80-120 (±20%)
   */
  applyVariability(value: number, variabilityPct: number): number {
    const multiplier = 1 + this.nextFloat(-variabilityPct, variabilityPct);
    return value * multiplier;
  }

  /**
   * Roll dice with given probability (0-1)
   * Returns true if roll succeeds
   */
  rollDice(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Clone RNG state for branching simulations
   */
  clone(): SeededRNG {
    const cloned = new SeededRNG(this.state);
    return cloned;
  }
}

/**
 * Create RNG from string seed (useful for named scenarios)
 */
export function rngFromString(str: string): SeededRNG {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return new SeededRNG(Math.abs(hash));
}

/**
 * Create RNG from scenario ID + run number
 */
export function rngForRun(scenarioId: string, runNumber: number): SeededRNG {
  return new SeededRNG(
    scenarioId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + runNumber
  );
}
