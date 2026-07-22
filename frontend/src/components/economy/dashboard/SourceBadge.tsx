"use client";

import { DataSource } from "@/lib/economy/api/mockData";

const SOURCE_CONFIG: Record<DataSource, { color: string; bg: string; label: string }> = {
  FRED: { color: "#60a5fa", bg: "rgba(59,130,246,0.15)", label: "FRED" },
  "World Bank": { color: "#34d399", bg: "rgba(16,185,129,0.15)", label: "World Bank" },
  IMF: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "IMF" },
  OECD: { color: "#a78bfa", bg: "rgba(139,92,246,0.15)", label: "OECD" },
  BLS: { color: "#fb923c", bg: "rgba(249,115,22,0.15)", label: "BLS" },
  "Trading Economics": { color: "#2dd4bf", bg: "rgba(20,184,166,0.15)", label: "Trading Economics" },
};

export function SourceBadge({ source }: { source: DataSource }) {
  const config = SOURCE_CONFIG[source] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: source };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}30`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: config.color, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}

export function DataSourceLegend() {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {(Object.keys(SOURCE_CONFIG) as DataSource[]).map((src) => (
        <SourceBadge key={src} source={src} />
      ))}
    </div>
  );
}
