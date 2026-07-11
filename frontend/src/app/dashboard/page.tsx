"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { 
  Trophy, 
  FileText, 
  Bell, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ClipboardList
} from "lucide-react";

interface DashboardStats {
  user: {
    name: string;
    email: string;
    is_premium: boolean;
    profile_completeness: number;
  };
  stats: {
    applications_count: number;
    saved_programs: number;
    unread_notifications: number;
  };
}

interface ApplicationItem {
  id: string;
  program_id: string;
  program_title: string;
  status: string;
  completion_pct: number;
  current_step: number;
  created_at: string;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get("/users/me/dashboard"),
        api.get("/applications?limit=5"),
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data.data || []);
    } catch (err: any) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-white text-left">
              {t("welcome")}, {stats?.user.name || "User"}
            </h1>
            <p className="text-sm text-text-secondary mt-1 text-left">
              Here is your current government Navigator status
            </p>
          </div>
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 bg-emerald-primary hover:bg-emerald-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md shadow-emerald-primary/10"
          >
            <Sparkles className="w-4.5 h-4.5" />
            {t("newChat")}
          </Link>
        </div>

        {error && (
          <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary p-4 rounded-2xl text-sm text-left">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-bg-card/50 border border-border-card rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("activeRoadmaps")}</span>
                    <h3 className="text-4xl font-extrabold font-outfit text-white mt-1.5">{stats?.stats.applications_count}</h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-primary/10 text-emerald-light">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/dashboard" className="text-xs text-emerald-light hover:underline flex items-center gap-1 mt-4">
                  {t("viewRoadmaps")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("savedOpportunities")}</span>
                    <h3 className="text-4xl font-extrabold font-outfit text-white mt-1.5">{stats?.stats.saved_programs}</h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-primary/10 text-blue-primary">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/programs" className="text-xs text-blue-primary hover:underline flex items-center gap-1 mt-4">
                  {t("exploreGrants")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("profileCompleteness")}</span>
                    <h3 className="text-4xl font-extrabold font-outfit text-white mt-1.5">{stats?.user.profile_completeness}%</h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-primary/10 text-orange-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/profile" className="text-xs text-orange-primary hover:underline flex items-center gap-1 mt-4">
                  {t("completeProfile")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Application roadmaps & Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              <div className="lg:col-span-8 bg-bg-card border border-border-card rounded-3xl p-6 text-left">
                <div className="flex items-center justify-between border-b border-border-card/60 pb-4 mb-6">
                  <h3 className="font-outfit font-bold text-xl text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-emerald-light" />
                    {t("activeRoadmaps")}
                  </h3>
                  <Link href="/eligibility" className="text-xs text-text-secondary hover:text-emerald-light">{t("eligibilityChecker")} →</Link>
                </div>

                {applications.length === 0 ? (
                  <div className="py-12 text-center text-text-secondary space-y-4">
                    <p className="text-sm">You don't have any active application roadmaps yet.</p>
                    <Link
                      href="/eligibility"
                      className="inline-flex items-center gap-2 bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-primary/20 transition-all"
                    >
                      {t("evaluateGrants")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-bg-dark border border-border-card p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">{app.program_title}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                            <span>Status: <strong className="text-white uppercase text-[10px]">{app.status.replace("_", " ")}</strong></span>
                            <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-32 bg-border-card rounded-full h-2 relative overflow-hidden">
                            <div 
                              className="bg-emerald-primary h-full rounded-full transition-all duration-500" 
                              style={{ width: `${app.completion_pct}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-white w-8 text-right">{app.completion_pct}%</span>
                          <Link 
                            href={`/roadmap/${app.id}`} 
                            className="p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-emerald-light transition-colors"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6 text-left">
                <div className="bg-bg-card border border-border-card rounded-3xl p-6">
                  <h3 className="font-outfit font-bold text-lg text-white mb-4">{t("quickTools")}</h3>
                  <div className="space-y-3">
                    <Link href="/analyze" className="flex items-center gap-3 p-3.5 bg-bg-dark hover:bg-bg-card-hover border border-border-card rounded-2xl transition-all group">
                      <div className="w-9 h-9 rounded-xl bg-emerald-primary/10 text-emerald-light flex items-center justify-center font-bold">📄</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-light transition-colors">{t("analyzeDoc")}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5">{t("summaryRisks")}</div>
                      </div>
                    </Link>
                    <Link href="/search" className="flex items-center gap-3 p-3.5 bg-bg-dark hover:bg-bg-card-hover border border-border-card rounded-2xl transition-all group">
                      <div className="w-9 h-9 rounded-xl bg-blue-primary/10 text-blue-primary flex items-center justify-center font-bold">🔍</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-blue-primary transition-colors">{t("govSearch")}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5">{t("govSearchDesc")}</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {stats && stats.stats.unread_notifications > 0 && (
                  <div className="bg-emerald-primary/5 border border-emerald-primary/20 p-5 rounded-3xl flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-emerald-primary/10 text-emerald-light shrink-0">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-white">{t("newChat")}</h4>
                      <p className="text-xs text-text-secondary mt-1">
                        You have {stats.stats.unread_notifications} {stats.stats.unread_notifications > 1 ? t("unreadNotifs") : t("unreadNotif")}.
                      </p>
                      <Link href="/notifications" className="text-xs font-bold text-emerald-light hover:underline inline-flex items-center gap-0.5 mt-3">
                        {t("viewNotif")} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
