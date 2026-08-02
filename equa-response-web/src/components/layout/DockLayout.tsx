"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface DockLayoutProps {
  children: React.ReactNode; // Map layer
  rightDock?: React.ReactNode; // Ops Copilot
  bottomDock?: React.ReactNode; // Control Deck
  topBar?: React.ReactNode; // Status Bar
  leftDock?: React.ReactNode; // Optional action panel
}

type DockSize = 'S' | 'M' | 'L';

const DOCK_SIZES = {
  S: 320,
  M: 380,
  L: 480
};

export default function DockLayout({
  children,
  rightDock,
  bottomDock,
  topBar,
  leftDock
}: DockLayoutProps) {
  const [rightDockSize, setRightDockSize] = useState<DockSize>('M');
  const [rightDockCollapsed, setRightDockCollapsed] = useState(false);
  const [leftDockCollapsed, setLeftDockCollapsed] = useState(true);

  const rightDockWidth = rightDockCollapsed ? 0 : DOCK_SIZES[rightDockSize];
  const leftDockWidth = leftDockCollapsed ? 0 : 320;
  const bottomDockHeight = 180;

  // Update CSS variables for map padding
  useEffect(() => {
    document.documentElement.style.setProperty('--rightDockW', `${rightDockWidth}px`);
    document.documentElement.style.setProperty('--leftDockW', `${leftDockWidth}px`);
    document.documentElement.style.setProperty('--bottomDockH', `${bottomDockHeight}px`);
  }, [rightDockWidth, leftDockWidth]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map Layer (z-0) */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-300"
        style={{
          paddingRight: rightDockWidth,
          paddingLeft: leftDockWidth,
          paddingBottom: bottomDockHeight
        }}
      >
        {children}
      </div>

      {/* Dock Layer (z-20) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Top Bar (z-30) */}
        {topBar && (
          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
            {topBar}
          </div>
        )}

        {/* Left Dock (collapsible) */}
        {leftDock && !leftDockCollapsed && (
          <div 
            className="absolute left-0 top-16 bottom-0 pointer-events-auto transition-all duration-300"
            style={{ width: leftDockWidth }}
          >
            <div className="h-full bg-slate-900/60 backdrop-blur-xl border-r border-white/10 overflow-y-auto">
              {leftDock}
            </div>
            
            {/* Collapse handle */}
            <button
              onClick={() => setLeftDockCollapsed(true)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-800/80 border border-white/10 rounded-r flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* Left Dock Expand Button */}
        {leftDock && leftDockCollapsed && (
          <button
            onClick={() => setLeftDockCollapsed(false)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-800/80 border border-white/10 rounded-r flex items-center justify-center hover:bg-slate-700 transition-colors pointer-events-auto z-20"
          >
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        )}

        {/* Right Dock (Ops Copilot) */}
        {rightDock && !rightDockCollapsed && (
          <div 
            className="absolute right-0 top-16 bottom-0 pointer-events-auto transition-all duration-300"
            style={{ width: rightDockWidth }}
          >
            <div className="h-full bg-slate-900/60 backdrop-blur-xl border-l border-white/10 flex flex-col">
              {/* Size Controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-950/40">
                <div className="flex gap-1">
                  {(['S', 'M', 'L'] as DockSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setRightDockSize(size)}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                        rightDockSize === size
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setRightDockCollapsed(true)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {rightDock}
              </div>
            </div>
          </div>
        )}

        {/* Right Dock Expand Button */}
        {rightDock && rightDockCollapsed && (
          <button
            onClick={() => setRightDockCollapsed(false)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-800/80 border border-white/10 rounded-l flex items-center justify-center hover:bg-slate-700 transition-colors pointer-events-auto z-20"
          >
            <ChevronLeft size={14} className="text-slate-400" />
          </button>
        )}

        {/* Bottom Dock (Control Deck) */}
        {bottomDock && (
          <div 
            className="absolute bottom-0 left-0 right-0 pointer-events-auto"
            style={{ 
              height: bottomDockHeight,
              paddingRight: rightDockWidth,
              paddingLeft: leftDockWidth
            }}
          >
            <div className="h-full bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
              {bottomDock}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
