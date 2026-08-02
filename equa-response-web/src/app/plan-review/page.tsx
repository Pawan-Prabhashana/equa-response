"use client";

import { motion } from "framer-motion";
import { CheckSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore } from "@/store/operationsStore";
import { useSystemSettings, hasPermission } from "@/store/systemSettings";
import { useState } from "react";

export default function PlanReviewPage() {
  const { proposedPlan, approvedPlan, rejectedPlans, approvePlan, rejectPlan } = useOperationsStore();
  const { role } = useSystemSettings();

  const [rejectRationale, setRejectRationale] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const canApprove = hasPermission(role, "OPERATOR");

  const handleApprove = () => {
    if (!proposedPlan || !canApprove) return;
    
    if (confirm("Approve this plan for execution?")) {
      approvePlan(proposedPlan.id, "Plan approved for execution", role);
    }
  };

  const handleReject = () => {
    if (!proposedPlan || !rejectRationale.trim()) {
      alert("Please provide a rationale for rejection");
      return;
    }

    rejectPlan(proposedPlan.id, rejectRationale, role);
    setRejectRationale("");
    setShowRejectDialog(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                <CheckSquare size={32} />
                PLAN REVIEW
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Governance · Approvals · Route Validation
              </p>
            </div>

            <div className="max-w-6xl space-y-6">
              {/* Proposed Plan */}
              {proposedPlan ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 backdrop-blur-xl border border-yellow-500/30 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        PENDING APPROVAL
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Plan ID: {proposedPlan.id}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created: {new Date(proposedPlan.ts).toLocaleString()}
                      </p>
                    </div>
                    <div className="px-4 py-2 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-bold">
                      AWAITING REVIEW
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase">Fairness (α)</div>
                      <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                        {proposedPlan.alpha.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase">Efficiency</div>
                      <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                        {proposedPlan.metrics.efficiencyScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase">Equity Variance</div>
                      <div className="text-2xl font-mono font-bold text-yellow-400 mt-1">
                        {proposedPlan.metrics.equityVariance.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase">Distance</div>
                      <div className="text-2xl font-mono font-bold text-slate-300 mt-1">
                        {proposedPlan.metrics.routeDistanceKm.toFixed(1)} km
                      </div>
                    </div>
                  </div>

                  {/* Constraints Triggered */}
                  {proposedPlan.constraintsTriggered.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-slate-300 mb-3">Constraints Triggered</h3>
                      <div className="flex flex-wrap gap-2">
                        {proposedPlan.constraintsTriggered.map((constraint, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-mono"
                          >
                            {constraint}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tradeoff Explanation */}
                  <div className="mb-6 p-4 rounded bg-cyan-500/10 border border-cyan-500/30">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Key Tradeoffs</h3>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>
                        • Higher alpha ({proposedPlan.alpha.toFixed(2)}) prioritizes equity over efficiency
                      </li>
                      <li>
                        • Equity variance of {proposedPlan.metrics.equityVariance.toFixed(2)} indicates{" "}
                        {proposedPlan.metrics.equityVariance < 5 ? "fair" : proposedPlan.metrics.equityVariance < 10 ? "moderate" : "high"}{" "}
                        wait time distribution
                      </li>
                      <li>
                        • Route optimizes for {proposedPlan.alpha > 0.5 ? "fairness" : "efficiency"} with{" "}
                        {proposedPlan.constraintsTriggered.length} constraints active
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={!canApprove}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                               bg-emerald-500/20 border border-emerald-500/30 text-emerald-400
                               hover:bg-emerald-500/30 hover:border-emerald-500/50
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all font-bold"
                    >
                      <CheckCircle size={18} />
                      Approve Plan
                    </button>
                    <button
                      onClick={() => setShowRejectDialog(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                               bg-red-500/20 border border-red-500/30 text-red-400
                               hover:bg-red-500/30 hover:border-red-500/50
                               transition-all font-bold"
                    >
                      <XCircle size={18} />
                      Reject Plan
                    </button>
                  </div>

                  {!canApprove && (
                    <div className="mt-3 text-xs text-orange-400 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      OPERATOR role required to approve plans
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-12 text-center"
                >
                  <CheckSquare size={48} className="mx-auto mb-4 text-slate-700" />
                  <p className="text-slate-500 mb-2">No proposed plan pending</p>
                  <p className="text-xs text-slate-600">
                    Run optimization in Logistics page to generate a plan for review
                  </p>
                </motion.div>
              )}

              {/* Approved Plan */}
              {approvedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 rounded-lg p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={20} className="text-emerald-400" />
                    <h2 className="text-lg font-bold text-emerald-400">APPROVED PLAN</h2>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500">Alpha</div>
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        {approvedPlan.alpha.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500">Efficiency</div>
                      <div className="text-lg font-mono font-bold text-cyan-400">
                        {approvedPlan.metrics.efficiencyScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500">Equity Var</div>
                      <div className="text-lg font-mono font-bold text-yellow-400">
                        {approvedPlan.metrics.equityVariance.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500">Distance</div>
                      <div className="text-lg font-mono font-bold text-slate-300">
                        {approvedPlan.metrics.routeDistanceKm.toFixed(1)} km
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Approved: {new Date(approvedPlan.ts).toLocaleString()}
                  </div>
                </motion.div>
              )}

              {/* Rejected Plans History */}
              {rejectedPlans.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                  <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">
                    Rejected Plans ({rejectedPlans.length})
                  </h2>
                  <div className="space-y-3">
                    {rejectedPlans.slice(0, 5).map((review) => (
                      <div
                        key={review.planId}
                        className="p-4 rounded bg-red-500/10 border border-red-500/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs text-red-400 font-bold">REJECTED</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {new Date(review.ts).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            by {review.reviewerRole}
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-300">
                          Rationale: {review.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reject Dialog */}
            {showRejectDialog && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 border border-red-500/30 rounded-lg p-6 w-full max-w-lg"
                >
                  <h2 className="text-lg font-bold text-red-400 mb-4">Reject Plan</h2>

                  <div className="mb-4">
                    <label className="block text-xs text-slate-400 mb-2">
                      Rationale (Required)
                    </label>
                    <textarea
                      value={rejectRationale}
                      onChange={(e) => setRejectRationale(e.target.value)}
                      rows={4}
                      placeholder="Explain why this plan is being rejected..."
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={!rejectRationale.trim()}
                      className="flex-1 px-4 py-2 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectDialog(false);
                        setRejectRationale("");
                      }}
                      className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
