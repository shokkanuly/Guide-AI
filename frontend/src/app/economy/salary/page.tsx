"use client";

import { useEffect, useState, useCallback } from "react";
import { RealIndicator } from "@/lib/economy/api/fetchRealData";
import { FutureSalary } from "@/components/economy/dashboard/FutureSalary";
import { LanguageProvider } from "@/lib/economy/LanguageContext";
import { useEconomyProfile } from "@/lib/economy/useEconomyProfile";

function SalaryContent() {
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
        💰 Salary <span className="text-blue-400">Projections</span>
      </h1>
      <FutureSalary
        indicators={adapted as any}
        country={country}
        parentMode={false}
        userProfile={econProfile as any}
        onUpdateProfile={() => {}}
      />
    </div>
  );
}

export default function SalaryPage() {
  return (
    <LanguageProvider>
      <SalaryContent />
    </LanguageProvider>
  );
}
