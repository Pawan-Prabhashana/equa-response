"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  Send,
  Target
} from 'lucide-react';
import type { Recommendation } from '@/lib/opsCopilot';
import { getSeverityColor, getActionTypeLabel } from '@/lib/opsCopilot';

interface OpsCopilotPanelProps {
  recommendations: Recommendation[];
  onCreateMission?: (recommendation: Recommendation) => void;
  onSendAlert?: (recommendation: Recommendation) => void;
}

export default function OpsCopilotPanel({ 
  recommendations, 
  onCreateMission, 
  onSendAlert 
}: OpsCopilotPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={24} className="text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              OPS COPILOT
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">STANDBY MODE</div>
          </div>
        </div>

        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto mb-3 text-emerald-500/50" />
          <p className="text-sm text-slate-400">No critical recommendations</p>
          <p className="text-xs text-slate-500 mt-1">All systems nominal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-950/40">
        <Brain size={20} className="text-cyan-400 animate-pulse" />
        <div className="flex-1">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            OPS COPILOT
          </h2>
          <div className="text-[10px] text-slate-500 mt-0.5">{recommendations.length} RECOMMENDATIONS</div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {recommendations.map((rec, idx) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-lg border p-4 ${getSeverityColor(rec.severity)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getSeverityColor(rec.severity)}`}>
                      {rec.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {getActionTypeLabel(rec.actionType)}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">
                    {rec.title}
                  </h3>
                </div>
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                >
                  {expandedIds.has(rec.id) ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>
              </div>

              {/* Target */}
              {rec.target.areaName && (
                <div className="text-xs text-slate-300 mb-2">
                  📍 {rec.target.areaName}
                </div>
              )}

              {/* Collapsed: Show first rationale */}
              {!expandedIds.has(rec.id) && (
                <div className="text-xs text-slate-400 italic line-clamp-2">
                  {rec.rationale[0]}
                </div>
              )}

              {/* Expanded: Full details */}
              {expandedIds.has(rec.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-3"
                >
                  {/* Rationale */}
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                      WHY
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {rec.rationale.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence */}
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                      EVIDENCE
                    </div>
                    <div className="space-y-1">
                      {rec.evidence.map((e, i) => (
                        <div key={i} className="text-xs bg-slate-950/50 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-cyan-400">{e.type}</span>
                            <span className="text-slate-500 text-[10px]">
                              {new Date(e.ts).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-slate-300 mt-1">
                            {e.value} {e.unit || ''} <span className="text-slate-500">({e.source})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="font-mono font-bold text-emerald-400">{rec.confidence}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    {rec.suggestedMissions.length > 0 && (
                      <button
                        onClick={() => onCreateMission?.(rec)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all text-xs font-bold"
                      >
                        <Target size={12} />
                        Create Mission
                      </button>
                    )}
                    {rec.suggestedMessages.length > 0 && (
                      <button
                        onClick={() => onSendAlert?.(rec)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-all text-xs font-bold"
                      >
                        <Send size={12} />
                        Send Alert
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
