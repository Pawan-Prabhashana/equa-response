/**
 * useScenarioHydration - Ensures operational stores are populated with scenario data
 * Prevents "no data" issues on pages that don't visit God-View first
 */

import { useEffect, useState } from 'react';
import { fetchScenarios, fetchScenarioDetails, type Incident } from '@/lib/api';
import { useOperationsStore } from '@/store/operationsStore';

// Demo/seed data in case scenario has no incidents
const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'inc_demo_01',
    type: 'FLOOD',
    severity: 8,
    lat: 6.5855,
    lon: 79.9605,
    description: 'Severe flooding in Kalutara town center',
    verified: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 'inc_demo_02',
    type: 'LANDSLIDE',
    severity: 7,
    lat: 6.6050,
    lon: 79.9705,
    description: 'Landslide blocking main road',
    verified: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 'inc_demo_03',
    type: 'FIRE',
    severity: 9,
    lat: 6.6200,
    lon: 79.9800,
    description: 'Family trapped on rooftop',
    verified: false,
    timestamp: new Date().toISOString()
  },
  {
    id: 'inc_demo_04',
    type: 'FIRE',
    severity: 6,
    lat: 6.5700,
    lon: 79.9500,
    description: 'Medical emergency at community center',
    verified: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 'inc_demo_05',
    type: 'WIND',
    severity: 5,
    lat: 6.5950,
    lon: 79.9850,
    description: 'Bridge structural damage',
    verified: false,
    timestamp: new Date().toISOString()
  },
  {
    id: 'inc_demo_06',
    type: 'FLOOD',
    severity: 7,
    lat: 6.6100,
    lon: 79.9650,
    description: 'School evacuation needed',
    verified: true,
    timestamp: new Date().toISOString()
  }
];

interface HydrationState {
  incidents: Incident[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  scenarioId: string | null;
}

export function useScenarioHydration() {
  const [state, setState] = useState<HydrationState>({
    incidents: [],
    isLoading: true,
    isHydrated: false,
    error: null,
    scenarioId: null
  });

  const { incidentStatus, updateIncidentStatus } = useOperationsStore();

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        // Fetch scenarios
        const scenarios = await fetchScenarios();
        if (!scenarios || scenarios.length === 0) {
          throw new Error('No scenarios available');
        }

        // Use first scenario (or could use a selected one from settings store)
        const scenarioId = scenarios[0].id;
        const details = await fetchScenarioDetails(scenarioId);

        if (!mounted) return;

        // Extract incidents
        let incidents = details.incidents || [];

        // If no incidents, use demo data
        if (incidents.length === 0) {
          console.warn('No incidents in scenario, using demo data');
          incidents = DEMO_INCIDENTS;
        }

        // Initialize incident statuses if not set
        incidents.forEach(inc => {
          if (!incidentStatus[inc.id]) {
            // Default status based on verified flag
            const status = inc.verified ? 'VERIFIED' : 'NEW';
            updateIncidentStatus(inc.id, status);
          }
        });

        setState({
          incidents,
          isLoading: false,
          isHydrated: true,
          error: null,
          scenarioId
        });

      } catch (error) {
        console.error('Hydration failed, using demo data:', error);
        
        if (!mounted) return;

        // Fallback to demo data
        const demoIncidents = DEMO_INCIDENTS;
        
        demoIncidents.forEach(inc => {
          if (!incidentStatus[inc.id]) {
            const status = inc.verified ? 'VERIFIED' : 'NEW';
            updateIncidentStatus(inc.id, status);
          }
        });

        setState({
          incidents: demoIncidents,
          isLoading: false,
          isHydrated: true,
          error: error instanceof Error ? error.message : 'Failed to load scenario',
          scenarioId: null
        });
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  return state;
}
