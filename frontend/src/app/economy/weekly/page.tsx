"use client";

import { useEffect, useState, useCallback } from "react";
import { RealIndicator } from "@/lib/economy/api/fetchRealData";
import { WeeklyReport } from "@/components/economy/dashboard/WeeklyReport";
import { LanguageProvider } from "@/lib/economy/LanguageContext";
import { useEconomyProfile } from "@/lib/economy/useEconomyProfile";

function WeeklyContent() {
  const econProfile = useEconomyProfile();
  const [indicators, setIndicators] = useState<RealIndicator[]>([]);
  const [country] = useState("KAZ");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/economy/indicators?country=${country}`);
      if (!res.ok) return;
      const json = await res.json();
      setIndicators(json.indicators ?? []);
    } catch {}
  }, [country]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const adapted = indicators.map((ind) => ({ ...ind, source: ind.source as any }));

  return (
    <div className="min-h-full text-foreground">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
        📋 Weekly <span className="text-blue-400">Report</span>
      </h1>
      <WeeklyReport
        indicators={adapted as any}
        country={country}
        parentMode={false}
        userProfile={econProfile as any}
      />
    </div>
  );
}

export default function WeeklyPage() {
  return (
    <LanguageProvider>
      <WeeklyContent />
    </LanguageProvider>
  );
}
