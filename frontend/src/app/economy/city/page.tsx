"use client";

import { CityData } from "@/components/economy/dashboard/CityData";
import { LanguageProvider } from "@/lib/economy/LanguageContext";
import { useEconomyProfile } from "@/lib/economy/useEconomyProfile";

function CityContent() {
  const econProfile = useEconomyProfile();
  return (
    <div className="min-h-full text-foreground">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
        🏙 City <span className="text-blue-400">Economic Data</span>
      </h1>
      <CityData userProfile={econProfile as any} />
    </div>
  );
}

export default function CityPage() {
  return (
    <LanguageProvider>
      <CityContent />
    </LanguageProvider>
  );
}
