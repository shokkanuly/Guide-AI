"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EconomicIndicator } from "@/lib/economy/api/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, Landmark, ArrowRight, TrendingUp, TrendingDown, RefreshCw, Sparkles, HelpCircle, ShieldAlert, Play, Pause, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/economy/LanguageContext";

interface BeforeAfterModeProps {
  indicators: EconomicIndicator[];
  country: string;
  userProfile?: any;
  onUpdateProfile?: (updates: any) => void;
}

type ShockScenario = "rate-hike" | "oil-drop" | "tax-cut" | "supply-chain";

interface ScenarioConfig {
  id: ShockScenario;
  title: string;
  emoji: string;
  description: string;
  transmission: string;
  deltas: Record<string, number>; // absolute additions or subtractions
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "rate-hike",
    title: "Interest Rate Hike (+2.0%)",
    emoji: "🏦",
    description: "The National Bank increases the benchmark interest rate to curb rising consumer prices.",
    transmission: "Higher interest rates increase borrowing costs. Mortgages and business loans become more expensive. This cools down consumer spending and investment, which lowers inflation, but also slows down GDP growth and can cause a minor rise in unemployment as economic activity slows.",
    deltas: {
      inflation: -1.2,
      gdp: -0.7,
      unemployment: 0.4,
      interest: 2.0,
      confidence: -4.5,
    }
  },
  {
    id: "oil-drop",
    title: "Global Oil Price Crash (-25%)",
    emoji: "🛢️",
    description: "A sudden drop in global crude oil prices hits export revenues and weakens trade balances.",
    transmission: "As an oil-exporting economy, a crash in crude prices reduces national GDP and fiscal revenues. The national currency faces depreciation pressure, which drives up cost of imported goods (increasing inflation). Central banks often raise interest rates to protect the currency, further cooling domestic consumption and confidence.",
    deltas: {
      inflation: 1.8,
      gdp: -1.5,
      unemployment: 0.9,
      interest: 1.5,
      confidence: -12.0,
    }
  },
  {
    id: "tax-cut",
    title: "Income Tax Relief (-5%)",
    emoji: "💸",
    description: "The government implements a flat 5% reduction in personal income taxes to boost family budgets.",
    transmission: "Lower taxes put more money directly into households' pockets, boosting disposable incomes and consumer confidence. Spending increases, which accelerates GDP growth and drops unemployment. However, the surge in demand can lead to demand-pull inflation, prompting central banks to raise rates slightly.",
    deltas: {
      inflation: 1.4,
      gdp: 1.2,
      unemployment: -0.6,
      interest: 0.25,
      confidence: 8.5,
    }
  },
  {
    id: "supply-chain",
    title: "Import Supply Disruption (+15%)",
    emoji: "🚚",
    description: "Logistics and customs delays increase the cost of importing goods and components.",
    transmission: "Higher import transit costs push up the wholesale price of raw materials, electronics, and food products. Businesses pass these costs onto consumers, causing cost-push inflation. Because input prices rise, companies lower output, causing GDP growth to stall and unemployment to tick upwards.",
    deltas: {
      inflation: 2.4,
      gdp: -0.6,
      unemployment: 0.3,
      interest: 0.0,
      confidence: -5.0,
    }
  }
];

