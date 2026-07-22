"use client";

import { RealIndicator } from "@/lib/economy/api/fetchRealData";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface DataStatusBarProps {
  indicators: RealIndicator[];
  loading: boolean;
}

export function DataStatusBar({ indicators, loading }: DataStatusBarProps) {
  if (loading) return null;
  
  const realCount = indicators.filter(i => i.isRealData).length;
  const total = indicators.length;
  const allReal = realCount === total;
  const hasFred = indicators.some(i => i.source.includes('FRED'));

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs px-3 py-2 rounded-xl border ${
      allReal
        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
        : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
    }`}>
      {allReal ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="font-medium">
        {realCount}/{total} indicators using real published data
      </span>
      <span className="text-muted-foreground">•</span>
      {indicators.map(ind => (
        <span
          key={ind.id}
          title={`${ind.title}: ${ind.isRealData ? 'Real data from ' + ind.source : 'Simulated'} | ${ind.dataFrequency}`}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
            ind.isRealData
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${ind.isRealData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {ind.title.split(' ')[0]}
          <span className="opacity-60">{ind.isRealData ? ind.dataFrequency.slice(0,1).toUpperCase() : '~'}</span>
        </span>
      ))}
      {!hasFred && (
        <a
          href="https://fred.stlouisfed.org/docs/api/api_key.html"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
        >
          <Clock className="w-3 h-3" />
          Add FRED key → unlock live US data
        </a>
      )}
    </div>
  );
}
