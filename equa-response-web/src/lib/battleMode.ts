/**
 * Battle Mode - Doctrine Comparison Engine
 * Compare multiple playbooks side-by-side to determine best strategy
 */

import type { 
  Playbook, 
  PlaybookRun, 
  BattleModeComparison,
  BattleModeCriteria,
  PlaybookScores 
} from './playbooks';
import { generatePlaybookRun } from './playbookEngine';
import type { Incident, Shelter } from './api';
import type { Asset } from '@/store/operationsStore';
import type { OperationalState } from './dataPipeline';

/**
 * Run Battle Mode comparison
 * Simulates multiple playbooks and compares their performance
 */
export function runBattleMode(
  playbooks: Playbook[],
  scenarioId: string,
  operationalState: OperationalState,
  incidents: Incident[],
  shelters: Shelter[],
  assets: Asset[],
  criteria: BattleModeCriteria = { metric: 'overall', weight: 'overall' }
): BattleModeComparison {
  
  if (playbooks.length < 2) {
    throw new Error('Battle Mode requires at least 2 playbooks');
  }
  
  if (playbooks.length > 4) {
    throw new Error('Battle Mode supports maximum 4 playbooks');
  }


  // Run simulation for each playbook
  const runs: PlaybookRun[] = [];

  for (const playbook of playbooks) {
    const run = generatePlaybookRun(
      playbook,
      scenarioId,
      operationalState,
      incidents,
      shelters,
      assets,
      [] // No frames for now (simplified)
    );
    runs.push(run);
  }

  // Analyze results
  const scoreboard = runs.map((run, index) => ({
    playbookId: playbooks[index].id,
    playbookName: playbooks[index].name,
    scores: run.scores,
    rank: 0 // Will be calculated below
  }));

  // Determine winner based on criteria
  const metricToUse = criteria.metric;
  scoreboard.sort((a, b) => b.scores[metricToUse] - a.scores[metricToUse]);
  
  // Assign ranks
  scoreboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const winner = scoreboard[0].playbookId;

  // Analyze failure points for each playbook
  const failurePoints: Record<string, string[]> = {};
  
  runs.forEach((run, index) => {
    const playbookId = playbooks[index].id;
    const failures: string[] = [];

    // Check for shelter overload
    const overloadedShelters = run.predictedShelterLoads.filter(s => s.capacityPercent >= 95);
    if (overloadedShelters.length > 0) {
      failures.push(
        `Shelter overload: ${overloadedShelters.length} shelter(s) at ≥95% capacity`
      );
      overloadedShelters.forEach(s => {
        failures.push(`  → ${s.shelterName}: ${s.capacityPercent.toFixed(0)}% at T+2h`);
      });
    }

    // Check for infeasible missions
    const infeasibleMissions = run.generatedMissions.filter(
      m => m.rationale.toLowerCase().includes('infeasible') || 
           m.rationale.toLowerCase().includes('blocked')
    );
    if (infeasibleMissions.length > 0) {
      failures.push(
        `Infeasible missions: ${infeasibleMissions.length} mission(s) cannot be executed`
      );
      infeasibleMissions.forEach(m => {
        failures.push(`  → ${m.title}: ${m.rationale.substring(0, 60)}...`);
      });
    }

    // Check low scores
    if (run.scores.equity < 70) {
      failures.push(`Low equity score: ${run.scores.equity.toFixed(0)}/100 (unfair response distribution)`);
    }
    if (run.scores.efficiency < 70) {
      failures.push(`Low efficiency: ${run.scores.efficiency.toFixed(0)}/100 (slow response to critical incidents)`);
    }
    if (run.scores.overloadAvoidance < 70) {
      failures.push(`Poor overload avoidance: ${run.scores.overloadAvoidance.toFixed(0)}/100 (shelters at risk)`);
    }
    if (run.scores.travelSafety < 70) {
      failures.push(`Safety concerns: ${run.scores.travelSafety.toFixed(0)}/100 (routes through hazard zones)`);
    }
    if (run.scores.executionFeasibility < 70) {
      failures.push(`Execution issues: ${run.scores.executionFeasibility.toFixed(0)}/100 (resource/logistics problems)`);
    }

    // If no failures, mark as optimal
    if (failures.length === 0) {
      failures.push('✓ No critical issues detected');
    }

    failurePoints[playbookId] = failures;
  });

  // Analyze resource usage
  const resourceUsage: Record<string, {
    assetsDeployed: number;
    assetsStandby: number;
    totalAssets: number;
    utilizationPercent: number;
  }> = {};

  runs.forEach((run, index) => {
    const playbookId = playbooks[index].id;
    
    // Count unique assets used across all missions
    const usedAssetIds = new Set<string>();
    run.generatedMissions.forEach(mission => {
      mission.incidentIds.forEach(id => usedAssetIds.add(id));
    });

    const assetsDeployed = usedAssetIds.size;
    const totalAssets = assets.length;
    const assetsStandby = totalAssets - assetsDeployed;
    const utilizationPercent = totalAssets > 0 ? (assetsDeployed / totalAssets) * 100 : 0;

    resourceUsage[playbookId] = {
      assetsDeployed,
      assetsStandby,
      totalAssets,
      utilizationPercent
    };
  });

  return {
    playbooks,
    runs,
    winner,
    scoreboard,
    failurePoints,
    resourceUsage
  };
}

