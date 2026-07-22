"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import {
  COUNTRIES,
  getAllCountryMetricValues,
  MapMetric,
} from "@/lib/economy/api/mockData";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Flame,
  Briefcase,
  BarChart2,
  Home,
} from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CODE_TO_ISO_NUM: Record<string, string> = {
  USA:"840", GBR:"826", DEU:"276", FRA:"250", JPN:"392",
  CHN:"156", IND:"356", BRA:"076", CAN:"124", AUS:"036",
  KOR:"410", MEX:"484", ZAF:"710", TUR:"792", SAU:"682",
  ARG:"032", IDN:"360", RUS:"643", ESP:"724", ITA:"380",
  KAZ:"398",
};
const ISO_NUM_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_ISO_NUM).map(([c, n]) => [n, c])
);

// ── Metric configuration ───────────────────────────────────────────────────

type MetricConfig = {
  label: string;
  unit: string;
  icon: React.ElementType;
  description: string;
  getColor: (v: number) => string;
  getRating: (v: number) => string;
  goodDirection: "low" | "high";
  legendSteps: { color: string; label: string }[];
};

const METRIC_CONFIG: Record<MapMetric, MetricConfig> = {
  inflation: {
    label: "Inflation",
    unit: "%",
    icon: Flame,
    description: "Annual CPI % change",
    goodDirection: "low",
    getColor: (v) =>
      v < 0  ? "#06b6d4" :
      v < 2  ? "#10b981" :
      v < 5  ? "#84cc16" :
      v < 10 ? "#f59e0b" :
      v < 30 ? "#f97316" : "#ef4444",
    getRating: (v) =>
      v < 0  ? "Deflation" :
      v < 2  ? "Below target" :
      v < 5  ? "On target" :
      v < 10 ? "Elevated" :
      v < 30 ? "High" : "Hyperinflation",
    legendSteps: [
      { color: "#06b6d4", label: "< 0% (deflation)" },
      { color: "#10b981", label: "0-2% (ideal)" },
      { color: "#84cc16", label: "2-5% (moderate)" },
      { color: "#f59e0b", label: "5-10% (elevated)" },
      { color: "#f97316", label: "10-30% (high)" },
      { color: "#ef4444", label: "> 30% (crisis)" },
    ],
  },
  gdp: {
    label: "GDP Growth",
    unit: "%",
    icon: BarChart2,
    description: "Real GDP annual %",
    goodDirection: "high",
    getColor: (v) =>
      v < -2 ? "#ef4444" :
      v < 0  ? "#f97316" :
      v < 1  ? "#f59e0b" :
      v < 3  ? "#84cc16" :
      v < 5  ? "#10b981" : "#059669",
    getRating: (v) =>
      v < -2 ? "Recession" :
      v < 0  ? "Contraction" :
      v < 1  ? "Stagnation" :
      v < 3  ? "Moderate" :
      v < 5  ? "Strong" : "Exceptional",
    legendSteps: [
      { color: "#ef4444", label: "< -2% (recession)" },
      { color: "#f97316", label: "-2–0% (contraction)" },
      { color: "#f59e0b", label: "0–1% (stagnation)" },
      { color: "#84cc16", label: "1–3% (moderate)" },
      { color: "#10b981", label: "3–5% (strong)" },
      { color: "#059669", label: "> 5% (exceptional)" },
    ],
  },
  unemployment: {
    label: "Unemployment",
    unit: "%",
    icon: Briefcase,
    description: "% of labor force",
    goodDirection: "low",
    getColor: (v) =>
      v < 3  ? "#10b981" :
      v < 5  ? "#84cc16" :
      v < 8  ? "#f59e0b" :
      v < 15 ? "#f97316" : "#ef4444",
    getRating: (v) =>
      v < 3  ? "Full employment" :
      v < 5  ? "Low" :
      v < 8  ? "Moderate" :
      v < 15 ? "High" : "Crisis",
    legendSteps: [
      { color: "#10b981", label: "< 3% (full employment)" },
      { color: "#84cc16", label: "3–5% (low)" },
      { color: "#f59e0b", label: "5–8% (moderate)" },
      { color: "#f97316", label: "8–15% (high)" },
      { color: "#ef4444", label: "> 15% (crisis)" },
    ],
  },
  housing: {
    label: "Housing",
    unit: "%",
    icon: Home,
    description: "Property price YoY %",
    goodDirection: "low",
    getColor: (v) =>
      v < 0  ? "#06b6d4" :
      v < 3  ? "#10b981" :
      v < 8  ? "#f59e0b" :
      v < 20 ? "#f97316" : "#ef4444",
    getRating: (v) =>
      v < 0  ? "Prices falling" :
      v < 3  ? "Stable" :
      v < 8  ? "Rising" :
      v < 20 ? "Rapid rise" : "Price surge",
    legendSteps: [
      { color: "#06b6d4", label: "< 0% (falling)" },
      { color: "#10b981", label: "0–3% (stable)" },
      { color: "#f59e0b", label: "3–8% (rising)" },
      { color: "#f97316", label: "8–20% (rapid)" },
      { color: "#ef4444", label: "> 20% (surge)" },
    ],
  },
};

