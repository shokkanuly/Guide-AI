"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [age, setAge] = useState<number | "">(user?.age || "");
  const [region, setRegion] = useState(user?.region || "");
  const [employmentStatus, setEmploymentStatus] = useState(user?.employment_status || "employed");
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">(user?.monthly_income || "");
  const [isStudent, setIsStudent] = useState(user?.is_student || false);
  const [hasFamily, setHasFamily] = useState(user?.has_family || false);
  const [familySize, setFamilySize] = useState<number>(user?.family_size || 1);
  const [isBusinessOwner, setIsBusinessOwner] = useState(user?.is_business_owner || false);
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const interestsArray = interests
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      await api.put("/users/me", {
        full_name: fullName,
        age: age === "" ? null : Number(age),
        region: region || null,
        employment_status: employmentStatus,
        monthly_income: monthlyIncome === "" ? null : Number(monthlyIncome),
        is_student: isStudent,
        has_family: hasFamily,
        family_size: Number(familySize),
        is_business_owner: isBusinessOwner,
        interests: interestsArray,
      });

      await refreshUser();
      setSuccess("Profile settings saved successfully!");
    } catch (err: any) {
      setError("Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white">
            Profile Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Maintain your user metrics to customize grant matching and roadmap generation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card border border-border-card rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border-card/60 pb-6 mb-2">
            <div className="w-14 h-14 bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light rounded-2xl flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">{user?.full_name}</h3>
              <p className="text-xs text-text-secondary">{user?.email}</p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light text-xs p-4 rounded-2xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary text-xs p-4 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="22"
                className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              >
                <option value="">Select Region</option>
                <option value="Almaty">Almaty</option>
                <option value="Astana">Astana</option>
                <option value="Shymkent">Shymkent</option>
                <option value="Karaganda">Karaganda</option>
                <option value="Pavlodar">Pavlodar</option>
                <option value="other">Other Region</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Monthly Income (₸)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Monthly income"
                className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Employment Status</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              >
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self Employed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Social Criteria checkboxes</label>
            
            <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-all">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
              />
              Is currently a student
            </label>

            <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-all">
              <input
                type="checkbox"
                checked={isBusinessOwner}
                onChange={(e) => setIsBusinessOwner(e.target.checked)}
                className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
              />
              Owns registered LLP / IE
            </label>

            <label className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer hover:text-white transition-all">
              <input
                type="checkbox"
                checked={hasFamily}
                onChange={(e) => setHasFamily(e.target.checked)}
                className="rounded border-border-card bg-bg-dark text-emerald-primary focus:ring-emerald-primary w-4 h-4"
              />
              Has family dependencies
            </label>
          </div>

          {hasFamily && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Family Size</label>
              <input
                type="number"
                min={1}
                value={familySize}
                onChange={(e) => setFamilySize(Number(e.target.value))}
                className="block w-[120px] px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Interests / Focus Tags (comma-separated)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="it, startup, agriculture"
              className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/45 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Save Settings"
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
