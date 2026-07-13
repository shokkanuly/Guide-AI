"use client";

import React, { useState, useEffect, use } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Compass, CheckCircle2, Circle, Clock, ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  status: "pending" | "current" | "done";
  due_date?: string;
  action_url?: string;
}

interface ApplicationDetail {
  id: string;
  program_id: string;
  program_title: string;
  status: string;
  roadmap: RoadmapStep[];
  current_step: number;
  completion_pct: number;
  notes?: string;
  created_at: string;
}

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmapDetail = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setDetail(res.data);
    } catch (err) {
      setError("Failed to load roadmap details.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (stepNum: number, currentStatus: string) => {
    if (!detail) return;
    const newStatus = currentStatus === "done" ? "pending" : "done";
    try {
      const res = await api.put(`/applications/${id}/step`, {
        step: stepNum,
        status: newStatus
      });
      setDetail(res.data);
    } catch (err: any) {
      alert("Failed to update task: " + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchRoadmapDetail();
  }, [id]);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-bg-card hover:bg-bg-card-hover border border-border-card text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold font-outfit text-white">Application Roadmap</h1>
            <p className="text-xs text-text-secondary mt-0.5">Track and complete required tasks step by step</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary p-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-28 bg-bg-card/50 border border-border-card rounded-3xl animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-bg-card/30 border border-border-card rounded-2xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : detail && (
          <div className="space-y-8 text-left">
            {/* Header info */}
            <div className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card flex flex-col sm:flex-row justify-between gap-6">
              <div className="space-y-2">
                <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-bold text-[10px] px-2.5 py-0.5 rounded-lg uppercase">
                  Active Tracker
                </span>
                <h3 className="font-outfit font-bold text-xl text-white mt-2">{detail.program_title}</h3>
                <p className="text-xs text-text-secondary">Started: {new Date(detail.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-col justify-center items-end gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-text-secondary">Roadmap Progress</div>
                  <div className="text-2xl font-extrabold text-emerald-light mt-0.5">{detail.completion_pct}%</div>
                </div>
                <div className="w-32 bg-border-card rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-primary h-full" style={{ width: `${detail.completion_pct}%` }}></div>
                </div>
              </div>
            </div>

            {/* Step list */}
            <div className="bg-bg-card border border-border-card rounded-3xl p-6 md:p-8 space-y-6">
              <h4 className="font-outfit font-bold text-lg text-white mb-2 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-light" />
                Required Tasks List
              </h4>

              <div className="space-y-8 relative pl-4 border-l border-border-card/60 ml-3.5">
                {detail.roadmap.map((step) => {
                  const isDone = step.status === "done";
                  const isCurrent = step.status === "current" || step.step === detail.current_step + 1;
                  
                  return (
                    <div key={step.step} className="relative space-y-1.5 text-left">
                      <button
                        onClick={() => handleToggleStep(step.step, step.status)}
                        title="Toggle task status"
                        className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border transition-all cursor-pointer hover:scale-105 ${
                          isDone 
                            ? "bg-emerald-primary border-emerald-primary text-white"
                            : isCurrent
                            ? "bg-emerald-primary/10 border-emerald-primary text-emerald-light animate-pulse"
                            : "bg-bg-dark border-border-card text-text-muted hover:border-emerald-primary/50"
                        }`}
                      >
                        {isDone ? "✓" : step.step}
                      </button>

                      <div className="ml-2.5">
                        <h5 className={`font-bold text-sm ${
                          isDone ? "text-text-secondary line-through" : "text-white"
                        }`}>
                          {step.title}
                        </h5>
                        <p className="text-xs text-text-secondary leading-relaxed mt-1">{step.description}</p>
                        
                        {step.action_url && !isDone && (
                          <Link
                            href={step.action_url}
                            className="inline-flex items-center gap-1.5 text-emerald-light hover:underline text-[10px] font-bold mt-3"
                          >
                            Execute this task step →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