// ── Anomaly detection ─────────────────────────────────────────────────────

type Anomaly = {
  code: string;
  name: string;
  flag: string;
  value: number;
  zScore: number;
  direction: "high" | "low";
  severity: "warning" | "critical";
};

function detectAnomalies(values: Record<string, number>): Anomaly[] {
  const entries = Object.entries(values);
  const vals = entries.map(([, v]) => v);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);

  return entries
    .map(([code, v]) => {
      const zScore = std > 0 ? (v - mean) / std : 0;
      const info = COUNTRIES.find(c => c.code === code);
      return {
        code,
        name: info?.name ?? code,
        flag: info?.flag ?? "🏳",
        value: v,
        zScore,
        direction: (zScore > 0 ? "high" : "low") as "high" | "low",
        severity: (Math.abs(zScore) > 2.5 ? "critical" : "warning") as "warning" | "critical",
      };
    })
    .filter(a => Math.abs(a.zScore) > 1.6)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, 6);
}

// ── Tooltip state ────────────────────────────────────────────────────────

type TooltipState = { x: number; y: number; code: string; name: string; flag: string; value: number; rating: string };

// ── Component ────────────────────────────────────────────────────────────

interface EconomicMapProps {
  selectedCountry: string;
  onCountrySelect: (code: string) => void;
}