export function BeforeAfterMode({ indicators, country, userProfile, onUpdateProfile }: BeforeAfterModeProps) {
  const { t, language } = useTranslation();
  const [selectedScenarioId, setSelectedScenarioId] = useState<ShockScenario>("rate-hike");
  
  // Timer & progress states for auto-cycling scenarios every 20 seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  // User Context and AI advice state variables
  const [context, setContext] = useState<string>("");
  const [advice, setAdvice] = useState<any>(null);
  const [adviceLoading, setAdviceLoading] = useState<boolean>(false);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.simContext !== undefined) setContext(userProfile.simContext);
    }
  }, [userProfile]);

  // Load from local storage (guest mode fallback)
  useEffect(() => {
    if (!userProfile) {
      const savedContext = localStorage.getItem("econpulse_sim_context");
      if (savedContext) setContext(savedContext);
    }
  }, [userProfile]);

  const localizedScenarios = useMemo(() => {
    return SCENARIOS.map((sc) => ({
      ...sc,
      title: t(`simulator.scenarios.${sc.id}.title`) || sc.title,
      description: t(`simulator.scenarios.${sc.id}.desc`) || sc.description,
      transmission: t(`simulator.scenarios.${sc.id}.transmission`) || sc.transmission,
    }));
  }, [t]);

  const scenario = useMemo(() => {
    return localizedScenarios.find(s => s.id === selectedScenarioId)!;
  }, [selectedScenarioId, localizedScenarios]);

  // Fetch advice when scenario or context changes
  const fetchAdvice = async (scenarioId: string, currentContext: string) => {
    setAdviceLoading(true);
    try {
      const res = await fetch("/api/simulator-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioId,
          context: currentContext,
          profile: userProfile || {
            name: "Guest User",
            age: "18",
            city: "Almaty",
            income: "80000"
          },
          language
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdvice(data);
      }
    } catch (_) {
    } finally {
      setAdviceLoading(false);
    }
  };

  // Clear advice when scenario changes so they can run analysis on the new shock
  useEffect(() => {
    setAdvice(null);
  }, [selectedScenarioId]);

  // Auto-cycle timer interval (ticks every 200ms)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Time to cycle to next scenario
          setSelectedScenarioId((curr) => {
            const index = SCENARIOS.findIndex(s => s.id === curr);
            const nextIndex = (index + 1) % SCENARIOS.length;
            return SCENARIOS[nextIndex].id;
          });
          return 0;
        }
        return prev + 1; // 100 ticks of 200ms = 20 seconds
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);


  // Helper to extract baseline indicator currentValue
  const getBaseValue = (id: string) => {
    return indicators.find((ind) => ind.id === id)?.currentValue ?? 0;
  };

  const cpiBase = getBaseValue("inflation");
  const gdpBase = getBaseValue("gdp");
  const unempBase = getBaseValue("unemployment");
  const interestBase = getBaseValue("interest");
  const confBase = getBaseValue("confidence");

  // Calculate simulated values
  const simulated = useMemo(() => {
    const applyDelta = (base: number, delta: number, allowNegative = false) => {
      const result = base + delta;
      return allowNegative ? Number(result.toFixed(2)) : Number(Math.max(0, result).toFixed(2));
    };

    return {
      inflation: applyDelta(cpiBase, scenario.deltas.inflation),
      gdp: applyDelta(gdpBase, scenario.deltas.gdp, true),
      unemployment: applyDelta(unempBase, scenario.deltas.unemployment),
      interest: applyDelta(interestBase, scenario.deltas.interest),
      confidence: applyDelta(confBase, scenario.deltas.confidence),
    };
  }, [cpiBase, gdpBase, unempBase, interestBase, confBase, scenario]);

  const beforeKey = t("simulator.before");
  const afterKey = t("simulator.after");

  const comparisonData = useMemo(() => {
    return [
      { name: t("simulator.cpi"), [beforeKey]: cpiBase, [afterKey]: simulated.inflation },
      { name: t("simulator.gdp"), [beforeKey]: gdpBase, [afterKey]: simulated.gdp },
      { name: t("simulator.unemployment"), [beforeKey]: unempBase, [afterKey]: simulated.unemployment },
      { name: t("simulator.interest"), [beforeKey]: interestBase, [afterKey]: simulated.interest },
    ];
  }, [cpiBase, gdpBase, unempBase, interestBase, simulated, beforeKey, afterKey, t]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Scenario Picker and Explainer */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-blue-400">
                <Landmark className="w-5 h-5" />
                {t("simulator.title")}
              </CardTitle>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-muted-foreground hover:text-blue-400 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
            <CardDescription className="pt-2 text-xs sm:text-sm">
              {t("simulator.desc")}
            </CardDescription>
            {/* Auto-rotation Progress indicator */}
            {isPlaying && (
              <div className="w-full h-1 bg-muted/40 overflow-hidden rounded-full mt-3">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Pickers list */}
            <div className="space-y-2">
              <Label>{t("simulator.labelScenario")}</Label>
              <div className="grid grid-cols-1 gap-2">
                {localizedScenarios.map((sc) => {
                  const isSelected = sc.id === selectedScenarioId;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/10 border-blue-500/50 text-blue-300 font-semibold"
                          : "bg-muted/10 border-border/40 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-lg mt-0.5">{sc.emoji}</span>
                      <div>
                        <div>{sc.title}</div>
                        <p className="text-[10px] text-muted-foreground/75 font-normal mt-0.5">
                          {sc.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro economic brief */}
            <div className="border border-border/50 bg-muted/10 rounded-2xl p-4 mt-4 space-y-2 text-xs">
              <div className="font-semibold text-sm text-blue-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                {t("simulator.labelTransmission")}
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {scenario.transmission}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison results */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="bg-card/50 border-border/50 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-400">
                <Activity className="w-5 h-5" />
                {t("simulator.titleComp")}
              </span>
              <span className="text-xs bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full text-blue-300 font-medium">
                {t("simulator.labelScenario")}: {scenario.title.split(" (")[0]}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("simulator.descComp")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stat comparison cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Inflation */}
              <div className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-muted-foreground truncate font-medium">{t("simulator.cpi").split(" ")[0]}</div>
                <div className="flex items-center gap-1 mt-1.5 justify-between">
                  <span className="text-sm font-semibold line-through text-muted-foreground/50">{cpiBase}%</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-sm font-bold text-red-400">{simulated.inflation}%</span>
                </div>
                <span className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${scenario.deltas.inflation > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scenario.deltas.inflation > 0 ? '+' : ''}{scenario.deltas.inflation}%
                  {scenario.deltas.inflation > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                </span>
              </div>

              {/* GDP */}
              <div className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-muted-foreground truncate font-medium">{t("simulator.gdp").split(" ")[0]}</div>
                <div className="flex items-center gap-1 mt-1.5 justify-between">
                  <span className="text-sm font-semibold line-through text-muted-foreground/50">{gdpBase}%</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-sm font-bold text-emerald-400">{simulated.gdp}%</span>
                </div>
                <span className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${scenario.deltas.gdp >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {scenario.deltas.gdp >= 0 ? '+' : ''}{scenario.deltas.gdp}%
                  {scenario.deltas.gdp >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                </span>
              </div>

              {/* Unemployment */}
              <div className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-muted-foreground truncate font-medium">{t("simulator.unemployment").split(" ")[0]}</div>
                <div className="flex items-center gap-1 mt-1.5 justify-between">
                  <span className="text-sm font-semibold line-through text-muted-foreground/50">{unempBase}%</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-sm font-bold text-amber-400">{simulated.unemployment}%</span>
                </div>
                <span className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${scenario.deltas.unemployment > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scenario.deltas.unemployment > 0 ? '+' : ''}{scenario.deltas.unemployment}%
                  {scenario.deltas.unemployment > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                </span>
              </div>

              {/* Interest Rate */}
              <div className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-muted-foreground truncate font-medium">{t("simulator.interest").split(" ")[0]}</div>
                <div className="flex items-center gap-1 mt-1.5 justify-between">
                  <span className="text-sm font-semibold line-through text-muted-foreground/50">{interestBase}%</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-sm font-bold text-purple-400">{simulated.interest}%</span>
                </div>
                <span className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${scenario.deltas.interest > 0 ? 'text-red-400' : scenario.deltas.interest < 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {scenario.deltas.interest > 0 ? '+' : ''}{scenario.deltas.interest}%
                  {scenario.deltas.interest !== 0 && (scenario.deltas.interest > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
                </span>
              </div>

              {/* Consumer Confidence */}
              <div className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-muted-foreground truncate font-medium">{t("simulator.confidence")}</div>
                <div className="flex items-center gap-1 mt-1.5 justify-between">
                  <span className="text-sm font-semibold line-through text-muted-foreground/50">{confBase.toFixed(0)}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-sm font-bold text-cyan-400">{simulated.confidence.toFixed(0)}</span>
                </div>
                <span className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${scenario.deltas.confidence >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {scenario.deltas.confidence >= 0 ? '+' : ''}{scenario.deltas.confidence}
                  {scenario.deltas.confidence >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                </span>
              </div>
            </div>

            {/* Comparison Charts */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.205 0 0)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(value) => [`${value}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey={beforeKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={afterKey} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Simulator Context Board & AI Advice */}
        <Card className="bg-card/50 border-border/50 shadow-xl overflow-hidden mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
              <Sparkles className="w-5 h-5" />
              {t("simulator.titleContextBoard")}
            </CardTitle>
            <CardDescription>
              {t("simulator.descContextBoard")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              id="sim-context"
              rows={3}
              placeholder={t("simulator.placeholderContextBoard")}
              value={context}
              onChange={(e) => {
                setContext(e.target.value);
                if (onUpdateProfile) onUpdateProfile({ simContext: e.target.value });
                localStorage.setItem("econpulse_sim_context", e.target.value);
              }}
              className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs text-foreground focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none"
            />

            {/* AI Simulation Advice */}
            <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm font-semibold text-blue-400">{t("simulator.titleAiAnalysis")}</span>
                {adviceLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
              </div>
              
              {advice ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{t("simulator.labelImpactRating")}:</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      advice.impactRating === "Positive" ? "bg-emerald-500/10 text-emerald-400" :
                      advice.impactRating === "Negative" ? "bg-red-500/10 text-red-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {advice.impactRating === "Positive" ? t("simulator.ratingPositive") : advice.impactRating === "Negative" ? t("simulator.ratingNegative") : t("simulator.ratingNeutral")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {advice.personalImpact}
                  </p>
                  {advice.actionTip && (
                    <div className="text-[11px] text-blue-300 bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5 mt-2">
                      <span className="font-bold">{t("simulator.textPrepTip")}:</span> {advice.actionTip}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground italic">
                    {adviceLoading 
                      ? t("simulator.statusAnalyzing")
                      : t("simulator.textFillContext")}
                  </p>
                  {!adviceLoading && (
                    <Button
                      onClick={() => fetchAdvice(selectedScenarioId, context)}
                      className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold py-2 rounded-lg cursor-pointer transition-all"
                    >
                      {t("simulator.buttonAnalyze")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
