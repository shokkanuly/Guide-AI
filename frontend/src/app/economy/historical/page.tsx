"use client";

import { HistoricalReview } from "@/components/economy/dashboard/HistoricalReview";
import { LanguageProvider } from "@/lib/economy/LanguageContext";

function HistoricalContent() {
  return (
    <div className="min-h-full text-foreground">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
        📈 Historical <span className="text-blue-400">Review</span>
      </h1>
      <HistoricalReview country="KAZ" />
    </div>
  );
}

export default function HistoricalPage() {
  return (
    <LanguageProvider>
      <HistoricalContent />
    </LanguageProvider>
  );
}
