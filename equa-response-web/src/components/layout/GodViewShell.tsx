"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface GodViewShellProps {
  topBar: React.ReactNode;
  sidebar: React.ReactNode;
  mapContent: React.ReactNode;
  rightDock: React.ReactNode;
  bottomDock: React.ReactNode;
}

type DockSize = 'S' | 'M' | 'L';

const DOCK_SIZES = {
  S: 320,
  M: 420,
  L: 560
};

export default function GodViewShell({
  topBar,
  sidebar,
  mapContent,
  rightDock,
  bottomDock
}: GodViewShellProps) {
  const [rightDockSize, setRightDockSize] = useState<DockSize>('M');
  const [rightDockCollapsed, setRightDockCollapsed] = useState(false);

  const rightDockWidth = rightDockCollapsed ? 0 : DOCK_SIZES[rightDockSize];
  const bottomDockHeight = 80; // Minimal bottom dock

  // Update CSS variables for map
  useEffect(() => {
    document.documentElement.style.setProperty('--rightDockW', `${rightDockWidth}px`);
    document.documentElement.style.setProperty('--bottomDockH', `${bottomDockHeight}px`);
    
    // Trigger Leaflet map resize after a brief delay
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [rightDockWidth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* Left Sidebar (fixed) */}
      {sidebar}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Status Bar (fixed) */}
        <div className="shrink-0 z-30">
          {topBar}
        </div>

        {/* Content + Right Dock */}
        <div className="flex flex-1 min-h-0 relative">
          {/* Map Area (flex-1, accounts for right dock) */}
          <div 
            className="flex-1 relative transition-all duration-300"
            style={{ 
              marginRight: rightDockWidth,
              marginBottom: bottomDockHeight 
            }}
          >
            {mapContent}
          </div>

          {/* Right Dock (Ops Copilot) */}
          {!rightDockCollapsed && (
            <div 
              className="absolute right-0 top-0 bottom-0 bg-slate-900/80 backdrop-blur-xl border-l border-white/10 flex flex-col transition-all duration-300 z-20"
              style={{ 
                width: rightDockWidth,
                bottom: bottomDockHeight 
              }}
            >
              {/* Dock Controls */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-slate-950/60 shrink-0">
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
                  title="Collapse panel"
                >
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Dock Content (scrollable) */}
              <div className="flex-1 overflow-y-auto">
                {rightDock}
              </div>
            </div>
          )}

          {/* Right Dock Expand Button */}
          {rightDockCollapsed && (
            <button
              onClick={() => setRightDockCollapsed(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-800/90 border border-white/10 rounded-l flex items-center justify-center hover:bg-slate-700 transition-colors z-20"
              title="Expand Ops Copilot"
            >
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
          )}

          {/* Bottom Dock (minimal, fixed height) */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-20"
            style={{ 
              height: bottomDockHeight,
              right: rightDockWidth 
            }}
          >
            {bottomDock}
          </div>
        </div>
      </div>
    </div>
  );
}
