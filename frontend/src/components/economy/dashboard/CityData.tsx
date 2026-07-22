"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KAZAKHSTAN_CITIES, CityEconomics } from "@/lib/economy/api/kazakhstanData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { MapPin, ArrowRightLeft, TrendingUp, Sparkles, Building, Coffee, Activity, Fuel, HelpCircle, Landmark, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/economy/LanguageContext";
import { translateCity } from "@/lib/economy/translations";
import { calculateCityBasket, calculateCostDifferencePercentage, calculateRelocationDelta } from "@/lib/utils/calculations";

interface CityDataProps {
  userProfile?: any;
}

export function CityData({ userProfile }: CityDataProps) {
  const { t, language } = useTranslation();
  const [cityAId, setCityAId] = useState<string>("almaty");
  const [cityBId, setCityBId] = useState<string>("astana");

  // Relocation Calculator State
  const [currentSalary, setCurrentSalary] = useState<string>("300000");
  const [targetSalary, setTargetSalary] = useState<string>("350000");

  // AI Advice states
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.city) setCityAId(userProfile.city);
      if (userProfile.income) setCurrentSalary(userProfile.income);
    }
  }, [userProfile]);

  const cityA = useMemo(() => KAZAKHSTAN_CITIES.find(c => c.id === cityAId)!, [cityAId]);
  const cityB = useMemo(() => KAZAKHSTAN_CITIES.find(c => c.id === cityBId)!, [cityBId]);

  const basketA = useMemo(() => calculateCityBasket(cityA), [cityA]);
  const basketB = useMemo(() => calculateCityBasket(cityB), [cityB]);

  // Fetch AI cost/relocation analysis
  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const priceDetailsText = `
      ${cityA.name} Prices: Rent: ${cityA.apartmentRent} KZT, Utilities: ${cityA.utilities} KZT, Transit: ${cityA.publicTransportPass} KZT, Milk: ${cityA.milkPrice} KZT, Bread: ${cityA.breadPrice} KZT, Gasoline: ${cityA.gasolinePrice} KZT
      ${cityB.name} Prices: Rent: ${cityB.apartmentRent} KZT, Utilities: ${cityB.utilities} KZT, Transit: ${cityB.publicTransportPass} KZT, Milk: ${cityB.milkPrice} KZT, Bread: ${cityB.breadPrice} KZT, Gasoline: ${cityB.gasolinePrice} KZT
      `;
      const res = await fetch("/api/city-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityA: cityA.name,
          cityB: cityB.name,
          salaryA: Number(currentSalary) || 200000,
          salaryB: Number(targetSalary) || 200000,
          basketA,
          basketB,
          disposableA: (Number(currentSalary) || 200000) - basketA,
          disposableB: (Number(targetSalary) || 200000) - basketB,
          priceDetails: priceDetailsText,
          userContext: userProfile?.context || "",
          language
        })
      });
      if (!res.ok) throw new Error("Failed to load analysis");
      const data = await res.json();
      setAiAdvice(data);
    } catch (_) {
      setError("AI analysis unavailable. Showing standard recommendation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdvice();
    }, 600); // debounce slightly
    return () => clearTimeout(timer);
  }, [cityAId, cityBId, currentSalary, targetSalary, userProfile]);

  const cityAName = translateCity(cityA.id, language).split(" ")[0];
  const cityBName = translateCity(cityB.id, language).split(" ")[0];

  // Comparison metrics for charts
  const barChartData = useMemo(() => {
    return [
      { name: t("city.rent"), [cityAName]: cityA.apartmentRent, [cityBName]: cityB.apartmentRent },
      { name: t("city.utilities"), [cityAName]: cityA.utilities, [cityBName]: cityB.utilities },
      { name: t("city.gym"), [cityAName]: cityA.gymMembership, [cityBName]: cityB.gymMembership },
      { name: t("city.transit"), [cityAName]: cityA.publicTransportPass, [cityBName]: cityB.publicTransportPass },
    ];
  }, [cityA, cityB, cityAName, cityBName, t]);

  const costDifferencePercentage = useMemo(() => {
    return calculateCostDifferencePercentage(basketA, basketB);
  }, [basketA, basketB]);

  // Relocation advice
  const relocationAnalysis = useMemo(() => {
    const curSal = Number(currentSalary) || 200000;
    const tarSal = Number(targetSalary) || 200000;

    const res = calculateRelocationDelta(curSal, basketA, tarSal, basketB);

    let recommendation = "";
    let colorClass = "";

    const nameA = translateCity(cityA.id, language);
    const nameB = translateCity(cityB.id, language);

    if (res.severity === "success") {
      recommendation = t("city.stronglyApproved", {
        cityA: nameA,
        cityB: nameB,
        salaryB: tarSal.toLocaleString(),
        diff: res.diffAbs.toLocaleString()
      });
      colorClass = "border-emerald-500/25 bg-emerald-500/5 text-emerald-300";
    } else if (res.severity === "danger") {
      recommendation = t("city.caution", {
        cityA: nameA,
        cityB: nameB,
        salaryB: tarSal.toLocaleString(),
        diff: res.diffAbs.toLocaleString()
      });
      colorClass = "border-red-500/25 bg-red-500/5 text-red-300";
    } else {
      recommendation = t("city.neutral", {
        diff: res.diff.toLocaleString()
      });
      colorClass = "border-blue-500/25 bg-blue-500/5 text-blue-300";
    }

    return {
      disposableA: res.disposableA,
      disposableB: res.disposableB,
      diff: res.diff,
      recommendation,
      colorClass,
      severity: res.severity,
    };
  }, [currentSalary, targetSalary, basketA, basketB, cityA, cityB, language, t]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* City comparison metrics selector */}
      <div className="xl:col-span-7 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-400">
                <MapPin className="w-5 h-5" />
                {t("city.title")}
              </span>
            </CardTitle>
            <CardDescription>
              {t("city.desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("city.labelCityA")}</Label>
                <Select value={cityAId} onValueChange={(val) => { if (val) setCityAId(val); }}>
                  <SelectTrigger className="bg-muted/40 border-border/60 text-sm">
                    <SelectValue placeholder="City A" />
                  </SelectTrigger>
                  <SelectContent>
                    {KAZAKHSTAN_CITIES.map((c) => (
                      <SelectItem key={c.id} value={c.id} disabled={c.id === cityBId}>
                        {translateCity(c.id, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("city.labelCityB")}</Label>
                <Select value={cityBId} onValueChange={(val) => { if (val) setCityBId(val); }}>
                  <SelectTrigger className="bg-muted/40 border-border/60 text-sm">
                    <SelectValue placeholder="City B" />
                  </SelectTrigger>
                  <SelectContent>
                    {KAZAKHSTAN_CITIES.map((c) => (
                      <SelectItem key={c.id} value={c.id} disabled={c.id === cityAId}>
                        {translateCity(c.id, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick summary card */}
            <div className="bg-muted/20 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("city.standardBasket")}</h4>
                <p className="text-xs text-muted-foreground max-w-md">
                  {t("city.basketIncludes")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">{t("city.basketDeltaPrefix")}</div>
                <div className={`text-base sm:text-lg font-bold ${Number(costDifferencePercentage) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {Math.abs(Number(costDifferencePercentage))}% {Number(costDifferencePercentage) > 0 ? t("city.basketDeltaExpensive") : t("city.basketDeltaCheaper")}
                </div>
              </div>
            </div>

            {/* Bar Chart comparing items */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${v / 1000}k ₸`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.205 0 0)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(value) => [`${Number(value).toLocaleString()} ₸`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey={cityAName} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={cityBName} fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Price list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border/40 bg-muted/10 rounded-2xl p-4 space-y-2.5">
                <div className="font-semibold text-sm flex items-center gap-1.5 text-blue-400">
                  <Landmark className="w-4 h-4" />
                  {translateCity(cityA.id, language)} {t("city.textPrices")}
                </div>
                <div className="grid grid-cols-2 text-xs gap-y-2">
                  <span className="text-muted-foreground">{t("city.avgSalary")}:</span>
                  <span className="font-semibold text-right">{cityA.averageSalary.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.rent")}:</span>
                  <span className="font-semibold text-right">{cityA.apartmentRent.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.milk")}:</span>
                  <span className="font-semibold text-right">{cityA.milkPrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.bread")}:</span>
                  <span className="font-semibold text-right">{cityA.breadPrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.gasoline")}:</span>
                  <span className="font-semibold text-right">{cityA.gasolinePrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.gym")}:</span>
                  <span className="font-semibold text-right">{cityA.gymMembership.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.totalBasket")}:</span>
                  <span className="font-bold text-right text-blue-300">{basketA.toLocaleString()} ₸</span>
                </div>
              </div>

              <div className="border border-border/40 bg-muted/10 rounded-2xl p-4 space-y-2.5">
                <div className="font-semibold text-sm flex items-center gap-1.5 text-purple-400">
                  <Landmark className="w-4 h-4" />
                  {translateCity(cityB.id, language)} {t("city.textPrices")}
                </div>
                <div className="grid grid-cols-2 text-xs gap-y-2">
                  <span className="text-muted-foreground">{t("city.avgSalary")}:</span>
                  <span className="font-semibold text-right">{cityB.averageSalary.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.rent")}:</span>
                  <span className="font-semibold text-right">{cityB.apartmentRent.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.milk")}:</span>
                  <span className="font-semibold text-right">{cityB.milkPrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.bread")}:</span>
                  <span className="font-semibold text-right">{cityB.breadPrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.gasoline")}:</span>
                  <span className="font-semibold text-right">{cityB.gasolinePrice} ₸</span>
                  <span className="text-muted-foreground">{t("city.gym")}:</span>
                  <span className="font-semibold text-right">{cityB.gymMembership.toLocaleString()} ₸</span>
                  <span className="text-muted-foreground">{t("city.totalBasket")}:</span>
                  <span className="font-bold text-right text-purple-300">{basketB.toLocaleString()} ₸</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Relocation optimizer calculator */}
      <div className="xl:col-span-5 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
              {t("city.titleCalc")}
            </CardTitle>
            <CardDescription>
              {t("city.descCalc", { cityA: translateCity(cityA.id, language), cityB: translateCity(cityB.id, language) })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Base Salary */}
              <div className="space-y-2">
                <Label htmlFor="base-salary">{t("city.labelSalaryA", { city: translateCity(cityA.id, language) })}</Label>
                <Input
                  id="base-salary"
                  type="number"
                  value={currentSalary}
                  onChange={(e) => setCurrentSalary(e.target.value)}
                  className="bg-muted/40 border-border/60 text-sm"
                />
              </div>

              {/* Target Salary */}
              <div className="space-y-2">
                <Label htmlFor="target-salary">{t("city.labelSalaryB", { city: translateCity(cityB.id, language) })}</Label>
                <Input
                  id="target-salary"
                  type="number"
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                  className="bg-muted/40 border-border/60 text-sm"
                />
              </div>
            </div>

            {/* Disposable Income comparison */}
            <div className="space-y-4 mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-semibold text-muted-foreground">{t("city.labelDisposable")}</h4>
              <p className="text-[10px] text-muted-foreground">
                {t("city.descDisposable")}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-center">
                  <div className="text-[10px] text-muted-foreground">{t("city.stayingIn", { city: translateCity(cityA.id, language) })}</div>
                  <div className={`text-sm sm:text-base font-bold ${relocationAnalysis.disposableA > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {relocationAnalysis.disposableA.toLocaleString()} ₸
                  </div>
                </div>

                <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-center">
                  <div className="text-[10px] text-muted-foreground">{t("city.movingTo", { city: translateCity(cityB.id, language) })}</div>
                  <div className={`text-sm sm:text-base font-bold ${relocationAnalysis.disposableB > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {relocationAnalysis.disposableB.toLocaleString()} ₸
                  </div>
                </div>
              </div>

              {/* Gemini AI Relocation Analysis Feedback */}
              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-sm font-semibold text-blue-400">{t("city.titleAiReport")}</span>
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
                </div>

                {aiAdvice ? (
                  <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground">{aiAdvice.analysis}</p>
                    <p>{aiAdvice.disposableIncomeOutlook}</p>
                    {aiAdvice.savingsTip && (
                      <div className="text-[11px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 mt-2">
                        <span className="font-bold">{t("city.transitionTip")}:</span> {aiAdvice.savingsTip}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-3 rounded-full bg-muted/40 animate-pulse" style={{ width: `${80 + i * 5}%` }} />
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-xl border p-4 text-xs leading-relaxed flex gap-2.5 ${relocationAnalysis.colorClass}`}>
                        <p>{relocationAnalysis.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
