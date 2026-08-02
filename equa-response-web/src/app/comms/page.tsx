"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore, type CommsAudience } from "@/store/operationsStore";

export default function CommsPage() {
  const { templates, commsLog, sendMessage } = useOperationsStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(templates[0] || null);
  const [audience, setAudience] = useState<CommsAudience>("DISTRICT");
  const [language, setLanguage] = useState<"EN" | "SI" | "TA" | "DE">("EN");
  const [recipients, setRecipients] = useState("");

  const handleSend = () => {
    if (!selectedTemplate || !recipients.trim()) {
      alert("Select template and enter recipients");
      return;
    }

    const body = selectedTemplate.bodyByLang[language] || selectedTemplate.bodyByLang["EN"] || "";
    
    sendMessage({
      channel: "SMS",
      audience,
      recipientsLabel: recipients,
      lang: language,
      renderedMessage: body,
      status: "SENT"
    });

    alert("Message sent successfully!");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                <MessageSquare size={32} />
                COMMS CONSOLE
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Broadcast · Templates · Multilingual Alerts · Log
              </p>
            </div>

            <div className="max-w-6xl grid grid-cols-2 gap-6">
              {/* Left: Compose */}
              <div className="space-y-4">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                  <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">Compose Message</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Template</label>
                      <select
                        value={selectedTemplate?.id || ""}
                        onChange={(e) => {
                          const tmpl = templates.find(t => t.id === e.target.value);
                          setSelectedTemplate(tmpl || null);
                        }}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Audience</label>
                        <select
                          value={audience}
                          onChange={(e) => setAudience(e.target.value as CommsAudience)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                        >
                          <option value="DISTRICT">District</option>
                          <option value="SHELTER">Shelter</option>
                          <option value="TOURISTS">Tourists</option>
                          <option value="AGENCY">Agency</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Language</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as "EN" | "SI" | "TA" | "DE")}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                        >
                          <option value="EN">English</option>
                          <option value="SI">Sinhala</option>
                          <option value="TA">Tamil</option>
                          <option value="DE">German</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Recipients</label>
                      <input
                        type="text"
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        placeholder="e.g., Kalutara District (3,500 contacts)"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                      />
                    </div>

                    {/* Preview */}
                    {selectedTemplate && (
                      <div className="p-4 rounded bg-slate-950/50 border border-cyan-500/30">
                        <div className="text-xs text-cyan-400 font-bold mb-2">PREVIEW</div>
                        <div className="text-xs text-slate-300 whitespace-pre-line">
                          {selectedTemplate.bodyByLang[language] || selectedTemplate.bodyByLang["EN"]}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSend}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                               bg-cyan-500/20 border border-cyan-500/30 text-cyan-400
                               hover:bg-cyan-500/30 hover:border-cyan-500/50
                               transition-all font-bold"
                    >
                      <Send size={18} />
                      Send Message
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Comms Log */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">
                  Comms Log ({commsLog.length})
                </h2>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {commsLog.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="mx-auto mb-3 text-slate-700" />
                      <p className="text-slate-500">No messages sent yet</p>
                    </div>
                  ) : (
                    commsLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded bg-slate-800/50 border border-slate-700/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                              entry.status === "SENT" ? "bg-emerald-500/20 text-emerald-400" :
                              entry.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {entry.status}
                            </div>
                            <div className="text-xs text-slate-500">{entry.channel}</div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(entry.ts).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          To: {entry.recipientsLabel} ({entry.audience})
                        </div>
                        <div className="text-xs text-slate-300">
                          {entry.renderedMessage.slice(0, 100)}...
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
