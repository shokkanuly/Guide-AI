"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { BookOpen, Search, ArrowRight, Bookmark, BookmarkCheck } from "lucide-react";

interface ProgramItem {
  id: string;
  slug: string;
  title: string;
  organization: string;
  category: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
  deadline?: string;
  status: string;
  tags?: string[];
  official_url?: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "saved">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [programsRes, savedRes] = await Promise.all([
        api.get(`/programs?search=${search}&category=${category}`),
        api.get("/programs/saved"),
      ]);
      const allSaved = savedRes.data || [];
      setSavedIds(allSaved.map((p: any) => p.id));

      if (viewMode === "saved") {
        const filteredSaved = allSaved.filter((p: any) => {
          const matchesCategory = !category || p.category === category;
          const matchesSearch = !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.organization.toLowerCase().includes(search.toLowerCase());
          return matchesCategory && matchesSearch;
        });
        setPrograms(filteredSaved);
      } else {
        setPrograms(programsRes.data.data || []);
      }
    } catch (err) {
      setError("Failed to fetch programs directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, viewMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleSaveToggle = async (id: string) => {
    try {
      await api.post(`/programs/${id}/save`);
      setSavedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } catch (err) {
      // Ignore
    }
  };

  const categories = [
    { name: "All Categories", value: "" },
    { name: "Grants", value: "grant" },
    { name: "Subsidies", value: "subsidy" },
    { name: "Scholarships", value: "scholarship" },
    { name: "Social Support", value: "social_support" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white">
            Government Programs Catalog
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Browse active Kazakhstani initiatives, grants, and support measures.
          </p>
        </div>

        {/* Toggle between All and Saved */}
        <div className="flex gap-2 p-1 bg-bg-card border border-border-card rounded-2xl w-fit">
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "all"
                ? "bg-emerald-primary text-white"
                : "text-text-secondary hover:text-white"
            }`}
          >
            All Programs
          </button>
          <button
            onClick={() => setViewMode("saved")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "saved"
                ? "bg-emerald-primary text-white"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Saved Opportunities ({savedIds.length})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-bg-card border border-border-card rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword (e.g. startup, youth)..."
              className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
            />
            <button
              type="submit"
              className="bg-emerald-primary hover:bg-emerald-dark px-6 rounded-2xl text-xs font-bold text-white transition-all shrink-0"
            >
              Find
            </button>
          </form>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  category === cat.value
                    ? "bg-emerald-primary/10 border-emerald-primary/30 text-emerald-light"
                    : "bg-bg-dark border-border-card text-text-secondary hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary p-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-bg-card/50 border border-border-card rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-3xl p-16 text-center text-text-secondary">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h4 className="font-outfit font-bold text-white mb-2">No Programs Found</h4>
            <p className="text-xs max-w-sm mx-auto">
              No matching government initiatives found for current filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((prog) => {
              const isSaved = savedIds.includes(prog.id);
              return (
                <div key={prog.id} className="bg-bg-card border border-border-card p-6 rounded-3xl glow-card flex flex-col justify-between gap-4 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-bold text-[10px] px-2.5 py-0.5 rounded-lg uppercase">
                        {prog.category.replace("_", " ")}
                      </span>
                      <button
                        onClick={() => handleSaveToggle(prog.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? "bg-emerald-primary/10 border-emerald-primary/20 text-emerald-light"
                            : "border-border-card text-text-muted hover:text-white"
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>

                    <h4 className="font-bold text-base text-white">{prog.title}</h4>
                    <p className="text-xs text-text-secondary">{prog.organization}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs pt-4 border-t border-border-card/60">
                    {prog.amount_max && (
                      <div>
                        <span className="text-[10px] text-text-muted block font-semibold uppercase">Max Amount</span>
                        <span className="text-white font-bold">{prog.amount_max.toLocaleString()} {prog.currency || "₸"}</span>
                      </div>
                    )}
                    {prog.deadline && (
                      <div>
                        <span className="text-[10px] text-text-muted block font-semibold uppercase">Deadline</span>
                        <span className="text-white font-bold">{new Date(prog.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {prog.official_url && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={prog.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-light hover:underline flex items-center gap-1"
                      >
                        Official Site <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
