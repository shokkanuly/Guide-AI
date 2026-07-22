"use client";

import { motion } from "framer-motion";
import { computeHealthScore } from "@/lib/economy/api/mockData";
import { EconomicIndicator } from "@/lib/economy/api/mockData";

interface HealthScoreProps {
  indicators: EconomicIndicator[];
  country: string;
}

function getScoreColor(score: number) {
  if (score >= 70) return { stroke: "#10b981", text: "#10b981", label: "Strong", bg: "rgba(16,185,129,0.08)" };
  if (score >= 50) return { stroke: "#f59e0b", text: "#f59e0b", label: "Moderate", bg: "rgba(245,158,11,0.08)" };
  if (score >= 30) return { stroke: "#f97316", text: "#f97316", label: "Weak", bg: "rgba(249,115,22,0.08)" };
  return { stroke: "#ef4444", text: "#ef4444", label: "Critical", bg: "rgba(239,68,68,0.08)" };
}

const SUB_METRICS = [
  { id: "inflation", label: "Inflation", goodDirection: "down" },
  { id: "unemployment", label: "Employment", goodDirection: "down" },
  { id: "gdp", label: "Growth", goodDirection: "up" },
  { id: "interest", label: "Rates", goodDirection: "down" },
];

export function HealthScore({ indicators, country }: HealthScoreProps) {
  const cpi = indicators.find(i => i.id === "inflation")?.currentValue ?? 3;
  const unemployment = indicators.find(i => i.id === "unemployment")?.currentValue ?? 5;
  const gdp = indicators.find(i => i.id === "gdp")?.currentValue ?? 2;
  const interest = indicators.find(i => i.id === "interest")?.currentValue ?? 5;

  const score = computeHealthScore(cpi, unemployment, gdp, interest);
  const { stroke, text, label, bg } = getScoreColor(score);

  // SVG circle gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  const subScores = [
    { label: "Inflation", value: Math.max(0, 100 - Math.abs(cpi - 2) * 5) },
    { label: "Employment", value: Math.max(0, 100 - unemployment * 3) },
    { label: "Growth", value: Math.min(100, Math.max(0, 50 + gdp * 8)) },
    { label: "Rates", value: Math.max(0, 100 - Math.abs(interest - 4) * 4) },
  ];

  return (
    <div
      className="rounded-2xl border border-border/50 overflow-hidden"
      style={{ background: bg }}
    >
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Economic Health Score
        </div>
        <div className="flex items-center gap-6">
          {/* Circular Gauge */}
          <div className="relative flex-shrink-0">
            <svg width="130" height="130" viewBox="0 0 130 130">
              {/* Track */}
              <circle
                cx="65" cy="65" r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-border/40"
              />
              {/* Progress */}
              <motion.circle
                cx="65" cy="65" r={radius}
                fill="none"
                stroke={stroke}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ transformOrigin: "65px 65px", transform: "rotate(-90deg)" }}
              />
              {/* Score */}
              <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="bold" fill={text}>
                {score}
              </text>
              <text x="65" y="76" textAnchor="middle" fontSize="11" fill={text} opacity={0.8}>
                / 100
              </text>
            </svg>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg mb-1" style={{ color: text }}>{label}</div>
            <div className="text-sm text-muted-foreground mb-3">{country} economic conditions</div>
            <div className="space-y-2">
              {subScores.map((sub) => (
                <div key={sub.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{sub.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: stroke }}
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                    {Math.round(sub.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
