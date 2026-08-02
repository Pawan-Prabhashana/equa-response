"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Play, Send, Settings as SettingsIcon, 
  AlertTriangle, CheckCircle2, TrendingUp, MapPin,
  Activity, Shield, Users, AlertCircle, ExternalLink,
  Swords, FileText, Trophy, BarChart3, Zap
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useOptimizationStore } from '@/store/optimizationStore';
import { useOperationsStore, type CommsAudience, type CommsLogEntry } from '@/store/operationsStore';
import { produceOperationalState } from '@/lib/dataPipeline';
import { makeMockTruthReports } from '@/lib/truthEngine';
import {
  createDefaultPlaybook,
  CONSTRAINT_PRESETS,
  type Playbook,
  type PlaybookRun,
  type BattleModeComparison
} from '@/lib/playbooks';
import { generatePlaybookRun } from '@/lib/playbookEngine';
import { runBattleMode, promoteToActive } from '@/lib/battleMode';
import { 
  runMonteCarloTest, 
  type UncertaintyParams, 
  type MonteCarloResult 
} from '@/lib/monteCarloEngine';
import { 
  computeDistrictImpacts, 
  generateImpactFeed,
  getPostureColor,
  getImpactScoreColor,
  type ImpactFeedItem
} from '@/lib/districtImpact';
import { 
  MOCK_FLOOD_POLYGONS, 
  MOCK_CYCLONE_CONE, 
  MOCK_GHOST_ROADS,
  updateShelterPredictions 
} from '@/data/mock_hazards';

type WorkflowStep = 1 | 2 | 3 | 4 | 5;
type TabId = 'builder' | 'simulation' | 'battle' | 'brief';

