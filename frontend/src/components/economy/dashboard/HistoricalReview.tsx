"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistoricalData } from "@/lib/economy/api/historicalData";
import { useTranslation } from "@/lib/economy/LanguageContext";
import { COUNTRIES } from "@/lib/economy/api/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, Landmark, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface HistoricalReviewProps {
  country: string;
}

type MetricType = "inflation" | "interest" | "gdp";
type TimeframeType = "1Y" | "5Y" | "10Y";

export function HistoricalReview({ country }: HistoricalReviewProps) {
  const { t, language } = useTranslation();
  const [metric, setMetric] = useState<MetricType>("inflation");
  const [timeframe, setTimeframe] = useState<TimeframeType>("5Y");

  const countryInfo = COUNTRIES.find((c) => c.code === country);
  const countryName = countryInfo ? countryInfo.name : country;

  // Retrieve historical data
  const { data, description } = useMemo(() => {
    return getHistoricalData(country, metric, timeframe);
  }, [country, metric, timeframe]);

  // Color config matching dashboard
  const metricColor = {
    inflation: "#ef4444", // red
    interest: "#8b5cf6",  // purple
    gdp: "#10b981",       // emerald
  }[metric];

  const unit = metric === "gdp" || metric === "inflation" || metric === "interest" ? "%" : "";

  // Custom tooltip matchingEconomicChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-xl shadow-lg backdrop-blur-sm text-xs">
          <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColor }} />
            <span className="font-bold text-foreground">
              {payload[0].value}
              {unit}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Specific contextual notes for RU/KK/EN about US and KZ
  const getContextualNote = () => {
    const isKAZ = country === "KAZ";
    const isUSA = country === "USA";

    if (metric === "inflation") {
      if (isKAZ) {
        if (language === "ru") {
          return "Инфляция в Казахстане исторически испытывала шоки: в 2016 году из-за перехода к плавающему курсу тенге (рост до 14.6%), а также в 2022-2023 годах на фоне глобальных логистических сбоев и геополитической неопределенности (пик свыше 20%). В настоящее время инфляция постепенно снижается.";
        }
        if (language === "kk") {
          return "Қазақстандағы инфляция тарихи шоктарды бастан өткерді: 2016 жылы теңгенің еркін айналымына өтуіне байланысты (14.6%-ға дейін өсу), сондай-ақ 2022-2023 жылдары жаһандық логистикалық кідірістер мен геосаяси белгісіздік аясында (20%-дан астам пик). Қазіргі уақытта инфляция біртіндеп төмендеп келеді.";
        }
        return "Inflation in Kazakhstan historically faced shocks: in 2016 due to transition to floating tenge rate (spike to 14.6%), and in 2022-2023 driven by global logistics disruptions and geopolitical uncertainty (peaked over 20%). Inflation is currently cooling toward single digits.";
      }
      if (isUSA) {
        if (language === "ru") {
          return "Инфляция в США оставалась на уровне ниже 2% на протяжении почти десятилетия, однако резко возросла в 2021-2022 годах (достигнув 40-летнего пика в 9.1% в июне 2022 г.) из-за масштабных вливаний ликвидности в пандемию и кризиса поставок.";
        }
        if (language === "kk") {
          return "АҚШ-тағы инфляция он жыл бойы 2%-дан төмен деңгейде болды, бірақ пандемия кезіндегі ауқымды ликвидтілік пен жеткізілім дағдарысына байланысты 2021-2022 жылдары күрт өсті (2022 жылғы маусымда 9.1%-ға жетіп, 40 жылдық пик орнатты).";
        }
        return "US inflation remained below 2% for nearly a decade, but spiked dramatically in 2021-2022 (reaching a 40-year peak of 9.1% in June 2022) due to massive pandemic-era stimulus injections and supply chain blockages.";
      }
      return t("historical.inflationSummary");
    }

    if (metric === "interest") {
      if (isKAZ) {
        if (language === "ru") {
          return "Национальный Банк Республики Казахстан традиционно удерживает высокую базовую ставку (достигавшую 17% в 2016 г. и 16.75% в 2022-2023 гг.) для снижения инфляционного давления, сдерживания оттока капитала и защиты обменного курса тенге.";
        }
        if (language === "kk") {
          return "Қазақстан Республикасының Ұлттық Банкі инфляциялық қысымды азайту, капиталдың сыртқа жылыстауын тежеу және теңгенің айырбас бағамын қорғау үшін дәстүрлі түрде жоғары базалық мөлшерлемені (2016 жылы 17% және 2022-2023 жылдары 16.75%-ға жеткен) ұстап тұрады.";
        }
        return "The National Bank of Kazakhstan historically maintains a high base interest rate (reaching 17% in 2016 and 16.75% in 2022-2023) to cool down inflation expectations, prevent capital flight, and defend the tenge exchange rate.";
      }
      if (isUSA) {
        if (language === "ru") {
          return "ФРС США удерживала процентные ставки около нуля после пандемии (2020-2021 гг.). Для борьбы со всплеском инфляции регулятор провел самый агрессивный цикл ужесточения за последние 40 лет, подняв ставку до диапазона 5.25%-5.50%.";
        }
        if (language === "kk") {
          return "АҚШ ФРЖ пандемиядан кейін пайыздық мөлшерлемелерді нөлге жақын ұстады (2020-2021 жж.). Инфляцияның өсуімен күресу үшін реттеуші соңғы 40 жылдағы ең агрессивті қатаңдату циклін өткізіп, мөлшерлемені 5.25%-5.50% деңгейіне дейін көтерді.";
        }
        return "The US Federal Reserve held interest rates near zero post-pandemic (2020-2021). To combat surging inflation, the Fed executed the most aggressive tightening cycle in 40 years, raising rates to a target range of 5.25%-5.50%.";
      }
      return t("historical.interestSummary");
    }

    // GDP
    if (isKAZ) {
      if (language === "ru") {
        return "Экономический рост Казахстана сильно зависит от экспорта энергоресурсов (нефть, металлы). Падение ВВП в 2020 году (-2.6%) отражает пандемию и обвал нефтяного рынка. С тех пор ВВП восстановился и стабилизировался в пределах 4.0-5.0%.";
      }
      if (language === "kk") {
        return "Қазақстанның экономикалық өсімі энергия ресурстарының (мұнай, металдар) экспортына қатты тәуелді. 2020 жылғы ЖІӨ-нің төмендеуі (-2.6%) пандемия мен мұнай нарығының құлдырауын көрсетеді. Содан бері ЖІӨ қалпына келіп, 4.0-5.0% аралығында тұрақталды.";
      }
      return "Kazakhstan's economic growth is heavily dependent on commodity exports (oil, metals). The GDP contraction of -2.6% in 2020 reflects the pandemic lockdown and oil price collapse. Since then, growth rebounded and stabilized around 4.0-5.0%.";
    }
    if (isUSA) {
      if (language === "ru") {
        return "ВВП США продемонстрировал резкое падение во время карантина 2020 года (-2.2%), за которым последовал рекордный отскок в 2021 году (+5.7%). В 2024-2025 гг. американская экономика вошла в фазу умеренного, стабильного роста около 2.1%.";
      }
      if (language === "kk") {
        return "АҚШ ЖІӨ 2020 жылғы карантин кезінде күрт төмендеді (-2.2%), одан кейін 2021 жылы рекордтық көрсеткішпен қалпына келді (+5.7%). 2024-2025 жж. американдық экономика 2.1% шамасында қалыпты, тұрақты өсу кезеңіне өтті.";
      }
      return "US GDP experienced a sharp contraction during the 2020 lockdowns (-2.2%), followed by a record rebound in 2021 (+5.7%). In 2024-2025, the economy settled back to its long-term potential growth rate around 2.1%.";
    }
    return t("historical.gdpSummary");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Parameters Panel */}
      <div className="xl:col-span-4 space-y-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-400">
              <Clock className="w-5 h-5" />
              {t("historical.title")}
            </CardTitle>
            <CardDescription>{t("historical.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Metric Select */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("historical.labelMetric")}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
                  {[
                    { id: "inflation", label: t("historical.metricInflation") },
                    { id: "interest", label: t("historical.metricInterest") },
                    { id: "gdp", label: t("historical.metricGDP") },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetric(m.id as MetricType)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        metric === m.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Select */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("historical.labelPeriod")}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
                  {[
                    { id: "1Y", label: t("historical.period1Y").split(" ")[0] },
                    { id: "5Y", label: t("historical.period5Y").split(" ")[0] },
                    { id: "10Y", label: t("historical.period10Y").split(" ")[0] },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTimeframe(p.id as TimeframeType)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        timeframe === p.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.label === "1" ? "1Y" : p.label === "5" ? "5Y" : "10Y"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/10 p-3.5 flex flex-col gap-1.5 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-foreground mb-0.5">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span>{t("historical.cardTitle")}</span>
                </div>
                <p>{getContextualNote()}</p>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground/50 border-t border-border/20 pt-4 mt-6">
              Analyzing: <span className="font-semibold text-muted-foreground">{countryName}</span> ({country})
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Panel */}
      <div className="xl:col-span-8">
        <Card className="bg-card/50 border-border/50 shadow-xl overflow-hidden h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              {t("historical.chartTitle", {
                metric: t(`historical.metric${metric.charAt(0).toUpperCase() + metric.slice(1)}`),
                period: timeframe === "1Y" ? t("historical.period1Y") : timeframe === "5Y" ? t("historical.period5Y") : t("historical.period10Y"),
              })}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 w-full pt-4 min-h-[300px] sm:min-h-[360px] flex items-center">
            <div className="h-[280px] sm:h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}${unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={t("historical.legendValue")}
                    stroke={metricColor}
                    strokeWidth={3}
                    dot={{ r: timeframe === "10Y" ? 5 : 2, fill: metricColor, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
