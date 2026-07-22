"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { RealIndicator } from "@/lib/economy/api/fetchRealData";
import { COUNTRIES, computeHealthScore } from "@/lib/economy/api/mockData";
import { EconomicChart } from "@/components/economy/charts/EconomicChart";
import { AiChat } from "@/components/economy/chat/AiChat";
import { Simulator } from "@/components/economy/simulator/Simulator";
import { HealthScore } from "@/components/economy/dashboard/HealthScore";
import { AiForecast } from "@/components/economy/dashboard/AiForecast";
import { DataSourceLegend } from "@/components/economy/dashboard/SourceBadge";
import { DataStatusBar } from "@/components/economy/dashboard/DataStatusBar";
import { LanguageProvider, useTranslation } from "@/lib/economy/LanguageContext";
import { useEconomyProfile } from "@/lib/economy/useEconomyProfile";
import { generatePersonalizedAdviceAction, generateReportAction } from "@/app/economy/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";

const CHART_CONFIG: Record<string, { type: "area" | "bar" | "line"; color: string }> = {
  inflation:    { type: "area",  color: "#ef4444" },
  unemployment: { type: "line",  color: "#f59e0b" },
  gdp:          { type: "bar",   color: "#10b981" },
  interest:     { type: "area",  color: "#8b5cf6" },
  confidence:   { type: "line",  color: "#06b6d4" },
  housing:      { type: "bar",   color: "#f472b6" },
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up")   return <TrendingUp   className="w-3 h-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return                       <Minus        className="w-3 h-3 text-slate-500" />;
}

const REGIONS = Array.from(new Set(COUNTRIES.map((c) => c.region)));

function adaptForComponents(indicators: RealIndicator[]) {
  return indicators.map((ind) => ({ ...ind, source: ind.source as any }));
}

const translateCountryName = (code: string, name: string, lang: string) => {
  const dict: Record<string, Record<string, string>> = {
    KAZ: { ru: "Казахстан", kk: "Қазақстан" },
    USA: { ru: "США", kk: "АҚШ" },
    RUS: { ru: "Россия", kk: "Ресей" },
    DEU: { ru: "Германия", kk: "Германия" },
    GBR: { ru: "Великобритания", kk: "Ұлыбритания" },
    FRA: { ru: "Франция", kk: "Франция" },
    CHN: { ru: "Китай", kk: "Қытай" },
    JPN: { ru: "Япония", kk: "Жапония" },
  };
  return dict[code]?.[lang] ?? name;
};

