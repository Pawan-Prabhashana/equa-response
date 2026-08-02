"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OpsCopilotPanel from "@/components/OpsCopilotPanel";
import GodViewShell from "@/components/layout/GodViewShell";
import GodViewBottomDock from "@/components/godview/GodViewBottomDock";
import ScenarioMetricsCard from "@/components/godview/ScenarioMetricsCard";
import { useOptimizationStore } from "@/store/optimizationStore";
import { useOperationsStore } from "@/store/operationsStore";
import { produceOperationalState } from "@/lib/dataPipeline";
import { generateRecommendations, type Recommendation } from "@/lib/opsCopilot";
import { makeMockTruthReports } from "@/lib/truthEngine";

import type { Incident, Resource, GhostRoad, CycloneCone, FloodPolygon } from "@/lib/api";
import { fetchScenarios, fetchScenarioDetails } from "@/lib/api";

// Globe Intro (client-only)
const OperationalGlobeIntro = dynamic(() => import("@/components/globe/OperationalGlobeIntro"), {
  ssr: false
});

// Dynamic import to avoid SSR/hydration issues with Leaflet
const MainMap = dynamic(() => import("@/components/map/MainMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-primary">
      <div className="text-accent font-mono-data">LOADING MAP...</div>
    </div>
  ),
});

const DEFAULT_CENTER: [number, number] = [7.87, 80.77];

export default function Home() {
  // Globe Intro State
  const [showGlobeIntro, setShowGlobeIntro] = useState(true);
  const [scenarioName, setScenarioName] = useState("Initializing...");
  const [availableScenarios, setAvailableScenarios] = useState<Array<{ id: string; name: string }>>([]);
  
  // State Management
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const [ghostRoads, setGhostRoads] = useState<GhostRoad[]>([]);
  const [cycloneCone, setCycloneCone] = useState<CycloneCone | null>(null);
  const [floodPolygons, setFloodPolygons] = useState<FloodPolygon[]>([]);

  // Use shared stores
  const { 
    alpha,
    optimizedRoute,
    shelters,
    selectedShelterId,
    setAlpha,
    setScenarioData
  } = useOptimizationStore();

  const {
    assets,
    createMission,
    sendMessage
  } = useOperationsStore();

  // Compute Operational State + Recommendations
  const opState = useMemo(() => {
    const truthReports = makeMockTruthReports();
    const readyAssets = assets.filter(a => a.status === 'READY').length;
    
    return produceOperationalState(
      activeScenario || 'unknown',
      incidents,
      floodPolygons,
      cycloneCone,
      ghostRoads,
      shelters,
      truthReports,
      readyAssets,
      assets.length
    );
  }, [activeScenario, incidents, floodPolygons, cycloneCone, ghostRoads, shelters, assets]);

  const recommendations = useMemo(() => {
    return generateRecommendations(opState);
  }, [opState]);

  // Scenario metrics
  const criticalIncidents = incidents.filter(inc => inc.severity >= 8).length;
  const avgShelterOccupancy = shelters.length > 0
    ? (shelters.reduce((sum, s) => sum + (s.current_occupancy / s.capacity) * 100, 0) / shelters.length)
    : 0;

  // Load scenario details (gracefully handle API unavailable)
  const loadScenario = useCallback(async (scenarioId: string) => {
    try {
      const data = await fetchScenarioDetails(scenarioId);

      setActiveScenario(scenarioId);
      setScenarioName(data.name);
      setIncidents(data.incidents || []);
      setResources(data.resources || []);
      setMapCenter(data.center as [number, number] || DEFAULT_CENTER);
      setGhostRoads(data.ghost_roads || []);
      setCycloneCone(data.cyclone_cone || null);
      setFloodPolygons(data.flood_polygons || []);

      // Update optimization store
      setScenarioData(
        data.incidents || [],
        data.resources || [],
        data.center as [number, number] || DEFAULT_CENTER,
        data.shelters || []
      );
    } catch {
      // API unreachable: leave state unchanged
    }
  }, [setScenarioData]);

  // Load scenarios on mount (gracefully handle API unavailable)
  useEffect(() => {
    fetchScenarios()
      .then(list => {
        setAvailableScenarios(list.map(s => ({ id: s.id, name: s.name })));
        if (list.length > 0) {
          loadScenario(list[0].id);
        }
      })
      .catch(() => {
        // API unreachable (e.g. backend not running): keep empty scenarios, app still works
        setAvailableScenarios([]);
      });
  }, [loadScenario]);

  // Ops Copilot handlers
  const handleCreateMissionFromCopilot = (recommendation: Recommendation) => {
    const missionDraft = recommendation.suggestedMissions?.[0];
    if (missionDraft) {
      createMission({
        title: missionDraft.title,
        incidentIds: missionDraft.incidentIds || [],
        assetIds: [],
        notes: `Generated from Ops Copilot: ${recommendation.title}`,
        createdByRole: 'OPERATOR'
      });
      alert(`Mission draft created: ${missionDraft.title}`);
    }
  };

  const handleSendAlertFromCopilot = (recommendation: Recommendation) => {
    const msgDraft = recommendation.suggestedMessages?.[0];
    if (msgDraft) {
      sendMessage({
        channel: 'SMS',
        audience: msgDraft.audience || 'PUBLIC',
        recipientsLabel: msgDraft.audience || 'Public',
        lang: msgDraft.lang || 'EN',
        renderedMessage: `[OPS COPILOT ALERT] ${recommendation.title}`,
        status: 'SENT'
      });
      alert(`Alert sent to ${msgDraft.audience || 'PUBLIC'}`);
    }
  };

  return (
    <>
      {/* Globe Intro Overlay */}
      {showGlobeIntro && (
        <OperationalGlobeIntro
          targetLat={mapCenter[0]}
          targetLon={mapCenter[1]}
          scenarioName={scenarioName}
          onComplete={() => setShowGlobeIntro(false)}
        />
      )}

      {/* Main God-View */}
      {!showGlobeIntro && (
        <GodViewShell
          sidebar={<Sidebar />}
          topBar={<TopBar />}
          mapContent={
            <MainMap
              incidents={incidents}
              resources={resources}
              viewCenter={mapCenter}
              optimizedRoute={optimizedRoute}
              ghostRoads={ghostRoads}
              cycloneCone={cycloneCone}
              floodPolygons={floodPolygons}
              shelters={shelters}
              selectedShelterId={selectedShelterId}
            />
          }
          rightDock={
            <>
              {/* Scenario Metrics (above Ops Copilot) */}
              <ScenarioMetricsCard
                incidentCount={incidents.length}
                criticalIncidents={criticalIncidents}
                resourceCount={resources.length}
                shelterCount={shelters.length}
                shelterOccupancy={avgShelterOccupancy}
              />

              {/* Ops Copilot */}
              <OpsCopilotPanel
                recommendations={recommendations}
                onCreateMission={handleCreateMissionFromCopilot}
                onSendAlert={handleSendAlertFromCopilot}
              />
            </>
          }
          bottomDock={
            <GodViewBottomDock
              selectedScenarioId={activeScenario || undefined}
              scenarios={availableScenarios}
              onScenarioChange={loadScenario}
              alpha={alpha}
              onAlphaChange={setAlpha}
              dataFreshness={`Live • ${opState.sources.sensors.length}s ago`}
            />
          }
        />
      )}
    </>
  );
}
