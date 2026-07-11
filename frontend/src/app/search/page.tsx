"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Loader2, Bookmark, ExternalLink, Compass } from "lucide-react";

interface SearchResult {
  id: string;
  type: "program" | "document";
  title: string;
  organization?: string;
  score: number;
  source: string;
  url?: string;
  amount?: string;
  deadline?: string;
  snippet?: string;
}

export default function SearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      setResults(res.data.results || []);
      setHasSearched(true);
    } catch (err: any) {
      setError("Search query failed. Please verify ChromaDB is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white text-left">
            {t("govSearch")}
          </h1>
          <p className="text-sm text-text-secondary mt-1 text-left">
            {t("searchDesc")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="block w-full pl-12 pr-4 py-3.5 bg-bg-card border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary text-white text-sm"
              />
            </div>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-bg-card border border-border-card px-4 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm shrink-0"
            >
              <option value="all">{t("allContent")}</option>
              <option value="programs">{t("programsOnly")}</option>
              <option value="laws">{t("lawsOnly")}</option>
            </select>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/45 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("searchBtn")}
            </button>
          </form>

          {error && (
            <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary text-xs p-4 rounded-2xl text-left">
              {error}
            </div>
          )}

          <div className="space-y-4 pt-4">
            {loading ? (
              <div className="py-12 text-center text-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-light" />
                <span className="text-xs">Searching databases...</span>
              </div>
            ) : !hasSearched ? (
              <div className="bg-bg-card/30 border border-border-card border-dashed rounded-3xl p-16 text-center text-text-secondary">
                <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
                <h4 className="font-outfit font-bold text-white mb-1">{t("awaitingSearch")}</h4>
                <p className="text-xs max-w-sm mx-auto">
                  {t("awaitingSearchDesc")}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-bg-card border border-border-card rounded-3xl p-12 text-center text-text-secondary">
                <h4 className="font-outfit font-bold text-white mb-2">No Results Found</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Try adjusting spelling or search query categories.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold text-text-secondary text-left">
                  Found {results.length} relevant matches
                </div>

                {results.map((item, idx) => (
                  <div key={idx} className="bg-bg-card border border-border-card p-5 rounded-3xl glow-card text-left space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          item.type === "program" 
                            ? "bg-emerald-primary/10 border-emerald-primary/25 text-emerald-light"
                            : "bg-blue-primary/10 border-blue-primary/25 text-blue-primary"
                        }`}>
                          {item.type === "program" ? "Government Program" : "Legal Document"}
                        </span>
                        <h4 className="font-bold text-sm text-white mt-2.5">{item.title}</h4>
                        {item.organization && <p className="text-[10px] text-text-secondary mt-0.5">{item.organization}</p>}
                      </div>
                      
                      <span className="text-text-muted font-bold text-[10px] shrink-0 uppercase tracking-wider">
                        {t("relevance")}: {Math.round(item.score * 100)}%
                      </span>
                    </div>

                    {item.snippet && (
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-dark/20 p-3 rounded-xl border border-border-card/40">
                        {item.snippet}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-[10px] pt-1">
                      {item.amount && (
                        <div>
                          <span className="text-text-muted block font-semibold">MAX AMOUNT</span>
                          <span className="text-white font-bold">{item.amount}</span>
                        </div>
                      )}
                      {item.deadline && (
                        <div>
                          <span className="text-text-muted block font-semibold">DEADLINE</span>
                          <span className="text-white font-bold">{item.deadline}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-border-card/60">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-light hover:underline flex items-center gap-1"
                        >
                          View Official Source
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
