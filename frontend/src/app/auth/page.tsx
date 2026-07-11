"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, KeyRound, Mail, User, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, login, register, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    // Client-side validation for Registration
    if (activeTab === "register") {
      if (!fullName || fullName.trim().length < 2) {
        setError("Full name must be at least 2 characters long.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!/\d/.test(password)) {
        setError("Password must contain at least one digit (number).");
        return;
      }
    }

    try {
      if (activeTab === "login") {
        await login(email, password);
      } else {
        await register(fullName, email, password);
        setSuccess("Registration successful! Logging you in...");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-primary to-emerald-dark rounded-xl flex items-center justify-center shadow-lg shadow-emerald-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-2xl font-bold tracking-tight text-white">
              GovGuide <span className="text-emerald-primary">AI</span>
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold font-outfit text-white">
            {activeTab === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {activeTab === "login" 
              ? "Access your dashboard and documents" 
              : "Get customized grant recommendations in minutes"}
          </p>
        </div>

        <div className="bg-bg-card border border-border-card rounded-3xl p-8 glow-card">
          {/* Tabs */}
          <div className="flex bg-bg-dark p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "login"
                  ? "bg-bg-card text-emerald-light shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "register"
                  ? "bg-bg-card text-emerald-light shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Register
            </button>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="flex items-start gap-3 bg-red-primary/10 border border-red-primary/20 p-4 rounded-2xl mb-6 text-red-primary text-sm animate-in fade-in duration-200">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 bg-emerald-primary/10 border border-emerald-primary/20 p-4 rounded-2xl mb-6 text-emerald-light text-sm animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "register" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aibek Shokkanuly"
                    className="block w-full pl-11 pr-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary text-white text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary text-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary text-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/50 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-primary/10 hover:shadow-emerald-primary/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : activeTab === "login" ? (
                "Log In"
              ) : (
                "Register Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary">
          By continuing, you agree to GovGuide AI's{" "}
          <a href="#" className="underline text-emerald-light">Terms of Service</a> and{" "}
          <a href="#" className="underline text-emerald-light">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
