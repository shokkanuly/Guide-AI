"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FileUp, 
  Bot, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  ListOrdered,
  FileText, 
  ArrowRight,
  TrendingUp,
  Bookmark
} from "lucide-react";

interface DateItem {
  label: string;
  date: string;
  note?: string;
}

interface RequiredDocItem {
  name: string;
  description: string;
  where_to_get?: string;
}

interface ActionStepItem {
  step: number;
  title: string;
  description: string;
}

interface KeyAmountItem {
  label: string;
  value: string;
  note?: string;
}

interface SourceItem {
  title: string;
  url?: string;
  organization?: string;
}

interface AnalysisResult {
  summary: string;
  document_type: string;
  language: string;
  advantages: string[];
  disadvantages: string[];
  risks: string[];
  important_dates: DateItem[];
  required_documents: RequiredDocItem[];
  action_plan: ActionStepItem[];
  sources: SourceItem[];
  key_amounts?: KeyAmountItem[];
  eligibility_summary?: string;
  confidence_score?: number;
}

export default function DocumentAnalyzerPage() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "actions" | "docs" | "dates">("summary");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/analyze/document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setAnalysis(res.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Document analysis failed. Please verify OpenAI API configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white text-left">
            {t("documentAnalyzer")}
          </h1>
          <p className="text-sm text-text-secondary mt-1 text-left">
            {t("docAnalyzerDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-card border border-border-card rounded-3xl p-6 glow-card">
              <h3 className="font-outfit font-bold text-lg text-white mb-4 text-left">{t("uploadDoc")}</h3>
              
              <div className="border-2 border-dashed border-border-card hover:border-emerald-primary/40 rounded-2xl p-8 text-center transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileUp className="w-10 h-10 text-text-secondary mx-auto mb-4" />
                <span className="text-sm font-semibold text-white block">
                  {file ? file.name : t("selectPdf")}
                </span>
                <span className="text-[10px] text-text-muted mt-2 block">
                  {t("pdfLimit")}
                </span>
              </div>

              {error && (
                <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary text-xs p-3.5 rounded-xl mt-4 text-left flex items-start gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/45 text-white font-bold py-3.5 px-4 rounded-xl mt-6 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("analyzingDoc")}
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    {t("runAnalysis")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="bg-bg-card border border-border-card rounded-3xl p-16 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-emerald-light animate-spin mx-auto" />
                <h4 className="font-outfit font-bold text-lg text-white">{t("analyzingGovDoc")}</h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  {t("aiProcessing")}
                </p>
              </div>
            ) : !analysis ? (
              <div className="bg-bg-card/50 border border-border-card border-dashed rounded-3xl p-16 text-center text-text-secondary">
                <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h4 className="font-outfit font-bold text-white mb-2">{t("noDocTitle")}</h4>
                <p className="text-xs max-w-sm mx-auto">
                  {t("noDocDesc")}
                </p>
              </div>
            ) : (
              <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden flex flex-col">
                {/* Result Tabs */}
                <div className="flex bg-bg-dark/40 border-b border-border-card">
                  {(["summary", "actions", "docs", "dates"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 text-center py-4 text-xs uppercase font-bold tracking-wider transition-all border-b-2 ${
                        activeTab === tab
                          ? "border-emerald-primary text-emerald-light bg-bg-card"
                          : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
                      }`}
                    >
                      {tab === "summary" ? t("summaryTab") : tab === "actions" ? t("actionsTab") : tab === "docs" ? t("docsTab") : t("datesTab")}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-6 md:p-8 space-y-6 text-left">
                  {activeTab === "summary" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light mb-2">{t("overview")}</h4>
                        <p className="text-sm leading-relaxed text-text-primary">{analysis.summary}</p>
                      </div>

                      {analysis.eligibility_summary && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light mb-2">{t("whoQualifies")}</h4>
                          <p className="text-sm leading-relaxed text-text-primary">{analysis.eligibility_summary}</p>
                        </div>
                      )}

                      {analysis.key_amounts && analysis.key_amounts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light mb-3">{t("keyFinancials")}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analysis.key_amounts.map((amt, idx) => (
                              <div key={idx} className="bg-bg-dark border border-border-card p-4 rounded-2xl">
                                <span className="text-[10px] text-text-secondary block font-semibold uppercase">{amt.label}</span>
                                <span className="text-xl font-extrabold text-white mt-1 block">{amt.value}</span>
                                {amt.note && <span className="text-[10px] text-text-muted mt-1 block">{amt.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            {t("keyAdvantages")}
                          </h4>
                          <ul className="space-y-2 text-xs text-text-secondary">
                            {analysis.advantages.map((adv, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-light shrink-0">✓</span>
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-primary flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            {t("risksReqs")}
                          </h4>
                          <ul className="space-y-2 text-xs text-text-secondary">
                            {[...(analysis.disadvantages || []), ...(analysis.risks || [])].map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-orange-primary shrink-0">⚠️</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "actions" && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light flex items-center gap-1.5 mb-2">
                        <ListOrdered className="w-4.5 h-4.5" />
                        {t("recommendedActions")}
                      </h4>
                      <div className="space-y-6 relative pl-4 border-l border-border-card/60 ml-3.5">
                        {analysis.action_plan.map((step, idx) => (
                          <div key={idx} className="relative space-y-1">
                            <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-emerald-primary text-white text-xs font-bold flex items-center justify-center">
                              {step.step || idx + 1}
                            </div>
                            <h5 className="font-bold text-sm text-white ml-2">{step.title}</h5>
                            <p className="text-xs text-text-secondary ml-2 leading-relaxed">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "docs" && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light flex items-center gap-1.5 mb-2">
                        <Bookmark className="w-4.5 h-4.5" />
                        {t("requiredChecklist")}
                      </h4>
                      {analysis.required_documents.length === 0 ? (
                        <p className="text-xs text-text-secondary">{t("noDocsListed")}</p>
                      ) : (
                        <div className="grid gap-4">
                          {analysis.required_documents.map((doc, idx) => (
                            <div key={idx} className="bg-bg-dark border border-border-card p-4.5 rounded-2xl space-y-2">
                              <h5 className="font-bold text-sm text-white">{doc.name}</h5>
                              <p className="text-xs text-text-secondary leading-relaxed">{doc.description}</p>
                              {doc.where_to_get && (
                                <div className="text-[10px] text-text-muted mt-2">
                                  Where to get: <strong className="text-text-secondary">{doc.where_to_get}</strong>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "dates" && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-light flex items-center gap-1.5 mb-2">
                        <Calendar className="w-4.5 h-4.5" />
                        {t("importantDates")}
                      </h4>
                      {analysis.important_dates.length === 0 ? (
                        <p className="text-xs text-text-secondary">{t("noDeadlines")}</p>
                      ) : (
                        <div className="grid gap-4">
                          {analysis.important_dates.map((date, idx) => (
                            <div key={idx} className="bg-bg-dark border border-border-card p-4 rounded-2xl flex items-center justify-between gap-4">
                              <div>
                                <h5 className="font-bold text-sm text-white">{date.label}</h5>
                                {date.note && <p className="text-[10px] text-text-secondary mt-1">{date.note}</p>}
                              </div>
                              <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-bold text-xs px-3 py-1 rounded-lg shrink-0">
                                {date.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* References bottom bar */}
                  {analysis.sources && analysis.sources.length > 0 && (
                    <div className="border-t border-border-card/60 pt-6 mt-6">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">{t("officialCitations")}</h5>
                      <div className="flex flex-wrap gap-3">
                        {analysis.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-bg-dark hover:bg-bg-card-hover border border-border-card px-3.5 py-2 rounded-xl text-xs text-text-secondary hover:text-emerald-light transition-all flex items-center gap-2"
                          >
                            <span>{src.organization || "Gov source"}</span>
                            <span className="text-[10px] text-white font-bold">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