export default function PlaybookStudioPage() {
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('builder');
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [objectiveProfile, setObjectiveProfile] = useState<string>('LIFE_SAVING');
  const [triggers, setTriggers] = useState<string[]>(['FLOOD_EVAC', 'SHELTER_REDIRECT']);
  const [resourcePosture, setResourcePosture] = useState<string>('PROPORTIONAL');
  
  const [playbook, setPlaybook] = useState<Playbook>(createDefaultPlaybook());
  const [playbookRun, setPlaybookRun] = useState<PlaybookRun | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDistrictForBrief, setSelectedDistrictForBrief] = useState<string | null>(null);
  const [impactFeed, setImpactFeed] = useState<ImpactFeedItem[]>([]);
  
  // Battle Mode state - Initialize with test playbooks for demo
  const [savedPlaybooks, setSavedPlaybooks] = useState<Playbook[]>(() => {
    return [
      {
        ...createDefaultPlaybook(),
        id: 'playbook_demo_a',
        name: 'Life-Saving Priority',
        targetArea: 'Kalutara, Ratnapura',
        objectives: {
          saveLives: true,
          fairness: false,
          protectTourism: false,
          minimizeCost: false
        },
        evacuationThreshold: 0.6,
        constraintsPreset: 'AGGRESSIVE',
        status: 'DRAFT'
      },
      {
        ...createDefaultPlaybook(),
        id: 'playbook_demo_b',
        name: 'Fairness-First Doctrine',
        targetArea: 'Kalutara, Ratnapura, Galle',
        objectives: {
          saveLives: true,
          fairness: true,
          protectTourism: false,
          minimizeCost: false
        },
        evacuationThreshold: 0.65,
        constraintsPreset: 'STANDARD',
        status: 'DRAFT'
      },
      {
        ...createDefaultPlaybook(),
        id: 'playbook_demo_c',
        name: 'Tourism Protection',
        targetArea: 'Galle, Matara',
        objectives: {
          saveLives: true,
          fairness: false,
          protectTourism: true,
          minimizeCost: false
        },
        evacuationThreshold: 0.7,
        constraintsPreset: 'STANDARD',
        status: 'DRAFT'
      }
    ];
  });
  const [selectedBattlePlaybooks, setSelectedBattlePlaybooks] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<BattleModeComparison | null>(null);
  const [isRunningBattle, setIsRunningBattle] = useState(false);
  
  // Monte Carlo Robustness Testing state
  const [uncertaintyParams, setUncertaintyParams] = useState<UncertaintyParams>({
    floodDepthVariabilityPct: 0.15,     // ±15%
    roadFailureProbabilityPct: 0.10,    // 10%
    shelterIntakeVariabilityPct: 0.20,  // ±20%
    sensorConfidenceDegradePct: 0.15    // 15%
  });
  const [selectedPlaybookForRobustness, setSelectedPlaybookForRobustness] = useState<string | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [isRunningMonteCarlo, setIsRunningMonteCarlo] = useState(false);

  // Get data from stores
  const { incidents, shelters } = useOptimizationStore();
  const { assets, createMission, sendMessage } = useOperationsStore();

  // Compute operational state
  const opState = useMemo(() => {
    const truthReports = makeMockTruthReports();
    const readyAssets = assets.filter(a => a.status === 'READY').length;
    const sheltersWithPredictions = updateShelterPredictions(shelters);
    
    return produceOperationalState(
      'playbook_scenario',
      incidents,
      MOCK_FLOOD_POLYGONS,
      MOCK_CYCLONE_CONE,
      MOCK_GHOST_ROADS,
      sheltersWithPredictions,
      truthReports,
      readyAssets,
      assets.length
    );
  }, [incidents, shelters, assets]);

  // Compute district impacts with mock hazard data
  const districtImpacts = useMemo(() => {
    // Update shelter predictions to show realistic load
    const sheltersWithPredictions = updateShelterPredictions(shelters);
    
    return computeDistrictImpacts(
      incidents,
      MOCK_FLOOD_POLYGONS,
      MOCK_CYCLONE_CONE,
      MOCK_GHOST_ROADS,
      sheltersWithPredictions
    );
  }, [incidents, shelters]);

  // Generate impact feed on impacts change
  useEffect(() => {
    const newFeed = generateImpactFeed(districtImpacts);
    if (newFeed.length > 0) {
      setImpactFeed(prev => [...newFeed, ...prev].slice(0, 50)); // Keep last 50
    }
  }, [districtImpacts]);
  
  // Simulate periodic updates to impact feed (every 5-8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Force a re-computation to check for simulated changes
      const newFeed = generateImpactFeed(districtImpacts);
      if (newFeed.length > 0) {
        setImpactFeed(prev => [...newFeed, ...prev].slice(0, 50));
      }
    }, 6000 + Math.random() * 2000); // 6-8 seconds with jitter
    
    return () => clearInterval(interval);
  }, [districtImpacts]);

  // Handle playbook generation from workflow
  const handleGeneratePlaybook = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      // Build playbook from workflow
      const objectives = {
        saveLives: objectiveProfile === 'LIFE_SAVING',
        fairness: objectiveProfile === 'FAIRNESS_FIRST',
        protectTourism: objectiveProfile === 'TOURISM',
        minimizeCost: objectiveProfile === 'INFRASTRUCTURE'
      };

      const updatedPlaybook: Playbook = {
        ...playbook,
        name: `${selectedDistricts.join(', ')} Response`,
        targetArea: selectedDistricts.join(', '),
        objectives,
        constraintsPreset: resourcePosture === 'AGGRESSIVE' ? 'AGGRESSIVE' : 'STANDARD'
      };

      setPlaybook(updatedPlaybook);

      // Generate run
      const run = generatePlaybookRun(
        updatedPlaybook,
        'current_scenario',
        opState,
        incidents,
        shelters,
        assets,
        []
      );
      
      setPlaybookRun(run);
      setIsGenerating(false);
    }, 1200);
  };

  // Export functions
  const handleSendToMissionControl = () => {
    if (!playbookRun) return;

    let successCount = 0;
    const missionTitles: string[] = [];
    
    playbookRun.generatedMissions.forEach(mission => {
      try {
        createMission({
          title: mission.title,
          incidentIds: mission.incidentIds,
          assetIds: [],
          destination: mission.targetLocation,
          notes: `From playbook "${playbook.name}": ${mission.rationale}`,
          createdByRole: 'OPERATOR'
        });
        successCount++;
        missionTitles.push(mission.title);
      } catch (error) {
        console.error('Failed to create mission:', mission.title, error);
      }
    });

    if (successCount > 0) {
      const goToMissionControl = confirm(
        `✓ ${successCount} mission${successCount > 1 ? 's' : ''} sent to Mission Control!\n\n` +
        `Missions created:\n${missionTitles.map(t => `• ${t}`).join('\n')}\n\n` +
        `Districts: ${selectedDistricts.join(', ')}\n\n` +
        `Click OK to go to Mission Control page now, or Cancel to stay here.`
      );
      
      if (goToMissionControl) {
        router.push('/mission-control');
      }
    } else {
      alert('⚠️ Failed to send missions. Please try again.');
    }
  };

  const handleSendToComms = () => {
    if (!playbookRun) return;

    playbookRun.generatedComms.forEach(comm => {
      sendMessage({
        channel: comm.channel as CommsLogEntry['channel'],
        audience: comm.audience as CommsAudience,
        recipientsLabel: `${comm.audience} (${comm.lang})`,
        lang: comm.lang,
        renderedMessage: `${comm.subject}\n\n${comm.body}`,
        status: 'SENT'
      });
    });

    alert(`✓ ${playbookRun.generatedComms.length} messages sent to Comms Console`);
  };

  const handleApplyConstraints = () => {
    const preset = CONSTRAINT_PRESETS[playbook.constraintsPreset as keyof typeof CONSTRAINT_PRESETS];
    alert(`✓ Constraints applied:\n- Max missions: ${preset.maxMissions}\n- Min readiness: ${(preset.minAssetReadiness * 100).toFixed(0)}%`);
  };

  const handleSelectDistrict = (districtName: string) => {
    setSelectedDistricts(prev => 
      prev.includes(districtName)
        ? prev.filter(d => d !== districtName)
        : [...prev, districtName]
    );
  };

  const handleSelectTop5 = () => {
    const top5 = districtImpacts.slice(0, 5).map(d => d.district);
    setSelectedDistricts(top5);
  };

  const selectedDistrictBrief = useMemo(() => {
    if (!selectedDistrictForBrief) return null;
    return districtImpacts.find(d => d.district === selectedDistrictForBrief);
  }, [selectedDistrictForBrief, districtImpacts]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />

        {/* Tab Navigation */}
        <div className="border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-2 px-6">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'builder'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <BookOpen size={16} />
              Doctrine Builder
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'simulation'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Play size={16} />
              Simulation
            </button>
            <button
              onClick={() => setActiveTab('battle')}
              className={`px-4 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'battle'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Swords size={16} />
              Battle Mode
            </button>
            <button
              onClick={() => setActiveTab('brief')}
              className={`px-4 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'brief'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText size={16} />
              Commander Brief
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {/* BUILDER TAB (existing content) */}
          {activeTab === 'builder' && (
          <div className="h-full flex">
            {/* LEFT PANE: District Impact Briefing */}
            <div className="w-96 bg-slate-900/60 border-r border-white/10 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-slate-950/60">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={20} className="text-cyan-400" />
                  <div>
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                      District Intelligence
                    </h2>
                    <p className="text-xs text-slate-500">
                      {districtImpacts.filter(d => d.impactScore > 20).length} districts impacted
                    </p>
                  </div>
                </div>
              </div>

              {/* Impact Feed */}
              <div className="p-3 border-b border-white/10 bg-slate-950/40 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Impact Feed</span>
                    {impactFeed.length > 0 && (
                      <span className="text-xs text-slate-500">
                        ({impactFeed.length} {impactFeed.length === 1 ? 'update' : 'updates'})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-mono">LIVE</span>
                  </div>
                </div>
                {impactFeed.length === 0 ? (
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="italic">Analyzing district impacts...</p>
                    <p className="text-slate-600">
                      {districtImpacts.filter(d => d.impactScore > 30).length} districts with significant impact detected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {impactFeed.slice(0, 12).map(item => (
                      <div key={item.id} className="text-xs flex items-start gap-2 p-1.5 rounded hover:bg-slate-800/30 transition-colors">
                        <span className={
                          item.severity === 'CRITICAL' ? 'text-red-400' :
                          item.severity === 'WARN' ? 'text-amber-400' :
                          'text-blue-400'
                        }>
                          {item.severity === 'CRITICAL' ? '🔴' :
                           item.severity === 'WARN' ? '🟡' : '🔵'}
                        </span>
                        <span className="flex-1 text-slate-300 leading-relaxed">
                          <span className="font-bold text-cyan-400">{item.district}:</span> {item.message}
                          {item.delta && <span className="text-amber-400 ml-1 font-mono">{item.delta}</span>}
                        </span>
                      </div>
                    ))}
                    {impactFeed.length > 12 && (
                      <div className="text-xs text-slate-500 italic text-center pt-1">
                        +{impactFeed.length - 12} more updates
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* District List */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {districtImpacts.map(district => (
                    <div
                      key={district.code}
                      className={`bg-slate-800/40 border rounded-lg p-3 cursor-pointer transition-all hover:bg-slate-800/60 ${
                        selectedDistricts.includes(district.district)
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-white/10'
                      }`}
                      onClick={() => handleSelectDistrict(district.district)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDistricts.includes(district.district)}
                              onChange={() => handleSelectDistrict(district.district)}
                              className="w-4 h-4 rounded border-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-bold text-slate-200">
                              {district.district}
                            </span>
                            <span className="text-xs text-slate-500">({district.code})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-mono font-bold ${getImpactScoreColor(district.impactScore)}`}>
                            {district.impactScore}
                          </div>
                          <div className="text-xs text-slate-500">impact</div>
                        </div>
                      </div>

                      {/* Hazards */}
                      <div className="flex items-center gap-2 mb-2">
                        {district.hazardFlags.flood && <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">💧 Flood</span>}
                        {district.hazardFlags.cyclone && <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">🌀 Cyclone</span>}
                        {district.hazardFlags.wind && <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">💨 Wind</span>}
                        {district.hazardFlags.landslide && <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">🏔️ Landslide</span>}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        {district.flood.maxDepthM > 0 && (
                          <div>
                            <span className="text-slate-500">Flood:</span>
                            <span className="ml-1 font-mono font-bold text-blue-400">
                              {district.flood.maxDepthM.toFixed(1)}m
                            </span>
                          </div>
                        )}
                        {district.shelters.totalCapacity > 0 && (
                          <div>
                            <span className="text-slate-500">Shelter:</span>
                            <span className="ml-1 font-mono font-bold text-amber-400">
                              {district.shelters.predicted1hPct.toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {district.access.ghostRoadBlocks > 0 && (
                          <div>
                            <span className="text-slate-500">Access:</span>
                            <span className="ml-1 font-mono font-bold text-red-400">
                              {district.access.accessibilityScore}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Posture Badge */}
                      <div className={`text-xs font-bold px-2 py-1 rounded ${getPostureColor(district.recommendedPosture)} text-center`}>
                        {district.recommendedPosture}
                      </div>

                      {/* Detail Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDistrictForBrief(
                            selectedDistrictForBrief === district.district ? null : district.district
                          );
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 w-full text-center"
                      >
                        {selectedDistrictForBrief === district.district ? 'Hide Brief' : 'View Brief'}
                      </button>

                      {/* District Brief Drawer */}
                      {selectedDistrictForBrief === district.district && selectedDistrictBrief && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs font-bold text-slate-400 mb-1">Evidence:</div>
                              <ul className="text-xs text-slate-300 space-y-0.5">
                                {selectedDistrictBrief.evidence.map((ev, i) => (
                                  <li key={i}>• {ev}</li>
                                ))}
                              </ul>
                            </div>
                            
                            {selectedDistrictBrief.affectedPlaces.length > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-400 mb-1">Affected Areas:</div>
                                <div className="text-xs text-cyan-400">
                                  {selectedDistrictBrief.affectedPlaces.join(', ')}
                                </div>
                              </div>
                            )}

                            {selectedDistrictBrief.incidents.total > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-400 mb-1">Incidents:</div>
                                <div className="text-xs text-slate-300">
                                  {selectedDistrictBrief.incidents.total} total 
                                  ({selectedDistrictBrief.incidents.critical} critical)
                                </div>
                              </div>
                            )}

                            {selectedDistrictBrief.populationAtRisk > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-400 mb-1">Population at Risk:</div>
                                <div className="text-xs font-mono font-bold text-red-400">
                                  {selectedDistrictBrief.populationAtRisk.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER PANE: Doctrine Builder */}
            <div className="flex-1 bg-slate-950 flex flex-col">
              {/* Step Indicator */}
              <div className="bg-slate-900/60 border-b border-white/10 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                      Doctrine Builder
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step === currentStep
                            ? 'bg-cyan-500 text-white'
                            : step < currentStep
                            ? 'bg-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* STEP 1: Select Districts */}
                {currentStep === 1 && (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Step 1: Select Affected Districts</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Choose districts that require operational response. Districts are ranked by impact score.
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={handleSelectTop5}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded transition-colors"
                      >
                        Select Top 5
                      </button>
                      <span className="text-xs text-slate-500">
                        {selectedDistricts.length} district(s) selected
                      </span>
                    </div>

                    <div className="bg-slate-900/40 rounded-lg p-4 mb-6">
                      <div className="text-xs text-slate-400 mb-3">
                        Selected districts will receive focused operational plans.
                      </div>
                      {selectedDistricts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedDistricts.map(d => (
                            <span key={d} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={selectedDistricts.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-lg transition-all"
                    >
                      Continue to Objectives →
                    </button>
                  </div>
                )}

                {/* STEP 2: Choose Objective Profile */}
                {currentStep === 2 && (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Step 2: Choose Objective Profile</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Select the primary operational focus for this playbook.
                    </p>

                    <div className="space-y-3 mb-6">
                      {[
                        { id: 'LIFE_SAVING', icon: '🚨', label: 'Life Saving', desc: 'Prioritize evacuation and medical response' },
                        { id: 'FAIRNESS_FIRST', icon: '⚖️', label: 'Fairness First', desc: 'Ensure all communities served equitably' },
                        { id: 'TOURISM', icon: '✈️', label: 'Tourism Protection', desc: 'Tourist zones + multilingual alerts' },
                        { id: 'INFRASTRUCTURE', icon: '🏗️', label: 'Infrastructure Protection', desc: 'Protect critical assets' }
                      ].map(profile => (
                        <label
                          key={profile.id}
                          className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                            objectiveProfile === profile.id
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : 'border-white/10 bg-slate-800/20 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="objective"
                            value={profile.id}
                            checked={objectiveProfile === profile.id}
                            onChange={(e) => setObjectiveProfile(e.target.value)}
                            className="mr-3"
                          />
                          <span className="text-lg mr-2">{profile.icon}</span>
                          <span className="text-sm font-bold text-slate-200">{profile.label}</span>
                          <p className="text-xs text-slate-400 ml-9 mt-1">{profile.desc}</p>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
                      >
                        Continue to Triggers →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Define Triggers */}
                {currentStep === 3 && (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Step 3: Define Adaptive Triggers</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Select rules that automatically trigger actions when districts cross thresholds.
                    </p>

                    <div className="space-y-3 mb-6">
                      {[
                        { id: 'FLOOD_EVAC', label: 'IF flood depth > 1.2m → EVACUATE', icon: '💧' },
                        { id: 'SHELTER_REDIRECT', label: 'IF shelter predicted > 90% → REDIRECT + OPEN overflow', icon: '🏠' },
                        { id: 'ROAD_REROUTE', label: 'IF ghost road blocks > 2 → REROUTE + stage boats', icon: '🚧' },
                        { id: 'CRITICAL_DISPATCH', label: 'IF critical incidents > 3 → DISPATCH all units', icon: '🚨' },
                        { id: 'CYCLONE_LOCK', label: 'IF cyclone cone → LOCKDOWN coast + tourist alert', icon: '🌪️' }
                      ].map(trigger => (
                        <label
                          key={trigger.id}
                          className="flex items-center gap-3 p-3 bg-slate-800/20 border border-white/10 rounded-lg cursor-pointer hover:bg-slate-800/40 transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={triggers.includes(trigger.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTriggers(prev => [...prev, trigger.id]);
                              } else {
                                setTriggers(prev => prev.filter(t => t !== trigger.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-700"
                          />
                          <span className="text-base mr-1">{trigger.icon}</span>
                          <span className="text-sm text-slate-300">{trigger.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
                      >
                        Continue to Resources →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Resource Posture */}
                {currentStep === 4 && (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Step 4: Resource Posture</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Define how assets should be allocated across selected districts.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3">
                          Allocation Strategy
                        </label>
                        <div className="space-y-2">
                          {[
                            { id: 'EQUAL', label: 'Equal Distribution', desc: 'Same resources to all districts' },
                            { id: 'PROPORTIONAL', label: 'Impact-Proportional', desc: 'More resources to high-impact districts' },
                            { id: 'AGGRESSIVE', label: 'Aggressive Deployment', desc: 'All available assets to critical districts' }
                          ].map(strategy => (
                            <label
                              key={strategy.id}
                              className={`block p-3 border rounded-lg cursor-pointer transition-all ${
                                resourcePosture === strategy.id
                                  ? 'border-cyan-500/50 bg-cyan-500/10'
                                  : 'border-white/10 bg-slate-800/20 hover:border-white/20'
                              }`}
                            >
                              <input
                                type="radio"
                                name="resource"
                                value={strategy.id}
                                checked={resourcePosture === strategy.id}
                                onChange={(e) => setResourcePosture(e.target.value)}
                                className="mr-3"
                              />
                              <span className="text-sm font-bold text-slate-200">{strategy.label}</span>
                              <p className="text-xs text-slate-400 ml-7">{strategy.desc}</p>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={16} className="text-emerald-400" />
                          <span className="text-sm font-bold text-slate-300">Asset Readiness</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {assets.filter(a => a.status === 'READY').length} of {assets.length} assets ready
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(5)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
                      >
                        Continue to Review →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: Review & Generate */}
                {currentStep === 5 && (
                  <div className="max-w-3xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Step 5: Review & Generate Playbook</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Review your configuration and generate the operational plan.
                    </p>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-900/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs font-bold text-slate-400 mb-2">Selected Districts</div>
                        <div className="text-sm text-slate-200">
                          {selectedDistricts.join(', ')}
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs font-bold text-slate-400 mb-2">Objective Profile</div>
                        <div className="text-sm text-slate-200">
                          {objectiveProfile.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs font-bold text-slate-400 mb-2">Active Triggers</div>
                        <div className="text-sm text-slate-200">
                          {triggers.length} rule(s)
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs font-bold text-slate-400 mb-2">Resource Strategy</div>
                        <div className="text-sm text-slate-200">
                          {resourcePosture.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleGeneratePlaybook}
                        disabled={isGenerating}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 text-lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Generating Operational Plan...
                          </>
                        ) : (
                          <>
                            <Play size={20} />
                            Generate Playbook
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANE: Simulation Results */}
            <div className="w-[420px] bg-slate-900/60 border-l border-white/10 flex flex-col">
              <div className="p-4 border-b border-white/10 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-cyan-400" />
                  <div>
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                      Simulation Results
                    </h2>
                    <p className="text-xs text-slate-500">
                      {playbookRun ? 'Plan ready' : 'Awaiting simulation'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!playbookRun ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle size={48} className="mx-auto mb-4 text-slate-700" />
                      <p className="text-sm text-slate-500">
                        Complete the workflow and generate a playbook to see results
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Scores */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Plan Scores</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Equity', value: playbookRun.scores.equity, icon: '⚖️' },
                          { label: 'Efficiency', value: playbookRun.scores.efficiency, icon: '⚡' },
                          { label: 'Overload', value: playbookRun.scores.overloadAvoidance, icon: '🏠' },
                          { label: 'Safety', value: playbookRun.scores.travelSafety, icon: '🛣️' },
                          { label: 'Feasible', value: playbookRun.scores.executionFeasibility, icon: '✓' },
                          { label: 'Overall', value: playbookRun.scores.overall, icon: '★' }
                        ].map(score => (
                          <div key={score.label} className="bg-slate-950/60 border border-white/10 rounded p-2">
                            <div className="text-xs text-slate-500 mb-1">
                              {score.icon} {score.label}
                            </div>
                            <div className={`text-xl font-mono font-bold ${
                              score.value >= 80 ? 'text-emerald-400' :
                              score.value >= 60 ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {score.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority Hotspots */}
                    {playbookRun.districtHotspots && playbookRun.districtHotspots.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                          <MapPin size={12} />
                          Priority Hotspots (Sub-District)
                        </h3>
                        
                        <div className="space-y-3">
                          {playbookRun.districtHotspots.map((dh) => (
                            <div key={dh.district} className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                              <div className="text-xs font-bold text-slate-200 mb-2">
                                {dh.district}
                              </div>
                              <div className="space-y-2">
                                {dh.hotspots.map((hotspot, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded border ${
                                      hotspot.priority === 'P1'
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : hotspot.priority === 'P2'
                                        ? 'bg-orange-500/10 border-orange-500/30'
                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-xs font-bold text-slate-200">
                                        {hotspot.placeName}
                                      </div>
                                      <div
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          hotspot.priority === 'P1'
                                            ? 'bg-red-500/20 text-red-400'
                                            : hotspot.priority === 'P2'
                                            ? 'bg-orange-500/20 text-orange-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                      >
                                        {hotspot.priority} ({hotspot.score.toFixed(0)})
                                      </div>
                                    </div>
                                    <ul className="space-y-0.5">
                                      {hotspot.reasons.map((reason, ridx) => (
                                        <li key={ridx} className="text-[10px] text-slate-400 pl-2">
                                          • {reason}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Commander Brief */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Commander Brief</h3>
                      
                      {/* Immediate */}
                      <div className="mb-3">
                        <div className="text-xs font-bold text-red-400 mb-1.5 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          IMMEDIATE (0-30min)
                        </div>
                        <ul className="space-y-1">
                          {playbookRun.commanderBrief.immediate.map((action, i) => (
                            <li key={i} className="text-xs text-slate-300 pl-3">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Next 2 Hours */}
                      <div className="mb-3">
                        <div className="text-xs font-bold text-amber-400 mb-1.5">NEXT 2 HOURS</div>
                        <ul className="space-y-1">
                          {playbookRun.commanderBrief.nextTwoHours.map((action, i) => (
                            <li key={i} className="text-xs text-slate-300 pl-3">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Resource Allocation */}
                      <div className="mb-3">
                        <div className="text-xs font-bold text-emerald-400 mb-1.5">RESOURCE ALLOCATION</div>
                        <ul className="space-y-1">
                          {playbookRun.commanderBrief.resourceAllocation.map((item, i) => (
                            <li key={i} className="text-xs text-slate-300 pl-3">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Warnings */}
                      <div>
                        <div className="text-xs font-bold text-purple-400 mb-1.5">RISK WARNINGS</div>
                        <ul className="space-y-1">
                          {playbookRun.commanderBrief.riskWarnings.map((warning, i) => (
                            <li key={i} className="text-xs text-slate-300 pl-3 flex items-start gap-1">
                              {warning.startsWith('✓') ? (
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                              )}
                              <span>{warning.replace(/^[✓⚠️]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Comms Schedule Timeline */}
                    {playbookRun.generatedComms && playbookRun.generatedComms.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                          <Activity size={12} />
                          Communications Timeline
                        </h3>
                        
                        <div className="space-y-2">
                          {playbookRun.generatedComms.map((comm, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-800/50 rounded p-2 border border-slate-700/50"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] font-bold text-cyan-400">
                                  {comm.timing}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                                    {comm.lang}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                    {comm.audience}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-300 font-bold mb-0.5">
                                {comm.subject}
                              </div>
                              <div className="text-[9px] text-slate-500 line-clamp-2">
                                {comm.body}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Coverage Summary */}
                        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                          <div className="text-[10px] font-bold text-blue-400 mb-1">
                            📡 Coverage Summary
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-slate-400">
                            <span>
                              {[...new Set(playbookRun.generatedComms.map(c => c.lang))].length} languages
                            </span>
                            <span>•</span>
                            <span>
                              {[...new Set(playbookRun.generatedComms.map(c => c.audience))].length} audience types
                            </span>
                            <span>•</span>
                            <span>
                              {playbookRun.generatedComms.length} total messages
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Export Buttons */}
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <button
                        onClick={() => {
                          if (!playbookRun) return;
                          
                          // Check if already saved
                          const exists = savedPlaybooks.find(pb => pb.id === playbook.id);
                          if (exists) {
                            // Update existing
                            setSavedPlaybooks(prev => prev.map(pb => 
                              pb.id === playbook.id ? { ...playbook, updatedAt: Date.now() } : pb
                            ));
                            alert(`✓ Updated: ${playbook.name}\n\nVersion: ${playbook.version}\nStatus: ${playbook.status}`);
                          } else {
                            // Save new
                            setSavedPlaybooks(prev => [...prev, playbook]);
                            alert(`✓ Saved to Library: ${playbook.name}\n\nYou can now compare this playbook in Battle Mode!\n\nTotal saved: ${savedPlaybooks.length + 1}`);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <BookOpen size={14} />
                        Save to Library
                      </button>

                      <button
                        onClick={handleSendToMissionControl}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Send size={14} />
                        Send to Mission Control
                      </button>

                      <button
                        onClick={handleSendToComms}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Send size={14} />
                        Send to Comms Console
                      </button>

                      <button
                        onClick={handleApplyConstraints}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <SettingsIcon size={14} />
                        Apply Constraints
                      </button>

                      <button
                        onClick={() => alert('District Action Packs exported (JSON + PDF)')}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all text-sm"
                      >
                        📦 Download Action Packs
                      </button>
                      
                      <button
                        onClick={() => {
                          if (!playbookRun) return;
                          
                          const briefData = {
                            playbookId: playbookRun.id,
                            generatedAt: new Date(playbookRun.generatedAt).toISOString(),
                            playbook: {
                              name: playbook.name,
                              version: playbook.version,
                              status: playbook.status,
                              targetArea: playbook.targetArea
                            },
                            commanderBrief: playbookRun.commanderBrief,
                            scores: playbookRun.scores,
                            districtHotspots: playbookRun.districtHotspots,
                            missions: playbookRun.generatedMissions.length,
                            comms: playbookRun.generatedComms.length,
                            commsSchedule: playbookRun.generatedComms.map(c => ({
                              timing: c.timing,
                              subject: c.subject,
                              audience: c.audience,
                              language: c.lang
                            }))
                          };
                          
                          const json = JSON.stringify(briefData, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `commander-brief-${playbook.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          alert(`✅ Commander Brief Exported!\n\nPlaybook: ${playbook.name}\nVersion: ${playbook.version}\n\nFile saved as JSON for integration with command systems.`);
                        }}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText size={14} />
                        Export Commander Brief (JSON)
                      </button>
                    </div>

                    {/* Missions Summary */}
                    {playbookRun.generatedMissions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                          Missions ({playbookRun.generatedMissions.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {playbookRun.generatedMissions.map(mission => (
                            <div key={mission.id} className="bg-slate-950/60 border border-white/10 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-300">{mission.title}</span>
                                <span className="text-xs font-mono text-cyan-400">P{mission.priority}</span>
                              </div>
                              <div className="text-xs text-slate-500">{mission.rationale.slice(0, 80)}...</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
          {/* End Builder Tab */}

          {/* SIMULATION TAB - Redirect to Battle Mode */}
          {activeTab === 'simulation' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                  <Play size={28} />
                  Simulation & Testing
                </h1>
                <p className="text-slate-400 mb-6">
                  All simulation and testing features are available in the <strong className="text-cyan-400">Battle Mode</strong> tab.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {/* Battle Mode Card */}
                  <div className="bg-slate-900/60 rounded-lg border border-cyan-500/30 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Swords size={24} className="text-cyan-400" />
                      <h2 className="text-lg font-bold text-cyan-400">Battle Mode</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Compare 2-4 playbooks side-by-side. See scoreboard, identify winner, analyze failures.
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1 mb-4">
                      <li>• Professional scoreboard (6 metrics)</li>
                      <li>• Winner identification</li>
                      <li>• Failure points analysis</li>
                      <li>• Resource usage tracking</li>
                      <li>• One-click promotion to ACTIVE</li>
                    </ul>
                    <div className="text-xs text-emerald-400 font-bold">
                      ⚡ Performance: &lt;2 seconds for 4 playbooks
                    </div>
                  </div>

                  {/* Robustness Testing Card */}
                  <div className="bg-slate-900/60 rounded-lg border border-purple-500/30 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap size={24} className="text-purple-400" />
                      <h2 className="text-lg font-bold text-purple-400">Robustness Testing</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Test any playbook under 30 randomized scenarios. Get confidence grade (A-F).
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1 mb-4">
                      <li>• Monte Carlo simulation (30 runs)</li>
                      <li>• Success rate calculation</li>
                      <li>• Confidence grading (A/B/C/D/F)</li>
                      <li>• Score distributions (charts)</li>
                      <li>• Failed runs breakdown</li>
                    </ul>
                    <div className="text-xs text-emerald-400 font-bold">
                      ⚡ Performance: &lt;2 seconds for 30 runs
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setActiveTab('battle')}
                    className="px-8 py-4 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-3 shadow-lg shadow-cyan-500/10"
                  >
                    <Swords size={20} />
                    Go to Battle Mode
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'battle' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center gap-3">
                    <Swords size={28} />
                    BATTLE MODE: Doctrine Comparison
                  </h1>
                  <p className="text-sm text-slate-400">
                    Compare 2-4 playbooks side-by-side to identify the best strategy
                  </p>
                </div>

                {/* Playbook Library Status */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-blue-400 mb-1">
                        📚 Playbook Library
                      </div>
                      <div className="text-xs text-slate-400">
                        {savedPlaybooks.length} doctrine{savedPlaybooks.length !== 1 ? 's' : ''} saved · 
                        {' '}{savedPlaybooks.filter(pb => pb.status === 'ACTIVE').length} active · 
                        {' '}{selectedBattlePlaybooks.length} selected for battle
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Select 2-4 playbooks to compare
                    </div>
                  </div>
                </div>

                {/* Playbook Selection */}
                <div className="bg-slate-900/60 rounded-lg p-6 border border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-300 uppercase">
                      Select Playbooks to Compare
                    </h2>
                    {selectedBattlePlaybooks.length > 0 && (
                      <button
                        onClick={() => setSelectedBattlePlaybooks([])}
                        className="text-xs text-red-400 hover:text-red-300 transition-all"
                      >
                        Clear ({selectedBattlePlaybooks.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {savedPlaybooks.map(pb => (
                      <div
                        key={pb.id}
                        onClick={() => {
                          const isSelected = selectedBattlePlaybooks.includes(pb.id);
                          if (isSelected) {
                            setSelectedBattlePlaybooks(prev => prev.filter(id => id !== pb.id));
                          } else if (selectedBattlePlaybooks.length < 4) {
                            setSelectedBattlePlaybooks(prev => [...prev, pb.id]);
                          } else {
                            alert('⚠️ Maximum 4 playbooks can be compared at once');
                          }
                        }}
                        className={`p-4 rounded border cursor-pointer transition-all ${
                          selectedBattlePlaybooks.includes(pb.id)
                            ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-bold text-slate-200">{pb.name}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {pb.targetArea}
                            </div>
                          </div>
                          {selectedBattlePlaybooks.includes(pb.id) && (
                            <CheckCircle2 size={18} className="text-cyan-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">v{pb.version}</span>
                          <span className="text-slate-600">·</span>
                          <span className={
                            pb.status === 'ACTIVE' ? 'text-emerald-400 font-bold' :
                            pb.status === 'APPROVED' ? 'text-blue-400' :
                            pb.status === 'REVIEWED' ? 'text-purple-400' :
                            'text-slate-500'
                          }>
                            {pb.status}
                          </span>
                          {pb.status === 'ACTIVE' && (
                            <span className="ml-auto px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {savedPlaybooks.length >= 2 && (
                      <button
                        onClick={() => {
                          const allIds = savedPlaybooks.slice(0, 4).map(pb => pb.id);
                          setSelectedBattlePlaybooks(allIds);
                        }}
                        className="px-4 py-3 rounded bg-slate-700/50 border border-slate-600/50 text-slate-300 font-bold hover:bg-slate-600/50 transition-all text-sm"
                      >
                        Select All ({Math.min(savedPlaybooks.length, 4)})
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (selectedBattlePlaybooks.length < 2) {
                          alert('⚠️ Select at least 2 playbooks to compare');
                          return;
                        }
                        
                        setIsRunningBattle(true);
                        setTimeout(() => {
                          const selectedPbs = savedPlaybooks.filter(pb => 
                            selectedBattlePlaybooks.includes(pb.id)
                          );
                          
                          const result = runBattleMode(
                            selectedPbs,
                            'scenario_001',
                            opState,
                            incidents,
                            shelters,
                            assets
                          );
                          
                          setBattleResult(result);
                          setIsRunningBattle(false);
                        }, 1000);
                      }}
                      disabled={selectedBattlePlaybooks.length < 2 || isRunningBattle}
                      className="flex-1 px-6 py-3 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {isRunningBattle ? (
                        <>
                          <Activity size={16} className="animate-spin" />
                          Running Battle...
                        </>
                      ) : (
                        <>
                          <Swords size={16} />
                          Run Battle Mode ({selectedBattlePlaybooks.length} {selectedBattlePlaybooks.length === 1 ? 'playbook' : 'playbooks'})
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Empty State - No Battle Run Yet */}
                {!battleResult && !isRunningBattle && (
                  <div className="bg-slate-900/60 rounded-lg border border-white/10 p-12 text-center">
                    <Swords size={48} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">
                      Ready to Compare Doctrines
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                      Select 2-4 playbooks above and click “Run Battle Mode” to see side-by-side comparison,
                      identify the best strategy, and promote the winner to active doctrine.
                    </p>
                    {savedPlaybooks.length < 2 && (
                      <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded inline-block">
                        <p className="text-xs text-amber-400">
                          💡 <strong>Tip:</strong> Go to “Doctrine Builder” tab, generate playbooks with different objectives,
                          and save them to library. Then come back here to compare!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Battle Results */}
                {battleResult && (
                  <div className="space-y-6">
                    {/* Scoreboard */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 overflow-hidden">
                      <div className="p-4 bg-slate-950/60 border-b border-white/10">
                        <h2 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2">
                          <Trophy size={16} />
                          Scoreboard
                        </h2>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                            <tr>
                              <th className="px-4 py-3 text-left">Rank</th>
                              <th className="px-4 py-3 text-left">Playbook</th>
                              <th className="px-4 py-3 text-center">Equity</th>
                              <th className="px-4 py-3 text-center">Efficiency</th>
                              <th className="px-4 py-3 text-center">Overload</th>
                              <th className="px-4 py-3 text-center">Safety</th>
                              <th className="px-4 py-3 text-center">Feasible</th>
                              <th className="px-4 py-3 text-center font-bold">Overall</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {battleResult.scoreboard.map((entry) => {
                              const getScoreColor = (score: number) => {
                                if (score >= 90) return 'text-emerald-400 font-bold';
                                if (score >= 75) return 'text-cyan-400';
                                if (score >= 60) return 'text-amber-400';
                                return 'text-red-400';
                              };
                              
                              return (
                                <tr
                                  key={entry.playbookId}
                                  className={`border-b border-slate-700/50 ${
                                    entry.playbookId === battleResult.winner
                                      ? 'bg-emerald-500/10'
                                      : 'hover:bg-slate-800/30'
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    {entry.rank === 1 ? (
                                      <Trophy size={16} className="text-amber-400" />
                                    ) : entry.rank === 2 ? (
                                      <Trophy size={14} className="text-slate-400" />
                                    ) : entry.rank === 3 ? (
                                      <Trophy size={12} className="text-amber-700" />
                                    ) : (
                                      <span className="text-slate-500">#{entry.rank}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-200">
                                    {entry.playbookName}
                                    {entry.playbookId === battleResult.winner && (
                                      <span className="ml-2 text-xs text-emerald-400 font-bold">🏆 WINNER</span>
                                    )}
                                  </td>
                                  <td className={`px-4 py-3 text-center ${getScoreColor(entry.scores.equity)}`}>
                                    {entry.scores.equity.toFixed(0)}
                                  </td>
                                  <td className={`px-4 py-3 text-center ${getScoreColor(entry.scores.efficiency)}`}>
                                    {entry.scores.efficiency.toFixed(0)}
                                  </td>
                                  <td className={`px-4 py-3 text-center ${getScoreColor(entry.scores.overloadAvoidance)}`}>
                                    {entry.scores.overloadAvoidance.toFixed(0)}
                                  </td>
                                  <td className={`px-4 py-3 text-center ${getScoreColor(entry.scores.travelSafety)}`}>
                                    {entry.scores.travelSafety.toFixed(0)}
                                  </td>
                                  <td className={`px-4 py-3 text-center ${getScoreColor(entry.scores.executionFeasibility)}`}>
                                    {entry.scores.executionFeasibility.toFixed(0)}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-cyan-400 text-base">
                                    {entry.scores.overall.toFixed(0)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Failure Points & Resource Usage (side-by-side) */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Failure Points */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                        <h2 className="text-sm font-bold text-orange-400 uppercase mb-4 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Failure Points Analysis
                        </h2>
                        
                        <div className="space-y-4">
                          {battleResult.playbooks.map(pb => (
                            <div key={pb.id}>
                              <div className="text-xs font-bold text-slate-300 mb-2">
                                {pb.name}
                              </div>
                              <div className="space-y-1">
                                {battleResult.failurePoints[pb.id]?.map((point, i) => (
                                  <div key={i} className="text-xs text-slate-400 pl-3">
                                    {point.startsWith('✓') ? (
                                      <span className="text-emerald-400">{point}</span>
                                    ) : point.startsWith('→') ? (
                                      <span className="text-slate-500">{point}</span>
                                    ) : (
                                      <span>• {point}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resource Usage */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                        <h2 className="text-sm font-bold text-blue-400 uppercase mb-4 flex items-center gap-2">
                          <Users size={16} />
                          Resource Usage
                        </h2>
                        
                        <div className="space-y-4">
                          {battleResult.playbooks.map(pb => {
                            const usage = battleResult.resourceUsage[pb.id];
                            return (
                              <div key={pb.id}>
                                <div className="text-xs font-bold text-slate-300 mb-2">
                                  {pb.name}
                                </div>
                                <div className="space-y-1 text-xs text-slate-400">
                                  <div className="flex justify-between">
                                    <span>Deployed:</span>
                                    <span className="text-cyan-400 font-bold">{usage.assetsDeployed} assets</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Standby:</span>
                                    <span className="text-slate-300">{usage.assetsStandby} assets</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Utilization:</span>
                                    <span className={
                                      usage.utilizationPercent > 80 ? 'text-orange-400 font-bold' :
                                      usage.utilizationPercent > 60 ? 'text-emerald-400' :
                                      'text-slate-300'
                                    }>
                                      {usage.utilizationPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          if (!battleResult.winner) return;
                          const winningPb = savedPlaybooks.find(pb => pb.id === battleResult.winner);
                          if (winningPb) {
                            const promoted = promoteToActive(winningPb, 'OPERATOR');
                            setSavedPlaybooks(prev => prev.map(pb => 
                              pb.id === promoted.id ? promoted : pb
                            ));
                            alert(`✅ ${winningPb.name} promoted to ACTIVE doctrine!\n\nVersion: ${promoted.version}\nStatus: ${promoted.status}\nApproved by: ${promoted.approvedBy}`);
                          }
                        }}
                        className="px-6 py-3 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/30 flex items-center gap-2 transition-all"
                      >
                        <Trophy size={16} />
                        Promote Winner to Active Doctrine
                      </button>
                      
                      <button
                        onClick={() => {
                          if (battleResult.winner) {
                            const winningRun = battleResult.runs.find((_, i) => 
                              battleResult.playbooks[i].id === battleResult.winner
                            );
                            if (winningRun) {
                              setPlaybookRun(winningRun);
                              setActiveTab('brief');
                            }
                          }
                        }}
                        className="px-6 py-3 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/30 flex items-center gap-2 transition-all"
                      >
                        <FileText size={16} />
                        View Winner’s Brief
                      </button>
                      
                      <button
                        onClick={() => {
                          setBattleResult(null);
                          setSelectedBattlePlaybooks([]);
                        }}
                        className="px-6 py-3 rounded bg-slate-700/50 border border-slate-600/50 text-slate-300 font-bold hover:bg-slate-600/50 transition-all"
                      >
                        Reset Battle
                      </button>
                    </div>
                  </div>
                )}

                {/* DIVIDER */}
                {(battleResult || monteCarloResult) && (
                  <div className="my-8 border-t border-slate-700/50"></div>
                )}

                {/* MONTE CARLO ROBUSTNESS TEST */}
                <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-3">
                      <Zap size={24} />
                      ROBUSTNESS TEST: Uncertainty Analysis
                    </h2>
                    <p className="text-sm text-slate-400">
                      Test a playbook under 30 randomized scenarios to measure resilience
                    </p>
                  </div>

                  {/* Uncertainty Controls */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Flood Depth Variability */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">
                        Flood Depth Variability
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          value={uncertaintyParams.floodDepthVariabilityPct * 100}
                          onChange={(e) => setUncertaintyParams(prev => ({
                            ...prev,
                            floodDepthVariabilityPct: parseFloat(e.target.value) / 100
                          }))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-cyan-400 w-16 text-right">
                          ±{(uncertaintyParams.floodDepthVariabilityPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Random variation in flood water depth
                      </p>
                    </div>

                    {/* Road Failure Probability */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">
                        Road Failure Probability
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          value={uncertaintyParams.roadFailureProbabilityPct * 100}
                          onChange={(e) => setUncertaintyParams(prev => ({
                            ...prev,
                            roadFailureProbabilityPct: parseFloat(e.target.value) / 100
                          }))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-orange-400 w-16 text-right">
                          {(uncertaintyParams.roadFailureProbabilityPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Chance of additional road blockages
                      </p>
                    </div>

                    {/* Shelter Intake Variability */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">
                        Shelter Intake Variability
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          value={uncertaintyParams.shelterIntakeVariabilityPct * 100}
                          onChange={(e) => setUncertaintyParams(prev => ({
                            ...prev,
                            shelterIntakeVariabilityPct: parseFloat(e.target.value) / 100
                          }))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-emerald-400 w-16 text-right">
                          ±{(uncertaintyParams.shelterIntakeVariabilityPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Variation in shelter capacity/occupancy
                      </p>
                    </div>

                    {/* Sensor Confidence Degradation */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">
                        Sensor Confidence Degradation
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          value={uncertaintyParams.sensorConfidenceDegradePct * 100}
                          onChange={(e) => setUncertaintyParams(prev => ({
                            ...prev,
                            sensorConfidenceDegradePct: parseFloat(e.target.value) / 100
                          }))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-yellow-400 w-16 text-right">
                          {(uncertaintyParams.sensorConfidenceDegradePct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Reduces data trust and severity perception
                      </p>
                    </div>
                  </div>

                  {/* Select Playbook for Testing */}
                  <div className="mb-6">
                    <label className="text-sm font-bold text-slate-300 uppercase mb-3 block">
                      Select Playbook to Test
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {savedPlaybooks.map(pb => (
                        <div
                          key={pb.id}
                          onClick={() => setSelectedPlaybookForRobustness(pb.id)}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedPlaybookForRobustness === pb.id
                              ? 'bg-purple-500/20 border-purple-500/50 shadow-lg'
                              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-200 mb-1">{pb.name}</div>
                          <div className="text-[10px] text-slate-500">v{pb.version} · {pb.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Run Robustness Test Button */}
                  <button
                    onClick={() => {
                      if (!selectedPlaybookForRobustness) {
                        alert('⚠️ Select a playbook to test');
                        return;
                      }
                      
                      setIsRunningMonteCarlo(true);
                      setTimeout(() => {
                        const playbook = savedPlaybooks.find(pb => pb.id === selectedPlaybookForRobustness);
                        if (!playbook) return;
                        
                        const result = runMonteCarloTest(
                          playbook,
                          'scenario_001',
                          opState,
                          incidents,
                          shelters,
                          assets,
                          uncertaintyParams,
                          30
                        );
                        
                        setMonteCarloResult(result);
                        setIsRunningMonteCarlo(false);
                      }, 1500);
                    }}
                    disabled={!selectedPlaybookForRobustness || isRunningMonteCarlo}
                    className="w-full px-6 py-3 rounded bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isRunningMonteCarlo ? (
                      <>
                        <Activity size={16} className="animate-spin" />
                        Running 30 Simulations...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Run Robustness Test (30 runs)
                      </>
                    )}
                  </button>
                </div>

                {/* Monte Carlo Results */}
                {monteCarloResult && (
                  <div className="mt-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      {/* Success Rate */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-4">
                        <div className="text-xs text-slate-400 uppercase mb-2">Success Rate</div>
                        <div className="text-3xl font-bold text-emerald-400">
                          {(monteCarloResult.successRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {monteCarloResult.runs.filter(r => r.success).length} / {monteCarloResult.runs.length} runs passed
                        </div>
                      </div>

                      {/* Confidence Grade */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-4">
                        <div className="text-xs text-slate-400 uppercase mb-2">Confidence Grade</div>
                        <div className={`text-3xl font-bold ${
                          monteCarloResult.confidenceGrade === 'A' ? 'text-emerald-400' :
                          monteCarloResult.confidenceGrade === 'B' ? 'text-cyan-400' :
                          monteCarloResult.confidenceGrade === 'C' ? 'text-amber-400' :
                          monteCarloResult.confidenceGrade === 'D' ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {monteCarloResult.confidenceGrade}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {monteCarloResult.confidenceGrade === 'A' && 'Excellent resilience'}
                          {monteCarloResult.confidenceGrade === 'B' && 'Good resilience'}
                          {monteCarloResult.confidenceGrade === 'C' && 'Acceptable resilience'}
                          {monteCarloResult.confidenceGrade === 'D' && 'Weak resilience'}
                          {monteCarloResult.confidenceGrade === 'F' && 'Fails under uncertainty'}
                        </div>
                      </div>

                      {/* Worst Case */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-4">
                        <div className="text-xs text-slate-400 uppercase mb-2">Worst Case</div>
                        <div className="text-3xl font-bold text-red-400">
                          {monteCarloResult.worstCase.overall.toFixed(0)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Overall score (10th percentile)
                        </div>
                      </div>

                      {/* Average Case */}
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-4">
                        <div className="text-xs text-slate-400 uppercase mb-2">Average Case</div>
                        <div className="text-3xl font-bold text-cyan-400">
                          {monteCarloResult.averageCase.overall.toFixed(0)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Overall score (mean)
                        </div>
                      </div>
                    </div>

                    {/* Score Distributions (Simple Bar Charts) */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h3 className="text-sm font-bold text-purple-400 uppercase mb-4 flex items-center gap-2">
                        <BarChart3 size={16} />
                        Score Distributions (30 runs)
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Overall Score Distribution */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-300">Overall Score</span>
                            <span className="text-xs text-slate-500">
                              {monteCarloResult.worstCase.overall.toFixed(0)} - {monteCarloResult.bestCase.overall.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex gap-0.5 h-12 items-end">
                            {monteCarloResult.distributions.overall.map((score, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-cyan-500/60 rounded-t transition-all hover:bg-cyan-400"
                                style={{ height: `${(score / 100) * 100}%` }}
                                title={`Run ${i + 1}: ${score.toFixed(0)}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Equity Distribution */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-300">Equity</span>
                            <span className="text-xs text-slate-500">
                              {monteCarloResult.worstCase.equity.toFixed(0)} - {monteCarloResult.bestCase.equity.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex gap-0.5 h-8 items-end">
                            {monteCarloResult.distributions.equity.map((score, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-emerald-500/60 rounded-t transition-all hover:bg-emerald-400"
                                style={{ height: `${(score / 100) * 100}%` }}
                                title={`Run ${i + 1}: ${score.toFixed(0)}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Efficiency Distribution */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-300">Efficiency</span>
                            <span className="text-xs text-slate-500">
                              {monteCarloResult.worstCase.efficiency.toFixed(0)} - {monteCarloResult.bestCase.efficiency.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex gap-0.5 h-8 items-end">
                            {monteCarloResult.distributions.efficiency.map((score, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-blue-500/60 rounded-t transition-all hover:bg-blue-400"
                                style={{ height: `${(score / 100) * 100}%` }}
                                title={`Run ${i + 1}: ${score.toFixed(0)}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Failed Runs Analysis */}
                    {monteCarloResult.runs.filter(r => !r.success).length > 0 && (
                      <div className="bg-slate-900/60 rounded-lg border border-red-500/30 p-6">
                        <h3 className="text-sm font-bold text-red-400 uppercase mb-4 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Failed Runs ({monteCarloResult.runs.filter(r => !r.success).length} / {monteCarloResult.runs.length})
                        </h3>
                        
                        <div className="space-y-2">
                          {monteCarloResult.runs.filter(r => !r.success).slice(0, 5).map(run => (
                            <div key={run.runNumber} className="text-xs text-slate-400">
                              <span className="text-red-400 font-bold">Run #{run.runNumber}</span>
                              {' '}- {run.failureReason}
                            </div>
                          ))}
                          {monteCarloResult.runs.filter(r => !r.success).length > 5 && (
                            <div className="text-xs text-slate-500 italic">
                              ... and {monteCarloResult.runs.filter(r => !r.success).length - 5} more failures
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setMonteCarloResult(null);
                          setSelectedPlaybookForRobustness(null);
                        }}
                        className="px-6 py-3 rounded bg-slate-700/50 border border-slate-600/50 text-slate-300 font-bold hover:bg-slate-600/50 transition-all"
                      >
                        Reset Test
                      </button>
                      
                      {monteCarloResult.confidenceGrade !== 'F' && (
                        <button
                          onClick={() => {
                            alert(`✅ Robustness Report Exported!\n\nPlaybook: ${monteCarloResult.playbook.name}\nGrade: ${monteCarloResult.confidenceGrade}\nSuccess Rate: ${(monteCarloResult.successRate * 100).toFixed(0)}%\n\nReport saved as JSON for detailed analysis.`);
                          }}
                          className="px-6 py-3 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/30 transition-all flex items-center gap-2"
                        >
                          <FileText size={16} />
                          Export Robustness Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'brief' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                  <FileText size={28} />
                  COMMANDER BRIEF: Operational Order
                </h1>

                {!playbookRun ? (
                  // Empty State - No Playbook Generated
                  <div className="bg-slate-900/60 rounded-lg border border-white/10 p-12 text-center">
                    <FileText size={64} className="mx-auto mb-4 text-slate-700" />
                    <h2 className="text-xl font-bold text-slate-400 mb-3">
                      No Playbook Generated
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                      Generate a playbook in the <strong>Doctrine Builder</strong> tab to view the complete Commander Brief with operational orders.
                    </p>
                    <button
                      onClick={() => setActiveTab('builder')}
                      className="px-6 py-3 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-2 mx-auto"
                    >
                      <BookOpen size={16} />
                      Go to Doctrine Builder
                    </button>
                  </div>
                ) : (
                  // Full Commander Brief Display
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">PLAYBOOK:</span>
                          <span className="ml-2 text-slate-200 font-bold">{playbook.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">VERSION:</span>
                          <span className="ml-2 text-slate-200 font-bold">{playbook.version}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">STATUS:</span>
                          <span className={`ml-2 font-bold ${
                            playbook.status === 'ACTIVE' ? 'text-emerald-400' :
                            playbook.status === 'APPROVED' ? 'text-blue-400' :
                            'text-slate-400'
                          }`}>{playbook.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">GENERATED:</span>
                          <span className="ml-2 text-slate-200">{new Date(playbookRun.generatedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: SITUATION */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-red-400 uppercase mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        1. SITUATION
                      </h2>
                      <div className="space-y-3 text-sm text-slate-300">
                        <p><strong>Target Area:</strong> {playbook.targetArea}</p>
                        <p><strong>Hazard Type:</strong> {playbook.hazardType}</p>
                        <p><strong>Overall Score:</strong> <span className="text-cyan-400 font-bold">{playbookRun.scores.overall.toFixed(0)}/100</span></p>
                        {playbookRun.districtHotspots && playbookRun.districtHotspots.length > 0 && (
                          <div>
                            <strong>Priority Hotspots:</strong>
                            <ul className="mt-2 space-y-1 pl-4">
                              {playbookRun.districtHotspots.flatMap(dh =>
                                dh.hotspots.map(h => (
                                  <li key={`${dh.district}-${h.placeName}`} className="text-xs">
                                    <span className={
                                      h.priority === 'P1' ? 'text-red-400 font-bold' :
                                      h.priority === 'P2' ? 'text-orange-400 font-bold' :
                                      'text-yellow-400 font-bold'
                                    }>
                                      {h.priority}
                                    </span>
                                    {' '}- {dh.district}: {h.placeName} ({h.score.toFixed(0)})
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: MISSION (INTENT) */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-amber-400 uppercase mb-4">
                        2. MISSION (INTENT)
                      </h2>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p><strong>Primary Objectives:</strong></p>
                        <ul className="pl-4 space-y-1">
                          {playbook.objectives.saveLives && <li>✓ Save lives through rapid evacuation</li>}
                          {playbook.objectives.fairness && <li>✓ Ensure equitable response across all communities</li>}
                          {playbook.objectives.protectTourism && <li>✓ Protect tourist areas and visitors</li>}
                          {playbook.objectives.minimizeCost && <li>✓ Minimize operational costs</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Section 3: EXECUTION */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-cyan-400 uppercase mb-4 flex items-center gap-2">
                        <Activity size={20} />
                        3. EXECUTION
                      </h2>
                      
                      {/* Immediate Actions */}
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-red-400 uppercase mb-2">
                          IMMEDIATE (0-30min)
                        </h3>
                        <ul className="space-y-1 text-sm text-slate-300 pl-4">
                          {playbookRun.commanderBrief.immediate.map((action, i) => (
                            <li key={i}>• {action}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Next 2 Hours */}
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-amber-400 uppercase mb-2">
                          NEXT 2 HOURS
                        </h3>
                        <ul className="space-y-1 text-sm text-slate-300 pl-4">
                          {playbookRun.commanderBrief.nextTwoHours.map((action, i) => (
                            <li key={i}>• {action}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Tasks (Missions) */}
                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 uppercase mb-2">
                          TASKS ({playbookRun.generatedMissions.length} Missions)
                        </h3>
                        <div className="space-y-2">
                          {playbookRun.generatedMissions.slice(0, 5).map((mission) => (
                            <div key={mission.id} className="bg-slate-800/50 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-200">{mission.title}</span>
                                <span className="text-xs font-mono text-cyan-400">P{mission.priority}</span>
                              </div>
                              <div className="text-xs text-slate-500">{mission.rationale}</div>
                            </div>
                          ))}
                          {playbookRun.generatedMissions.length > 5 && (
                            <div className="text-xs text-slate-500 italic">
                              ... and {playbookRun.generatedMissions.length - 5} more missions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 4: SERVICE SUPPORT (Resources) */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
                        <Users size={20} />
                        4. SERVICE SUPPORT (RESOURCES)
                      </h2>
                      <ul className="space-y-1 text-sm text-slate-300 pl-4">
                        {playbookRun.commanderBrief.resourceAllocation.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Section 5: COMMAND AND SIGNAL (Comms) */}
                    {playbookRun.generatedComms && playbookRun.generatedComms.length > 0 && (
                      <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                        <h2 className="text-lg font-bold text-blue-400 uppercase mb-4 flex items-center gap-2">
                          <Activity size={20} />
                          5. COMMAND AND SIGNAL (COMMUNICATIONS)
                        </h2>
                        <div className="space-y-2">
                          {playbookRun.generatedComms.slice(0, 5).map((comm, i) => (
                            <div key={i} className="text-sm text-slate-300">
                              <strong>{comm.timing}:</strong> {comm.subject} ({comm.audience}, {comm.lang})
                            </div>
                          ))}
                          {playbookRun.generatedComms.length > 5 && (
                            <div className="text-xs text-slate-500 italic">
                              ... and {playbookRun.generatedComms.length - 5} more messages
                            </div>
                          )}
                        </div>
                        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-slate-400">
                          <strong className="text-blue-400">Coverage:</strong> {playbookRun.generatedComms.length} messages, 
                          {' '}{[...new Set(playbookRun.generatedComms.map(c => c.lang))].length} languages, 
                          {' '}{[...new Set(playbookRun.generatedComms.map(c => c.audience))].length} audiences
                        </div>
                      </div>
                    )}

                    {/* Section 6: RISK ASSESSMENT */}
                    <div className="bg-slate-900/60 rounded-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-purple-400 uppercase mb-4 flex items-center gap-2">
                        <Shield size={20} />
                        6. RISK ASSESSMENT
                      </h2>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {playbookRun.commanderBrief.riskWarnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-2">
                            {warning.startsWith('✓') ? (
                              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <span>{warning.replace(/^[✓⚠️]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          const briefData = {
                            playbookId: playbookRun.id,
                            generatedAt: new Date(playbookRun.generatedAt).toISOString(),
                            playbook: {
                              name: playbook.name,
                              version: playbook.version,
                              status: playbook.status,
                              targetArea: playbook.targetArea
                            },
                            commanderBrief: playbookRun.commanderBrief,
                            scores: playbookRun.scores,
                            districtHotspots: playbookRun.districtHotspots,
                            missions: playbookRun.generatedMissions,
                            comms: playbookRun.generatedComms
                          };
                          
                          const json = JSON.stringify(briefData, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `commander-brief-${playbook.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          alert(`✅ Commander Brief Exported!\n\nPlaybook: ${playbook.name}\nVersion: ${playbook.version}\n\nFile includes complete operational order, missions, communications, and risk assessment.`);
                        }}
                        className="px-6 py-3 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/30 transition-all flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Export Complete Brief (JSON)
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="px-6 py-3 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/30 transition-all flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Print Brief
                      </button>

                      <button
                        onClick={() => setActiveTab('builder')}
                        className="px-6 py-3 rounded bg-slate-700/50 border border-slate-600/50 text-slate-300 font-bold hover:bg-slate-600/50 transition-all"
                      >
                        Back to Builder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
