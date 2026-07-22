"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { EconomicIndicator } from "@/lib/economy/api/mockData";
import useSWR from "swr";

interface AiForecastProps {
  indicators: EconomicIndicator[];
  country: string;
}

type ForecastData = {
  outlook: string[];
  risks: string[];
  opportunities: string[];
};

const fetcher = async ([url, country, refresh]: [string, string, boolean?]) => {
  const queryParams = new URLSearchParams({ country });
  if (refresh) {
    queryParams.append("refresh", "true");
  }
  const res = await fetch(`${url}?${queryParams}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch forecast");
  }
  return res.json();
};

export function AiForecast({ indicators, country }: AiForecastProps) {
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // SWR Hook with 10-minute client deduplication TTL
  const { data: forecast, error: swrError, mutate, isValidating: loading } = useSWR<ForecastData>(
    indicators.length > 0 ? ["/api/forecast", country] : null,
    (key) => fetcher(key as [string, string]),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes cache
    }
  );

  // Cooldown timer effect
  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const timer = setTimeout(() => {
      setRefreshCooldown(c => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [refreshCooldown]);

  const handleRefresh = async () => {
    if (refreshCooldown > 0 || loading) return;

    setRefreshCooldown(60);

    try {
      await mutate(fetcher(["/api/forecast", country, true]), {
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      });
    } catch (e) {
      console.error("Manual refresh failed:", e);
    }
  };

  // Fallback offline mock forecast on error
  const fallbackForecast = useMemo(() => {
    const cpi = indicators.find(i => i.id === "inflation")?.currentValue ?? 3;
    const gdp = indicators.find(i => i.id === "gdp")?.currentValue ?? 2;
    const unemployment = indicators.find(i => i.id === "unemployment")?.currentValue ?? 5;
    return {
      outlook: [
        `Inflation in ${country} is tracking at ${cpi.toFixed(1)}% — central bank likely to hold rates steady over the next quarter.`,
        `GDP growth of ${gdp.toFixed(1)}% signals ${gdp > 2 ? "resilient" : "subdued"} economic momentum.`,
        `Labor market remains ${unemployment < 5 ? "tight" : "under pressure"} with unemployment at ${unemployment.toFixed(1)}%.`,
      ],
      risks: [
        "Global supply chain disruptions could reignite inflationary pressure.",
        "Geopolitical uncertainty may dampen business investment.",
      ],
      opportunities: [
        "Technology sector showing strong productivity gains.",
        "Consumer spending holding up despite high borrowing costs.",
      ],
    };
  }, [indicators, country]);

  const displayForecast = forecast || (swrError ? fallbackForecast : null);
  const displayError = swrError ? "Could not generate AI forecast. Using offline analysis." : null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">AI 3-Month Forecast</div>
              <div className="text-xs text-muted-foreground">Gemini analysis for {country}</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshCooldown > 0}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 flex items-center gap-1.5"
            title={refreshCooldown > 0 ? `Cooldown active (${refreshCooldown}s)` : "Refresh forecast"}
          >
            {refreshCooldown > 0 && (
              <span className="text-[10px] font-semibold text-amber-500">{refreshCooldown}s</span>
            )}
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading && !displayForecast ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 rounded-full bg-muted/40 animate-pulse" style={{ width: `${70 + i * 8}%` }} />
              ))}
            </motion.div>
          ) : displayForecast ? (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Outlook */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Outlook
                </div>
                <ul className="space-y-1.5">
                  {displayForecast.outlook.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <span className="text-blue-400/60 mt-0.5 shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Risks */}
                <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Risks
                  </div>
                  <ul className="space-y-1">
                    {displayForecast.risks.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                    <Lightbulb className="w-3 h-3" /> Opportunities
                  </div>
                  <ul className="space-y-1">
                    {displayForecast.opportunities.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {displayError && (
                <p className="text-xs text-amber-500/70 italic">{displayError}</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