function EconomyDashboardContent() {
  const { t, language, setLanguage } = useTranslation();
  const econProfile = useEconomyProfile();

  const [country, setCountry]       = useState("KAZ");
  const [indicators, setIndicators] = useState<RealIndicator[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [parentMode, setParentMode] = useState(false);

  const [advice, setAdvice]               = useState<any>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError]     = useState<string | null>(null);
  const [reportDownloading, setReportDownloading] = useState(false);

  const fetchData = useCallback(async (c: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/economy/indicators?country=${c}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setIndicators(json.indicators ?? []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError("Could not load economic data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(country); }, [country, fetchData]);

  const fetchPersonalizedAdvice = useCallback(async (inds: RealIndicator[]) => {
    if (inds.length === 0) return;
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      const res = await generatePersonalizedAdviceAction(econProfile, inds, country, parentMode, language);
      setAdvice(res);
    } catch {
      setAdviceError("Failed to fetch economic advice.");
    } finally {
      setAdviceLoading(false);
    }
  }, [econProfile, country, parentMode, language]);

  useEffect(() => {
    if (indicators.length > 0) fetchPersonalizedAdvice(indicators);
  }, [indicators, fetchPersonalizedAdvice]);

  const processedIndicators = useMemo(() => indicators, [indicators]);
  const adapted = useMemo(() => adaptForComponents(processedIndicators), [processedIndicators]);

  const countryInfo  = COUNTRIES.find((c) => c.code === country);
  const countryLabel = countryInfo ? `${countryInfo.flag} ${translateCountryName(countryInfo.code, countryInfo.name, language)}` : country;

  const handleDownloadReport = useCallback(async () => {
    setReportDownloading(true);
    try {
      const res = await generateReportAction(econProfile, adapted, countryLabel);
      if (res.success) {
        const link = document.createElement("a");
        link.href = res.url;
        link.download = res.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert("Failed to export report.");
    } finally {
      setReportDownloading(false);
    }
  }, [econProfile, adapted, countryLabel]);

  const FREQ_LABEL: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
    simulated: "Estimated",
  };

  return (
    <div className="min-h-full text-foreground">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex-1">
          📊 EconPulse <span className="text-blue-400">Dashboard</span>
        </h1>

        {/* Language */}
        <Select value={language} onValueChange={(val) => { if (val) setLanguage(val as any); }}>
          <SelectTrigger className="w-[80px] bg-slate-800/60 border-slate-700/50 text-xs">
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase font-bold">{language}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">🇬🇧 EN</SelectItem>
            <SelectItem value="ru">🇷🇺 RU</SelectItem>
            <SelectItem value="kk">🇰🇿 KK</SelectItem>
          </SelectContent>
        </Select>

        {/* Parent mode */}
        <button
          onClick={() => setParentMode(!parentMode)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            parentMode
              ? "bg-purple-600/10 border-purple-500/40 text-purple-300"
              : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>👪</span>
          <span className="hidden md:inline">Parent Mode</span>
          <span className={`w-1.5 h-1.5 rounded-full ${parentMode ? "bg-purple-400 animate-pulse" : "bg-slate-600"}`} />
        </button>

        {lastUpdated && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastUpdated}</span>
          </div>
        )}

        <button
          onClick={() => fetchData(country)}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Country selector */}
        <Select value={country} onValueChange={(val) => { if (val) setCountry(val); }}>
          <SelectTrigger className="w-[140px] bg-slate-800/60 border-slate-700/50 text-sm">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {REGIONS.map((region) => (
              <SelectGroup key={region}>
                <SelectLabel className="text-xs">{region}</SelectLabel>
                {COUNTRIES.filter((c) => c.region === region).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-1 text-xs">
                      <span>{c.flag}</span>
                      <span>{translateCountryName(c.code, c.name, language)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Welcome banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-xs leading-relaxed text-blue-300 mb-6">
        <Sparkles className="w-5 h-5 shrink-0 text-blue-400 animate-pulse mt-0.5" />
        <div>
          <span className="font-bold">Welcome back, {econProfile.name}.</span>{" "}
          Your profile ({econProfile.age}yo · {econProfile.city} · {Number(econProfile.income).toLocaleString()} KZT/mo) is
          synced from your GovGuide account — no separate setup needed.
        </div>
      </div>

      <DataSourceLegend />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 mb-4">
          ⚠ {error}
        </div>
      )}

      {/* Stat tiles */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/20 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      ) : processedIndicators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
        >
          {processedIndicators.map((ind) => {
            const config = CHART_CONFIG[ind.id] ?? { color: "#3b82f6" };
            return (
              <div
                key={ind.id}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-3 flex flex-col justify-between h-[105px]"
                style={{ borderTop: `2px solid ${config.color}` }}
              >
                <div className="text-xs text-slate-400 font-semibold line-clamp-2">{ind.title}</div>
                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-lg font-bold" style={{ color: config.color }}>
                      {ind.currentValue.toFixed(ind.currentValue < 100 ? 1 : 0)}
                      <span className="text-sm font-normal text-slate-500">{ind.unit}</span>
                    </span>
                    <TrendIcon trend={ind.trend} />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${ind.isRealData ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-[9px] text-slate-500">{FREQ_LABEL[ind.dataFrequency]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Health score + forecast */}
      {!loading && processedIndicators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          <HealthScore indicators={adapted as any} country={countryLabel} />
          <AiForecast indicators={adapted as any} country={countryLabel} />
        </motion.div>
      )}

      {/* AI Personalized Roadmap */}
      <div className="rounded-3xl border border-blue-500/20 bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden p-6 relative mb-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Personal Economic Outlook
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tailored for {econProfile.age}yo in {econProfile.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadReport}
              disabled={reportDownloading || adviceLoading || !advice}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40 transition-colors"
            >
              {reportDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Export Report 📄</span>}
            </button>
          </div>
        </div>

        {adviceLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-sm text-slate-400">Generating your economic roadmap…</span>
          </div>
        ) : adviceError ? (
          <div className="text-center py-8 text-red-400 text-sm">{adviceError}</div>
        ) : advice ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Economic Outlook</h3>
                <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl">
                  {advice.personalOutlook}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Inflation Defense Strategy</h3>
                <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl">
                  {advice.inflationRiskMitigation}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tailored Action Items</h3>
              <div className="space-y-2">
                {advice.actionPlan?.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2.5 items-start p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 leading-normal">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">Loading economic analysis…</div>
        )}
      </div>

      {/* Status bar */}
      <DataStatusBar indicators={processedIndicators} loading={loading} />

      {/* Charts grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {processedIndicators.map((indicator, index) => {
            const config = CHART_CONFIG[indicator.id] ?? { type: "area", color: "#3b82f6" };
            return (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <EconomicChart
                  title={indicator.title}
                  description={indicator.description}
                  data={indicator.data}
                  unit={indicator.unit}
                  type={config.type}
                  color={config.color}
                  source={indicator.source as any}
                  isRealData={indicator.isRealData}
                  dataFrequency={indicator.dataFrequency}
                  lastPublished={indicator.lastPublished}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Simulator */}
      {!loading && processedIndicators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Simulator indicators={adapted as any} />
        </motion.div>
      )}

      {/* AI Chat */}
      <AiChat contextData={adapted} country={country} parentMode={parentMode} />
    </div>
  );
}

export default function EconomyPage() {
  return (
    <LanguageProvider>
      <EconomyDashboardContent />
    </LanguageProvider>
  );
}
