"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, User, Briefcase, HelpCircle, Check, Loader2, ArrowRight, BookOpen, PiggyBank, ShieldCheck } from "lucide-react";
import { EconomicIndicator } from "@/lib/economy/api/mockData";
import { KAZAKHSTAN_CITIES } from "@/lib/economy/api/kazakhstanData";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/economy/LanguageContext";
import { translateCity } from "@/lib/economy/translations";

interface EconomicProfileProps {
  indicators: EconomicIndicator[];
  country: string;
  parentMode: boolean;
  userProfile?: any;
  onUpdateProfile?: (updates: any) => void;
}

const INTERESTS_LIST = [
  { id: "investing", label: "Investing & Stocks 📈" },
  { id: "education", label: "Study & University Costs 🎓" },
  { id: "budgeting", label: "Daily Budgeting & Saving 💰" },
  { id: "part-time", label: "Part-time Jobs & Career Start 💼" },
  { id: "gadgets", label: "Buying Tech/Big Purchases 📱" },
  { id: "business", label: "Starting a Business/SME 🚀" },
];

export function EconomicProfile({ indicators, country, parentMode, userProfile, onUpdateProfile }: EconomicProfileProps) {
  const { t, language } = useTranslation();
  const [age, setAge] = useState<string>("18");
  const [city, setCity] = useState<string>("almaty");
  const [income, setIncome] = useState<string>("80000");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["budgeting", "education"]);
  const [context, setContext] = useState<string>("");
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.age) setAge(userProfile.age);
      if (userProfile.city) setCity(userProfile.city);
      if (userProfile.income) setIncome(userProfile.income);
      if (userProfile.interests) setSelectedInterests(userProfile.interests);
      if (userProfile.context !== undefined) setContext(userProfile.context);
    }
  }, [userProfile]);

  // Load from localStorage on mount (fallback for guests)
  useEffect(() => {
    if (!userProfile) {
      const savedAge = localStorage.getItem("econpulse_profile_age");
      const savedCity = localStorage.getItem("econpulse_profile_city");
      const savedIncome = localStorage.getItem("econpulse_profile_income");
      const savedInterests = localStorage.getItem("econpulse_profile_interests");
      const savedContext = localStorage.getItem("econpulse_profile_context");
      const savedAdvice = localStorage.getItem("econpulse_profile_advice");

      if (savedAge) setAge(savedAge);
      if (savedCity) setCity(savedCity);
      if (savedIncome) setIncome(savedIncome);
      if (savedContext) setContext(savedContext);
      if (savedInterests) {
        try {
          setSelectedInterests(JSON.parse(savedInterests));
        } catch (_) {}
      }
      if (savedAdvice) {
        try {
          setAdvice(JSON.parse(savedAdvice));
        } catch (_) {}
      }
    }
  }, [userProfile]);

  const handleInterestToggle = (id: string) => {
    const updated = selectedInterests.includes(id)
      ? selectedInterests.filter((x) => x !== id)
      : [...selectedInterests, id];
    setSelectedInterests(updated);

    if (onUpdateProfile) {
      onUpdateProfile({ interests: updated });
    }
  };

  const getAdvice = async () => {
    setLoading(true);
    setError(null);

    // Save inputs
    if (onUpdateProfile) {
      onUpdateProfile({
        age,
        city,
        income,
        interests: selectedInterests,
        context,
      });
    } else {
      localStorage.setItem("econpulse_profile_age", age);
      localStorage.setItem("econpulse_profile_city", city);
      localStorage.setItem("econpulse_profile_income", income);
      localStorage.setItem("econpulse_profile_interests", JSON.stringify(selectedInterests));
      localStorage.setItem("econpulse_profile_context", context);
    }

    try {
      const res = await fetch("/api/profile-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(age),
          city: KAZAKHSTAN_CITIES.find(c => c.id === city)?.name || city,
          income: Number(income),
          interests: selectedInterests.map(i => INTERESTS_LIST.find(il => il.id === i)?.label || i),
          context,
          indicators,
          country,
          parentMode,
          language
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch advice");
      const data = await res.json();
      setAdvice(data);
      localStorage.setItem("econpulse_profile_advice", JSON.stringify(data));
    } catch (err) {
      setError("Unable to connect to Gemini AI. Showing offline recommendation.");
      // Fallback
      const mockResult = {
        personalOutlook: `Given you are ${age} in ${city}, inflation is affecting standard costs. Tenge savings should be placed in deposits rather than held in cash.`,
        actionPlan: [
          "Open a tenge deposit at a local bank to earn high interest rates (up to 14.75% current baseline).",
          "Focus on developing digital skills (IT, analytics) that command higher market premiums.",
          "Cut down on non-essential subscriptions and luxury items to build a protective buffer."
        ],
        inflationRiskMitigation: "Tenge inflation reduces the purchasing power of your money by ~8% annually. Keep your savings in active investments or student deposits that offset this decay."
      };
      setAdvice(mockResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Questionnaire Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-400">
              <User className="w-5 h-5" />
              {t("profile.title")}
            </CardTitle>
            <CardDescription>
              {parentMode 
                ? t("profile.descFamily")
                : t("profile.desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">{parentMode ? t("profile.labelAgeFamily") : t("profile.labelAge")}</Label>
              <Input
                id="age"
                type="number"
                min="12"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="bg-muted/40 border-border/60 text-sm"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">{t("profile.labelCity")}</Label>
              <Select value={city} onValueChange={(val) => { if (val) setCity(val); }}>
                <SelectTrigger className="bg-muted/40 border-border/60 text-sm">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {KAZAKHSTAN_CITIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {translateCity(c.id, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Income */}
            <div className="space-y-2">
              <Label htmlFor="income">{parentMode ? t("profile.labelIncomeFamily") : t("profile.labelIncome")}</Label>
              <div className="relative">
                <Input
                  id="income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="bg-muted/40 border-border/60 pl-4 pr-12 text-sm"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-muted-foreground">KZT</span>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2.5">
              <Label>{t("profile.labelGoals")}</Label>
              <div className="grid grid-cols-1 gap-2">
                {INTERESTS_LIST.map((item) => {
                  const isSelected = selectedInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleInterestToggle(item.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/10 border-blue-500/50 text-blue-300 font-medium"
                          : "bg-muted/20 border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t("profile.goals." + item.id)}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Context Board */}
            <div className="space-y-2">
              <Label htmlFor="profile-context">
                {parentMode ? t("profile.labelContextFamily") : t("profile.labelContext")}
              </Label>
              <textarea
                id="profile-context"
                rows={3}
                placeholder={parentMode 
                  ? t("profile.placeholderContextFamily")
                  : t("profile.placeholderContext")}
                value={context}
                onChange={(e) => {
                  setContext(e.target.value);
                  if (onUpdateProfile) onUpdateProfile({ context: e.target.value });
                }}
                className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs text-foreground focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none"
              />
            </div>

            <Button
              onClick={getAdvice}
              disabled={loading || selectedInterests.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("profile.statusGenerating")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("profile.buttonGenerate")}
                </>
              )}
            </Button>
            {error && <p className="text-xs text-amber-400 text-center">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Advice Display */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {advice ? (
            <motion.div
              key="advice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Outlook */}
              <Card className="bg-blue-950/20 border-blue-500/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-300 font-bold">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    {t("profile.titleOutlook")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed text-sm">
                  {advice.personalOutlook}
                </CardContent>
              </Card>

              {/* Action Plan */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-400 font-bold">
                    <PiggyBank className="w-5 h-5" />
                    {t("profile.titleActionPlan")}
                  </CardTitle>
                  <CardDescription>{t("profile.descActionPlan")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {advice.actionPlan && advice.actionPlan.map((action: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 items-start bg-muted/20 border border-border/30 rounded-xl p-3.5"
                    >
                      <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{action}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Inflation Advice */}
              <Card className="bg-red-950/15 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-400 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    {t("profile.titleDefense")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed text-sm">
                  {advice.inflationRiskMitigation}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[300px] border border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-card/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t("profile.placeholderTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("profile.placeholderDesc")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
