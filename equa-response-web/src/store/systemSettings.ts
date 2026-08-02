/**
 * System Settings Store - Global operational controls
 * Manages theme, simulation, role, data mode, and decision ledger
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type ThemePreset = "COMMAND" | "DAWN" | "STEALTH";
export type Density = "COMPACT" | "COMFORTABLE";
export type Role = "OPERATOR" | "ANALYST" | "PUBLIC";
export type DataMode = "LIVE" | "CACHED";
export type StreamSpeed = 0.5 | 1 | 2 | 4;

export interface LedgerEntry {
  id: string;
  ts: number; // epoch ms
  scenarioId: string;
  alpha: number;
  efficiencyScore: number;
  equityVariance: number;
  routeDistanceKm: number;
  deltaDistanceKm: number;
  triggeredConstraints: string[];
}

interface SystemSettingsState {
  // UI/Theme controls
  themePreset: ThemePreset;
  density: Density;
  reduceMotion: boolean;

  // Simulation controls
  demoMode: boolean;
  streamSpeed: StreamSpeed;

  // Safety controls
  role: Role;

  // Data controls
  dataMode: DataMode;
  lastFetchTimestamp: number | null;

  // Decision Ledger
  enableDecisionLedger: boolean;
  ledgerEntries: LedgerEntry[];

  // Actions
  setThemePreset: (theme: ThemePreset) => void;
  setDensity: (density: Density) => void;
  setReduceMotion: (reduce: boolean) => void;
  setDemoMode: (demo: boolean) => void;
  setStreamSpeed: (speed: StreamSpeed) => void;
  setRole: (role: Role) => void;
  setDataMode: (mode: DataMode) => void;
  setEnableDecisionLedger: (enable: boolean) => void;

  recordFetchTimestamp: (ts?: number) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'ts'>) => void;
  clearLedger: () => void;
  resetDemoState: () => void;

  // Computed
  getDataFreshnessSec: () => number;
}

// ============================================
// STORE
// ============================================

export const useSystemSettings = create<SystemSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      themePreset: "COMMAND",
      density: "COMFORTABLE",
      reduceMotion: false,
      demoMode: false,
      streamSpeed: 1,
      role: "OPERATOR",
      dataMode: "LIVE",
      lastFetchTimestamp: null,
      enableDecisionLedger: true,
      ledgerEntries: [],

      // Actions
      setThemePreset: (theme) => set({ themePreset: theme }),
      setDensity: (density) => set({ density }),
      setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
      setDemoMode: (demo) => set({ demoMode: demo }),
      setStreamSpeed: (speed) => set({ streamSpeed: speed }),
      setRole: (role) => set({ role }),
      setDataMode: (mode) => set({ dataMode: mode }),
      setEnableDecisionLedger: (enable) => set({ enableDecisionLedger: enable }),

      recordFetchTimestamp: (ts) => {
        set({ lastFetchTimestamp: ts || Date.now() });
      },

      addLedgerEntry: (entry) => {
        const { enableDecisionLedger, ledgerEntries } = get();
        if (!enableDecisionLedger) return;

        const newEntry: LedgerEntry = {
          ...entry,
          id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ts: Date.now(),
        };

        set({
          ledgerEntries: [newEntry, ...ledgerEntries].slice(0, 100), // Keep last 100
        });
      },

      clearLedger: () => set({ ledgerEntries: [] }),

      resetDemoState: () => {
        // Reset to safe defaults
        set({
          demoMode: false,
          streamSpeed: 1,
          ledgerEntries: [],
        });
      },

      getDataFreshnessSec: () => {
        const { lastFetchTimestamp } = get();
        if (!lastFetchTimestamp) return Infinity;
        return Math.floor((Date.now() - lastFetchTimestamp) / 1000);
      },
    }),
    {
      name: 'equa-system-settings', // localStorage key
      partialize: (state) => ({
        themePreset: state.themePreset,
        density: state.density,
        reduceMotion: state.reduceMotion,
        role: state.role,
        enableDecisionLedger: state.enableDecisionLedger,
        // Don't persist: demoMode, streamSpeed, ledgerEntries, dataMode
      }),
    }
  )
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get theme CSS class for body/root element
 */
export function getThemeClass(preset: ThemePreset): string {
  switch (preset) {
    case "COMMAND":
      return "command";
    case "DAWN":
      return "dawn";
    case "STEALTH":
      return "stealth";
  }
}

/**
 * Get density CSS class
 */
export function getDensityClass(density: Density): string {
  switch (density) {
    case "COMPACT":
      return "density-compact";
    case "COMFORTABLE":
      return "density-comfortable";
  }
}

/**
 * Check if role has permission
 */
export function hasPermission(role: Role, requiredRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    OPERATOR: 3,
    ANALYST: 2,
    PUBLIC: 1,
  };
  return hierarchy[role] >= hierarchy[requiredRole];
}

/**
 * Get motion duration based on reduceMotion setting
 */
export function getMotionDuration(baseMs: number, reduceMotion: boolean): number {
  return reduceMotion ? Math.min(baseMs * 0.3, 100) : baseMs;
}