export function EconomicMap({ selectedCountry, onCountrySelect }: EconomicMapProps) {
  const [activeMetric, setActiveMetric] = useState<MapMetric>("inflation");
  const [tooltip, setTooltip]           = useState<TooltipState | null>(null);
  const [aiAnalysis, setAiAnalysis]     = useState<string>("");
  const [aiLoading, setAiLoading]       = useState(false);

  const metricValues = useMemo(() => getAllCountryMetricValues(activeMetric), [activeMetric]);
  const anomalies    = useMemo(() => detectAnomalies(metricValues), [metricValues]);
  const config       = METRIC_CONFIG[activeMetric];

  // Stats
  const vals        = Object.values(metricValues);
  const mean        = vals.reduce((a, b) => a + b, 0) / vals.length;
  const max         = Math.max(...vals);
  const min         = Math.min(...vals);
  const maxCountry  = COUNTRIES.find(c => metricValues[c.code] === max);
  const minCountry  = COUNTRIES.find(c => metricValues[c.code] === min);

  // Auto AI analysis when metric changes
  const fetchAiAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const anomalySummary = anomalies
        .map(a => `${a.flag} ${a.name}: ${a.value.toFixed(1)}${config.unit} (${a.severity}, z=${a.zScore.toFixed(1)})`)
        .join("; ");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "Global",
          messages: [{
            role: "user",
            content: `Analyze these global ${config.label} anomalies across 20 countries. Global average: ${mean.toFixed(1)}${config.unit}. Range: ${min.toFixed(1)}–${max.toFixed(1)}${config.unit}. Outliers: ${anomalySummary}. Write 2-3 concise sentences explaining the most unusual findings and what they signal economically. Be direct and specific.`
          }],
          contextData: anomalies.map(a => ({ id: a.code, title: a.name, currentValue: a.value, unit: config.unit, trend: a.direction === 'high' ? 'up' : 'down', source: 'Estimated' })),
        }),
      });

      if (!res.ok) throw new Error();
      const ct = res.headers.get("content-type");
      if (ct?.includes("application/json")) {
        const d = await res.json();
        setAiAnalysis(d.message ?? d.error ?? "");
        return;
      }

      const reader  = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiAnalysis(text);
      }
    } catch {
      setAiAnalysis("AI analysis unavailable — check your Gemini API key.");
    } finally {
      setAiLoading(false);
    }
  }, [activeMetric, anomalies, config, mean, min, max]);

  useEffect(() => {
    const t = setTimeout(fetchAiAnalysis, 400);
    return () => clearTimeout(t);
  }, [activeMetric]);

  return (
    <div className="space-y-4">

      {/* ── Metric Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METRIC_CONFIG) as MapMetric[]).map((m) => {
          const cfg = METRIC_CONFIG[m];
          const Icon = cfg.icon;
          const active = m === activeMetric;
          return (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/20"
                  : "border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── Map Card ── */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {config.label} by Country
                </div>
                <div className="text-xs text-muted-foreground">{config.description} — click to explore</div>
              </div>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Avg <span className="text-foreground font-semibold">{mean.toFixed(1)}{config.unit}</span></span>
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {minCountry?.flag} {min.toFixed(1)}{config.unit}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {maxCountry?.flag} {max.toFixed(1)}{config.unit}
              </span>
            </div>
          </div>

          {/* Map */}
          <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.6)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMetric}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ComposableMap
                  projectionConfig={{ scale: 140, center: [0, 15] }}
                  style={{ width: "100%", height: "auto" }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const isoNum  = geo.id?.toString();
                        const code    = ISO_NUM_TO_CODE[isoNum];
                        const value   = code !== undefined ? metricValues[code] : undefined;
                        const isKnown = value !== undefined;
                        const isSelected = code === selectedCountry;
                        const fill    = isSelected ? "#60a5fa" : isKnown ? config.getColor(value!) : "#1e293b";

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            style={{
                              default: {
                                fill,
                                stroke: isSelected ? "#93c5fd" : "#0f172a",
                                strokeWidth: isSelected ? 1.5 : 0.4,
                                outline: "none",
                                cursor: isKnown ? "pointer" : "default",
                                filter: isSelected ? "drop-shadow(0 0 8px rgba(96,165,250,0.5))" : "none",
                                transition: "fill 0.3s ease",
                              },
                              hover: {
                                fill: isKnown ? (isSelected ? "#60a5fa" : "#38bdf8") : "#1e293b",
                                stroke: isKnown ? "#7dd3fc" : "#0f172a",
                                strokeWidth: 1,
                                outline: "none",
                                cursor: isKnown ? "pointer" : "default",
                              },
                              pressed: { outline: "none" },
                            }}
                            onMouseEnter={(evt) => {
                              if (!isKnown) return;
                              const info = COUNTRIES.find(c => c.code === code);
                              setTooltip({
                                x: evt.clientX, y: evt.clientY,
                                code: code!,
                                name: info?.name ?? code!,
                                flag: info?.flag ?? "🏳",
                                value: value!,
                                rating: config.getRating(value!),
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                            onMouseMove={(evt) => setTooltip(prev => prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null)}
                            onClick={() => { if (code) onCountrySelect(code); }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              </motion.div>
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: "fixed", left: tooltip.x + 14, top: tooltip.y - 48, pointerEvents: "none", zIndex: 9999 }}
                  className="bg-background/95 border border-border rounded-xl px-3 py-2.5 shadow-2xl backdrop-blur-sm min-w-[140px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tooltip.flag}</span>
                    <span className="font-semibold text-xs">{tooltip.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                    <span className="font-bold text-sm" style={{ color: config.getColor(tooltip.value) }}>
                      {tooltip.value.toFixed(1)}{config.unit}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">{tooltip.rating}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {config.legendSteps.map(step => (
              <div key={step.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-3 h-2 rounded-sm shrink-0" style={{ background: step.color }} />
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Anomaly Panel ── */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">AI Anomaly Detection</div>
                <div className="text-xs text-muted-foreground">
                  Countries with unusual {config.label.toLowerCase()} (statistical outliers)
                </div>
              </div>
            </div>
            <button
              onClick={fetchAiAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
              Re-analyze
            </button>
          </div>

          {/* Anomaly Cards */}
          {anomalies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {anomalies.map((a) => (
                <motion.button
                  key={a.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onCountrySelect(a.code)}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                    a.severity === "critical"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{a.flag}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      a.severity === "critical"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {a.severity}
                    </span>
                  </div>
                  <div className="font-semibold text-xs truncate">{a.name}</div>
                  <div className="font-bold text-lg leading-none" style={{ color: config.getColor(a.value) }}>
                    {a.value.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">{config.unit}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.getRating(a.value)} · {a.direction === "high" ? "↑" : "↓"} {Math.abs(a.zScore).toFixed(1)}σ from avg
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4 mb-4">
              ✓ No major outliers detected for {config.label.toLowerCase()} across tracked economies.
            </div>
          )}

          {/* AI Analysis */}
          <div className="rounded-xl bg-muted/20 border border-border/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">AI Economic Commentary</span>
            </div>
            {aiLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-3 rounded-full bg-muted/40 animate-pulse" style={{ width: `${60 + i * 12}%` }} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {aiAnalysis || "Click Re-analyze to generate AI commentary."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Country Flag Grid */}
      <div className="rounded-2xl border border-border/50 bg-card/30 p-4">
        <div className="text-xs text-muted-foreground mb-3 font-medium">All tracked economies</div>
        <div className="grid grid-cols-10 gap-1.5">
          {COUNTRIES.map(({ code, flag, name }) => {
            const val = metricValues[code];
            const isSelected = code === selectedCountry;
            return (
              <button
                key={code}
                onClick={() => onCountrySelect(code)}
                title={`${name}: ${val?.toFixed(1) ?? "?"}${config.unit}`}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
                  isSelected ? "ring-1 ring-blue-400 bg-blue-500/10" : "hover:bg-muted/40"
                }`}
              >
                <span className="text-base leading-none">{flag}</span>
                <div
                  className="w-full h-1 rounded-full mt-0.5"
                  style={{ background: val !== undefined ? config.getColor(val) : "#334155" }}
                />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
