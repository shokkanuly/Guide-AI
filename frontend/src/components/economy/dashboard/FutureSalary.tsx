"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EconomicIndicator } from "@/lib/economy/api/mockData";
import { KAZAKHSTAN_PROFESSIONS } from "@/lib/economy/api/kazakhstanData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingUp, TrendingDown, DollarSign, Wallet, ShieldAlert, Award, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/economy/LanguageContext";
import { translateProfession, translateProfessionDesc } from "@/lib/economy/translations";
import { calculateSalaryProjection } from "@/lib/utils/calculations";

interface FutureSalaryProps {
  indicators: EconomicIndicator[];
  country: string;
  parentMode: boolean;
  userProfile?: any;
  onUpdateProfile?: (updates: any) => void;
}

export function FutureSalary({ indicators, country, parentMode, userProfile, onUpdateProfile }: FutureSalaryProps) {
  const { t, language } = useTranslation();
  const [professionId, setProfessionId] = useState<string>("software-engineer");
  const [customProfession, setCustomProfession] = useState<string>("");
  const [salary, setSalary] = useState<string>("350000");
  const [context, setContext] = useState<string>("");
  const [period, setPeriod] = useState<number>(5); // 5 or 10 years
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.salaryProfession) setProfessionId(userProfile.salaryProfession);
      if (userProfile.salaryValue) setSalary(userProfile.salaryValue);
      if (userProfile.salaryContext !== undefined) setContext(userProfile.salaryContext);
    }
  }, [userProfile]);

  // Load from local storage
  useEffect(() => {
    if (!userProfile) {
      const savedProf = localStorage.getItem("econpulse_salary_prof");
      const savedCustomProf = localStorage.getItem("econpulse_salary_custom");
      const savedSal = localStorage.getItem("econpulse_salary_val");
      const savedPeriod = localStorage.getItem("econpulse_salary_period");
      const savedContext = localStorage.getItem("econpulse_salary_context");
      const savedAdvice = localStorage.getItem("econpulse_salary_advice");

      if (savedProf) setProfessionId(savedProf);
      if (savedCustomProf) setCustomProfession(savedCustomProf);
      if (savedSal) setSalary(savedSal);
      if (savedPeriod) setPeriod(Number(savedPeriod));
      if (savedContext) setContext(savedContext);
      if (savedAdvice) {
        try {
          setAdvice(JSON.parse(savedAdvice));
        } catch (_) {}
      }
    }
  }, [userProfile]);

  const inflationRate = useMemo(() => {
    const infInd = indicators.find((i) => i.id === "inflation");
    return infInd ? infInd.currentValue : 8.4;
  }, [indicators]);

  const currencySymbol = useMemo(() => {
    return country === "KAZ" ? "₸" : "$";
  }, [country]);

  // Update default salary when profession changes
  useEffect(() => {
    if (professionId !== "custom") {
      const selected = KAZAKHSTAN_PROFESSIONS.find((p) => p.id === professionId);
      if (selected) {
        setSalary(selected.averageSalary.toString());
      }
    }
  }, [professionId]);

  const professionName = useMemo(() => {
    if (professionId === "custom") return customProfession || "Selected Profession";
    return KAZAKHSTAN_PROFESSIONS.find((p) => p.id === professionId)?.name.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim() || "Selected Profession";
  }, [professionId, customProfession]);

  // Calculations for graph
  const chartData = useMemo(() => {
    const s = Number(salary) || 200000;
    const rawData = calculateSalaryProjection(s, inflationRate, period);

    const decayKey = t("salary.legendDecay");
    const matchKey = t("salary.legendMatch");
    const targetKey = t("salary.legendTarget");

    return rawData.map(pt => ({
      name: `${pt.year}y`,
      [decayKey]: pt.realPurchasingPower,
      [matchKey]: pt.nominalNeeded,
      [targetKey]: pt.careerGrowth,
    }));
  }, [salary, inflationRate, period, t]);

  const decayKey = t("salary.legendDecay");
  const matchKey = t("salary.legendMatch");
  const targetKey = t("salary.legendTarget");

  const currentPowerFinal = Number(chartData[chartData.length - 1]?.[decayKey] ?? Number(salary));
  const decayPercentage = Math.round(((Number(salary) - currentPowerFinal) / Number(salary)) * 100);

  const calculateSalaryAdvice = async () => {
    setLoading(true);
    setError(null);

    if (onUpdateProfile) {
      onUpdateProfile({
        salaryProfession: professionId,
        salaryValue: salary,
        salaryContext: context
      });
    } else {
      localStorage.setItem("econpulse_salary_prof", professionId);
      localStorage.setItem("econpulse_salary_custom", customProfession);
      localStorage.setItem("econpulse_salary_val", salary);
      localStorage.setItem("econpulse_salary_period", period.toString());
      localStorage.setItem("econpulse_salary_context", context);
    }

    try {
      const res = await fetch("/api/salary-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: professionName,
          salary: Number(salary),
          period,
          inflation: inflationRate,
          context,
          country,
          parentMode,
          language
        }),
      });

      if (!res.ok) throw new Error("Failed to load salary roadmap");
      const data = await res.json();
      setAdvice(data);
      localStorage.setItem("econpulse_salary_advice", JSON.stringify(data));
    } catch (err) {
      setError("Unable to connect to Gemini AI. Showing offline recommendation.");
      const mockResult = {
        careerOutlook: `The profession of ${professionName} is highly subject to inflation rates in ${country}. Dynamic raises are essential to secure long term stability.`,
        purchasingPowerWarning: `At ${inflationRate}% inflation, your salary of ${salary} ${currencySymbol} will experience a ${decayPercentage}% loss in value over ${period} years.`,
        negotiationTips: [
          "Document your contributions (revenue earned, workload managed) before salary review.",
          "Target certifications or tools (AI assistance, cloud computing) that boost efficiency.",
          "Politely negotiate for an annual cost-of-living adjustment (COLA) indexed to the CPI inflation rate."
        ]
      };
      setAdvice(mockResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Parameters Panel */}
      <div className="xl:col-span-4 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-400">
              <DollarSign className="w-5 h-5" />
              {t("salary.title")}
            </CardTitle>
            <CardDescription>
              {t("salary.desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profession select */}
            <div className="space-y-2">
              <Label>{t("salary.labelProfession")}</Label>
              <Select value={professionId} onValueChange={(val) => { if (val) setProfessionId(val); }}>
                <SelectTrigger className="bg-muted/40 border-border/60 text-sm">
                  <SelectValue placeholder="Select Profession" />
                </SelectTrigger>
                <SelectContent>
                  {KAZAKHSTAN_PROFESSIONS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {translateProfession(p.id, language)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t("salary.labelCustomProf")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom profession input */}
            {professionId === "custom" && (
              <div className="space-y-2 animate-fadeIn">
                <Label htmlFor="custom-prof">{t("salary.labelCustomProf")}</Label>
                <Input
                  id="custom-prof"
                  type="text"
                  placeholder={t("salary.placeholderCustomProf")}
                  value={customProfession}
                  onChange={(e) => setCustomProfession(e.target.value)}
                  className="bg-muted/40 border-border/60 text-sm"
                />
              </div>
            )}

            {/* Current Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary">{t("salary.labelSalary", { currency: currencySymbol })}</Label>
              <div className="relative">
                <Input
                  id="salary"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="bg-muted/40 border-border/60 pr-12 text-sm"
                />
                <span className="absolute right-4 top-2 text-xs font-semibold text-muted-foreground">{currencySymbol}</span>
              </div>
            </div>

            {/* Projection Period */}
            <div className="space-y-3">
              <Label>{t("salary.labelPeriod")}</Label>
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => setPeriod(5)}
                  className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    period === 5 ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("salary.fiveYears")}
                </button>
                <button
                  onClick={() => setPeriod(10)}
                  className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    period === 10 ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("salary.tenYears")}
                </button>
              </div>
            </div>

            {/* Context Board */}
            <div className="space-y-2">
              <Label htmlFor="salary-context">{t("salary.labelContext")}</Label>
              <textarea
                id="salary-context"
                rows={3}
                placeholder={t("salary.placeholderContext")}
                value={context}
                onChange={(e) => {
                  setContext(e.target.value);
                  if (onUpdateProfile) onUpdateProfile({ salaryContext: e.target.value });
                }}
                className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs text-foreground focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none"
              />
            </div>

            {/* Micro economic context */}
            <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("salary.labelCurrentInflation")}:</span>
                <span className="text-foreground font-semibold">{inflationRate.toFixed(2)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("salary.textBasedOn")}{" "}{country === "KAZ" ? t("weekly.sourceNb") : country}.
              </p>
            </div>

            <Button
              onClick={calculateSalaryAdvice}
              disabled={loading || !salary}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("salary.statusAnalyzing")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("salary.buttonAnalyze")}
                </>
              )}
            </Button>
            {error && <p className="text-xs text-amber-400 text-center">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Chart & Analysis Panel */}
      <div className="xl:col-span-8 space-y-6">
        <Card className="bg-card/50 border-border/50 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-400">
              <Wallet className="w-5 h-5" />
              {t("salary.titleChart")}
            </CardTitle>
            <CardDescription>
              {t("salary.descChart")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("salary.calloutDecay")}</div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-red-400">
                    -{decayPercentage}% <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">{t("salary.calloutDecayValue", { decay: decayPercentage, period: period })}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("salary.calloutTarget")}</div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-emerald-400">
                    {Math.round(Number(chartData[chartData.length - 1]?.[targetKey] || 0)).toLocaleString()} {currencySymbol}
                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground"> {t("salary.calloutTargetValue")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart */}
            <div className="h-[280px] sm:h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "oklch(0.205 0 0)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(value) => [`${Number(value).toLocaleString()} ${currencySymbol}`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey={targetKey}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={matchKey}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={decayKey}
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Career Advice Section */}
        <AnimatePresence mode="wait">
          {advice && (
            <motion.div
              key="salary-advice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Outlook & Power Warning */}
              <div className="md:col-span-5 space-y-4">
                <Card className="bg-blue-950/20 border-blue-500/20 h-full">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-blue-300">
                      <Award className="w-4 h-4" />
                      {t("salary.titleOutlook")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <p>{advice.careerOutlook}</p>
                    <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 flex gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed text-red-300">
                        {advice.purchasingPowerWarning}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Negotiation tips */}
              <div className="md:col-span-7">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      {t("salary.titleAdviserPlan")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    {advice.negotiationTips && advice.negotiationTips.map((tip: string, idx: number) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <div className="w-5 h-5 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold text-emerald-400 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

