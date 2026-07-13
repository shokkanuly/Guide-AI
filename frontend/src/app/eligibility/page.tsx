"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trophy, HelpCircle, AlertCircle, ArrowRight, CheckCircle2, Bookmark } from "lucide-react";
import Link from "next/link";

interface ProgramSummary {
  id: string;
  slug: string;
  title: string;
  organization: string;
  category: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
  deadline?: string;
  status: string;
  tags?: string[];
  official_url?: string;
  match_score: number;
}

interface EligibleProgram {
  program: ProgramSummary;
  match_score: number;
  match_reasons: string[];
  missing_criteria: string[];
  required_documents: string[];
}

export default function EligibilityPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [age, setAge] = useState<number | "">(user?.age || "");
  const [region, setRegion] = useState(user?.region || "Almaty");
  const [employmentStatus, setEmploymentStatus] = useState(user?.employment_status || "employed");
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">(user?.monthly_income || "");
  const [isStudent, setIsStudent] = useState(user?.is_student || false);
  const [hasFamily, setHasFamily] = useState(user?.has_family || false);
  const [familySize, setFamilySize] = useState<number>(user?.family_size || 1);
  const [isBusinessOwner, setIsBusinessOwner] = useState(user?.is_business_owner || false);
  const [interests, setInterests] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EligibleProgram[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [demoProfiles, setDemoProfiles] = useState<any[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const res = await api.get("/eligibility/demo-profiles");
        setDemoProfiles(res.data || []);
      } catch (e) {
        // Mock fallback if offline/no backend
        setDemoProfiles([
          {
            name: "Student (Aruzhan)",
            profile: { age: 20, region: "Almaty", employment_status: "unemployed", monthly_income: 45000, is_student: true, has_family: false, family_size: 1, is_business_owner: false, interests: ["education", "scholarship", "study"], language: "ru" }
          },
          {
            name: "Entrepreneur (Daniyar)",
            profile: { age: 27, region: "Astana", employment_status: "self_employed", monthly_income: 280000, is_student: false, has_family: false, family_size: 1, is_business_owner: true, interests: ["startup", "business", "it", "innovation"], language: "ru" }
          }
        ]);
      }
    };
    fetchDemos();
  }, []);

  const loadDemoProfile = (p: any) => {
    setAge(p.age);
    setRegion(p.region);
    setEmploymentStatus(p.employment_status);
    setMonthlyIncome(p.monthly_income);
    setIsStudent(p.is_student);
    setHasFamily(p.has_family);
    setFamilySize(p.family_size || 1);
    setIsBusinessOwner(p.is_business_owner);
    setInterests(p.interests ? p.interests.join(", ") : "");
  };

  const toggleDocChecked = (programId: string, docName: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [programId]: {
        ...(prev[programId] || {}),
        [docName]: !(prev[programId]?.[docName])
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || monthlyIncome === "") {
      setError("Please fill in all age and income details.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const interestsArray = interests
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const res = await api.post("/eligibility/check", {
        age: Number(age),
        region,
        employment_status: employmentStatus,
        monthly_income: Number(monthlyIncome),
        is_student: isStudent,
        has_family: hasFamily,
        family_size: Number(familySize),
        is_business_owner: isBusinessOwner,
        interests: interestsArray,
        language: language === "kz" ? "kz" : language,
      });

      setResults(res.data.results || []);
      setHasChecked(true);
    } catch (err: any) {
      setError("Eligibility check failed. Please check backend databases are initialized.");
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (programId: string) => {
    try {
      await api.post("/applications", {
        program_id: programId,
        notes: "Started from Eligibility Checker",
      });
      alert("Application Roadmap created! You can track it in your Dashboard.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start application.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white text-left">
            {t("eligibilityChecker")}
          </h1>
          <p className="text-sm text-text-secondary mt-1 text-left">
            {t("eligibilityDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 bg-bg-card border border-border-card rounded-3xl p-6 space-y-6 h-fit text-left">
            <h3 className="font-outfit font-bold text-lg text-white mb-2">{t("profileMetrics")}</h3>

            {demoProfiles.length > 0 && (
              <div className="space-y-2 border-b border-border-card/40 pb-4">
                <span className="text-[10px] font-bold text-emerald-light uppercase tracking-wider block">Load Demo Profile</span>
                <div className="flex flex-wrap gap-2">
                  {demoProfiles.map((dp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => loadDemoProfile(dp.profile)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-bg-dark hover:bg-emerald-primary/10 border border-border-card hover:border-emerald-primary/30 text-text-secondary hover:text-white transition-all font-semibold"
                    >
                      {dp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("age")}</label>
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="22"
                  className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("region")}</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
                >
                  <option value="Almaty">Almaty</option>
                  <option value="Astana">Astana</option>
                  <option value="Shymkent">Shymkent</option>
                  <option value="Karaganda">Karaganda</option>
                  <option value="Pavlodar">Pavlodar</option>
                  <option value="other">Other Region</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("monthlyIncome")}</label>
                <input
                  type="number"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="250000"
                  className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("employmentStatus")}</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
                >
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("socialStatus")}</label>
              
              <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
                />
                {t("isStudent")}
              </label>

              <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={isBusinessOwner}
                  onChange={(e) => setIsBusinessOwner(e.target.checked)}
                  className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
                />
                {t("ownsBusiness")}
              </label>

              <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={hasFamily}
                  onChange={(e) => setHasFamily(e.target.checked)}
                  className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
                />
                {t("hasFamily")}
              </label>
            </div>

            {hasFamily && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("familySize")}</label>
                <input
                  type="number"
                  min={1}
                  value={familySize}
                  onChange={(e) => setFamilySize(Number(e.target.value))}
                  className="block w-[80px] px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">{t("interests")}</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder={t("interestsPlaceholder")}
                className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary text-xs p-3.5 rounded-xl mt-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/45 text-white font-bold py-3.5 px-4 rounded-xl mt-6 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Trophy className="w-4.5 h-4.5" />
                  {t("evaluateGrants")}
                </>
              )}
            </button>
          </form>

          {/* Results list */}
          <div className="lg:col-span-7 space-y-6">
            {!hasChecked ? (
              <div className="bg-bg-card/50 border border-border-card border-dashed rounded-3xl p-16 text-center text-text-secondary h-full flex flex-col items-center justify-center">
                <Trophy className="w-12 h-12 text-text-muted mb-4" />
                <h4 className="font-outfit font-bold text-white mb-2">{t("awaitingMatching")}</h4>
                <p className="text-xs max-w-sm mx-auto">
                  {t("awaitingMatchingDesc")}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-bg-card border border-border-card rounded-3xl p-12 text-center text-text-secondary">
                <HelpCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h4 className="font-outfit font-bold text-white mb-2">{t("noGrantsTitle")}</h4>
                <p className="text-xs max-w-sm mx-auto">
                  {t("noGrantsDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-outfit font-bold text-lg text-white mb-2 flex items-center justify-between">
                  <span>{t("matchedGovPrograms")} ({results.length})</span>
                </h3>

                {results.map((item, idx) => (
                  <div key={idx} className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card space-y-4 text-left">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-bold text-[10px] px-2.5 py-0.5 rounded-lg">
                          {item.program.category}
                        </span>
                        <h4 className="font-bold text-base text-white mt-2">{item.program.title}</h4>
                        <p className="text-xs text-text-secondary mt-1">{item.program.organization}</p>
                      </div>
                      <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0">
                        {item.match_score}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-border-card/60">
                      {item.program.amount_max && (
                        <div>
                          <span className="text-[10px] text-text-muted block font-semibold">MAX AMOUNT</span>
                          <span className="text-white font-bold">{item.program.amount_max.toLocaleString()} {item.program.currency}</span>
                        </div>
                      )}
                      {item.program.deadline && (
                        <div>
                          <span className="text-[10px] text-text-muted block font-semibold">DEADLINE</span>
                          <span className="text-white font-bold">{new Date(item.program.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-white">{t("whyQualify")}</div>
                      <div className="grid gap-1">
                        {item.match_reasons.map((r, i) => (
                          <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-emerald-light">✓</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.missing_criteria.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-orange-primary">{t("missingCriteria")}</div>
                        <div className="grid gap-1">
                          {item.missing_criteria.map((m, i) => (
                            <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <span className="text-orange-primary">✕</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.next_steps && item.next_steps.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border-card/30">
                        <div className="text-xs font-bold text-white">Recommended Next Steps</div>
                        <div className="grid gap-1.5">
                          {item.next_steps.map((step, i) => (
                            <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <span className="text-emerald-light font-bold">{i + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.required_documents && item.required_documents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border-card/30">
                        <div className="text-xs font-bold text-white">Required Documents Checklist</div>
                        <div className="grid gap-2 mt-1">
                          {item.required_documents.map((doc, i) => {
                            const isChecked = !!checkedDocs[item.program.id]?.[doc];
                            return (
                              <label key={i} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer hover:text-white transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleDocChecked(item.program.id, doc)}
                                  className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-3.5 h-3.5"
                                />
                                <span className={isChecked ? "line-through text-text-muted" : ""}>
                                  {doc.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-card/60">
                      <button
                        onClick={() => createApplication(item.program.id)}
                        className="flex-1 bg-emerald-primary/10 hover:bg-emerald-primary/20 border border-emerald-primary/20 text-emerald-light font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {t("createRoadmap")}
                      </button>
                      {item.program.official_url && (
                        <a
                          href={item.program.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-border-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                        >
                          {t("officialSite")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