/**
 * Promote a playbook to ACTIVE status
 * (Typically called after Battle Mode identifies a winner)
 */
export function promoteToActive(playbook: Playbook, approvedBy: string): Playbook {
  const now = Date.now();
  
  return {
    ...playbook,
    status: 'ACTIVE',
    approvedBy,
    approvedAt: now,
    updatedAt: now,
    versionHistory: [
      ...playbook.versionHistory,
      {
        version: playbook.version,
        createdAt: now,
        createdBy: approvedBy,
        changelog: ['Promoted to ACTIVE after Battle Mode victory']
      }
    ]
  };
}

/**
 * Compare two specific playbooks (A/B test)
 */
export function compareTwo(
  playbookA: Playbook,
  playbookB: Playbook,
  scenarioId: string,
  operationalState: OperationalState,
  incidents: Incident[],
  shelters: Shelter[],
  assets: Asset[]
): {
  winner: 'A' | 'B' | 'TIE';
  scoreDifference: number;
  strongerIn: string[]; // Metrics where winner excels
  weakerIn: string[]; // Metrics where winner lags
} {
  const comparison = runBattleMode(
    [playbookA, playbookB],
    scenarioId,
    operationalState,
    incidents,
    shelters,
    assets
  );

  const scoreA = comparison.runs[0].scores.overall;
  const scoreB = comparison.runs[1].scores.overall;
  const difference = Math.abs(scoreA - scoreB);

  // Determine winner
  let winner: 'A' | 'B' | 'TIE';
  if (difference < 5) {
    winner = 'TIE'; // Less than 5 point difference = tie
  } else {
    winner = scoreA > scoreB ? 'A' : 'B';
  }

  // Analyze strengths and weaknesses
  const scoresA = comparison.runs[0].scores;
  const scoresB = comparison.runs[1].scores;
  const strongerIn: string[] = [];
  const weakerIn: string[] = [];

  const metrics: Array<keyof PlaybookScores> = [
    'equity', 'efficiency', 'overloadAvoidance', 'travelSafety', 'executionFeasibility'
  ];

  metrics.forEach(metric => {
    const diffMetric = scoresA[metric] - scoresB[metric];
    if (winner === 'A') {
      if (diffMetric > 10) strongerIn.push(metric);
      if (diffMetric < -10) weakerIn.push(metric);
    } else if (winner === 'B') {
      if (diffMetric < -10) strongerIn.push(metric);
      if (diffMetric > 10) weakerIn.push(metric);
    }
  });

  return {
    winner,
    scoreDifference: difference,
    strongerIn,
    weakerIn
  };
}
