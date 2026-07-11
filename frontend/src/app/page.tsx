"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Bot, ShieldAlert, Sparkles, Compass, CheckCircle2, Clock, FileText, LayoutDashboard, Search, FileUp, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Simulate interactive loading of chat previews
    const timer = setTimeout(() => setChatLoaded(true), 1500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary selection:bg-emerald-primary/30 selection:text-emerald-light">
      {/* ============ NAVIGATION ============ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled ? "bg-bg-dark/90 backdrop-blur-md border-border-card" : "bg-transparent border-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-primary to-emerald-dark rounded-xl flex items-center justify-center shadow-lg shadow-emerald-primary/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight">
              GovGuide <span className="text-emerald-primary font-extrabold">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">How It Works</a>
            <a href="#architecture" className="text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">Architecture</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="flex items-center gap-2 bg-emerald-primary hover:bg-emerald-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-primary/15 hover:shadow-emerald-primary/25 hover:-translate-y-0.5">
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth?tab=login" className="text-text-secondary hover:text-text-primary px-4 py-2 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/auth?tab=register" className="bg-emerald-primary hover:bg-emerald-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-primary/15 hover:shadow-emerald-primary/25 hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`w-6 h-0.5 bg-text-primary transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`w-6 h-0.5 bg-text-primary transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`w-6 h-0.5 bg-text-primary transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-bg-card border-b border-border-card px-6 py-8 flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-text-primary py-2 text-lg font-medium">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-text-primary py-2 text-lg font-medium">How It Works</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-text-primary py-2 text-lg font-medium">Architecture</a>
            <hr className="border-border-card my-2" />
            {user ? (
              <Link href="/dashboard" className="bg-emerald-primary text-white text-center py-3 rounded-xl font-semibold">
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/auth?tab=login" className="text-text-secondary text-center py-3 font-medium">
                  Login
                </Link>
                <Link href="/auth?tab=register" className="bg-emerald-primary text-white text-center py-3 rounded-xl font-semibold">
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(0,0,0,0))]"></div>
        
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]"></div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative z-10">
          <div className="md:col-span-7 flex flex-col items-start gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-light rounded-full animate-ping"></span>
              🇰🇿 Built for Kazakhstan · AI-Powered · Free to Start
            </div>
            
            <h1 className="font-outfit text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-text-primary">
              Your Personal <br />
              <span className="gradient-text font-black">AI Government</span> <br />
              Navigator
            </h1>
            
            <p className="text-lg text-text-secondary max-w-xl leading-relaxed">
              From question to application in minutes. Find government programs, subsidies, and grants in seconds without reading hundreds of pages of legal text.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href={user ? "/chat" : "/auth?tab=register"} className="flex items-center justify-center gap-2 bg-emerald-primary hover:bg-emerald-dark text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl shadow-emerald-primary/20 hover:shadow-emerald-primary/35 hover:-translate-y-0.5">
                <Bot className="w-5 h-5" />
                Start Chatting Free
              </Link>
              <Link href={user ? "/dashboard" : "/auth?tab=login"} className="flex items-center justify-center gap-2 bg-bg-card hover:bg-bg-card-hover border border-border-card px-8 py-4 rounded-2xl font-bold transition-all duration-300">
                View Dashboard Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border-card/60 w-full mt-4">
              <div>
                <div className="text-3xl font-extrabold font-outfit text-white">500+</div>
                <div className="text-xs text-text-secondary">Programs Covered</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold font-outfit text-white">15+</div>
                <div className="text-xs text-text-secondary">Ministries Synced</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold font-outfit text-white">24/7</div>
                <div className="text-xs text-text-secondary">AI Support</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="glass-panel p-6 rounded-3xl glow-card max-w-md mx-auto relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border-card/60 pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-light" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">GovGuide AI</div>
                  <div className="text-xs text-emerald-light flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-light rounded-full animate-pulse"></span>
                    Online now
                  </div>
                </div>
              </div>

              <div className="space-y-4 min-h-[220px] flex flex-col justify-end">
                <div className="bg-bg-card border border-border-card/85 text-sm p-3.5 rounded-2xl rounded-tr-none max-w-[85%] self-end">
                  I'm 22, a student from Almaty. Can I get any startup grants?
                </div>

                {!chatLoaded ? (
                  <div className="bg-emerald-primary/5 border border-emerald-primary/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] self-start flex items-center gap-1.5 py-3">
                    <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                ) : (
                  <div className="bg-emerald-primary/5 border border-emerald-primary/10 text-sm p-4 rounded-2xl rounded-tl-none max-w-[85%] self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="font-bold text-emerald-light mb-2">✅ Found 3 programs:</div>
                    <ul className="space-y-1.5 text-xs text-text-secondary list-disc pl-4">
                      <li>🎓 <strong className="text-white">Youth Innovation Grant</strong> — 95% match</li>
                      <li>💼 <strong className="text-white">Astana Hub Program</strong> — 88% match</li>
                      <li>🚀 <strong className="text-white">Damu Startup Fund</strong> — 76% match</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-6 -right-4 bg-bg-card border border-border-card p-3 rounded-2xl flex items-center gap-3 shadow-lg max-w-[180px]">
              <div className="text-xl">🎯</div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">4 New Grants</div>
                <div className="text-[10px] text-text-secondary">Match profile</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 bg-bg-card border border-border-card p-3 rounded-2xl flex items-center gap-3 shadow-lg max-w-[180px]">
              <div className="text-xl">⏰</div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Deadline in 5d</div>
                <div className="text-[10px] text-text-secondary">Baiterek Grant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="border-y border-border-card py-10 bg-bg-card/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-6">Covering programs and documents from</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-text-secondary font-outfit text-sm font-semibold opacity-70">
            <span>eGov.kz</span>
            <span>Baiterek</span>
            <span>Astana Hub</span>
            <span>MOIT Kazakhstan</span>
            <span>Damu Fund</span>
            <span>Enbek.kz</span>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM SECTION ============ */}
      <section className="py-24 border-b border-border-card/40" id="problem">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-primary/10 border border-red-primary/20 text-red-primary text-xs font-bold mb-4">
              <ShieldAlert className="w-3.5 h-3.5" />
              The Problem
            </div>
            <h2 className="text-4xl font-extrabold font-outfit text-white mb-6">
              Thousands miss opportunities <br />
              <span className="gradient-text-red">every single year</span>
            </h2>
            <p className="text-text-secondary leading-relaxed mb-8">
              Kazakhstani government programs exist to support you, but navigating them is nearly impossible without expert help.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-primary/15 text-red-primary flex items-center justify-center text-xs mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Scattered Information:</strong> Split across 20+ government websites.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-primary/15 text-red-primary flex items-center justify-center text-xs mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Complex Legal Language:</strong> 100-page regulations that are hard to parse.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-primary/15 text-red-primary flex items-center justify-center text-xs mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Unclear Requirements:</strong> Rejections over simple document mistakes.
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-bg-card border border-border-card p-8 rounded-3xl text-center">
            <h3 className="font-outfit font-bold text-xl mb-4">Traditional Way</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["egov.kz", "gov.kz", "damu.kz", "astana-hub.kz", "enbek.kz"].map((site) => (
                <span key={site} className="bg-bg-dark border border-border-card px-3.5 py-2 rounded-xl text-xs text-text-secondary">
                  {site}
                </span>
              ))}
            </div>
            <div className="w-1 h-12 bg-gradient-to-b from-red-primary to-transparent mx-auto mb-4"></div>
            <div className="text-red-primary font-bold text-lg mb-2">😰 Confused. Overwhelmed. Gave up.</div>
            <p className="text-xs text-text-muted">Citizens spend an average of 15+ hours researching simple applications.</p>
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="py-24 relative" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Core Capabilities
            </div>
            <h2 className="text-4xl font-extrabold font-outfit text-white mb-4">
              Everything you need to <br />
              <span className="gradient-text font-black">navigate government services</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">AI Government Chat</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Ask questions in Kazakh, Russian, or English. Get immediate answers about grants and tax programs linked to official sources.
              </p>
            </div>

            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-primary/10 text-emerald-light text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-bl-xl border-l border-b border-border-card">
                Signature Feature
              </div>
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <FileUp className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">AI Document Analyzer</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Upload any government PDF (law, regulation, grant proposal). The AI extracts deadlines, eligibility, action plan, and checklist instantly.
              </p>
            </div>

            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">Government Search</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                A unified semantic search engine across eGov, Damu, and ministry documents. Finds answers without Google search spam.
              </p>
            </div>

            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">Smart Eligibility Engine</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Complete your profile and get matched with relevant grants, tax reductions, and subsidies based on age, region, and occupation.
              </p>
            </div>

            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">Application Roadmap</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Step-by-step interactive plans for every program application. Know exactly what document to collect next.
              </p>
            </div>

            <div className="bg-bg-card hover:bg-bg-card-hover border border-border-card/85 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-white mb-3">Proactive Matching</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Receive notifications when new government initiatives open that fit your startup, student status, or profile.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ============ HOW IT WORKS ============ */}
      <section className="py-24 border-t border-border-card/40 relative bg-bg-card/10" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light text-xs font-bold mb-4">
              ⚙️ How It Works
            </div>
            <h2 className="text-4xl font-extrabold font-outfit text-white mb-4">
              Powered by RAG + Multi-Agent AI
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            <div className="bg-bg-card border border-border-card p-6 rounded-3xl text-left space-y-4">
              <div className="text-3xl font-extrabold font-outfit text-emerald-light">01</div>
              <div className="text-2xl">📚</div>
              <h4 className="font-bold text-lg text-white">Government Data Ingested</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                PDFs, official website texts, and regulations from 15+ ministries are parsed, chunked, embedded, and stored in ChromaDB.
              </p>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl text-left space-y-4">
              <div className="text-3xl font-extrabold font-outfit text-emerald-light">02</div>
              <div className="text-2xl">🔍</div>
              <h4 className="font-bold text-lg text-white">Your Question Analyzed</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your message is semantically embedded and similarity-searched against the vector store to locate exact, relevant law articles.
              </p>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl text-left space-y-4">
              <div className="text-3xl font-extrabold font-outfit text-emerald-light">03</div>
              <div className="text-2xl">🤖</div>
              <h4 className="font-bold text-lg text-white">Multi-Agent Processing</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Specialized AI agents (Grants, Legal limits, Required Documents, Actions) collaborate to build your custom answers.
              </p>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl text-left space-y-4">
              <div className="text-3xl font-extrabold font-outfit text-emerald-light">04</div>
              <div className="text-2xl">✅</div>
              <h4 className="font-bold text-lg text-white">Answer + Action Plan</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                You receive a complete response containing matched opportunities, checklist items, official links, and roadmaps.
              </p>
            </div>
          </div>

          {/* Agent Architecture Diagram */}
          <div className="bg-bg-card border border-border-card rounded-3xl p-8 mt-12 max-w-3xl mx-auto">
            <h4 className="font-outfit font-bold text-lg text-white mb-6 text-center">Multi-Agent Orchestrator Pipeline</h4>
            <div className="flex flex-col items-center gap-4 text-xs font-semibold">
              <div className="bg-bg-dark border border-border-card px-5 py-2.5 rounded-xl text-white">User Query</div>
              <div className="text-text-muted">↓</div>
              <div className="bg-emerald-primary/10 border border-emerald-primary/30 text-emerald-light px-6 py-3.5 rounded-2xl font-bold">🧠 AI Orchestrator</div>
              <div className="text-text-muted">↓</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="bg-bg-dark border border-border-card p-3.5 rounded-xl">
                  <div className="text-lg mb-1">🎁</div>
                  <div className="text-white font-bold">Grant Agent</div>
                  <div className="text-[10px] text-text-secondary mt-1">Filters programs</div>
                </div>
                <div className="bg-bg-dark border border-border-card p-3.5 rounded-xl">
                  <div className="text-lg mb-1">⚖️</div>
                  <div className="text-white font-bold">Legal Agent</div>
                  <div className="text-[10px] text-text-secondary mt-1">Explains regulations</div>
                </div>
                <div className="bg-bg-dark border border-border-card p-3.5 rounded-xl">
                  <div className="text-lg mb-1">📄</div>
                  <div className="text-white font-bold">Document Agent</div>
                  <div className="text-[10px] text-text-secondary mt-1">Verifies uploads</div>
                </div>
                <div className="bg-bg-dark border border-border-card p-3.5 rounded-xl">
                  <div className="text-lg mb-1">🎯</div>
                  <div className="text-white font-bold">Matching Agent</div>
                  <div className="text-[10px] text-text-secondary mt-1">Ranks match scores</div>
                </div>
              </div>
              <div className="text-text-muted">↓</div>
              <div className="bg-emerald-primary text-white px-5 py-2.5 rounded-xl">📊 Final Structured Response Generator</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ARCHITECTURE SECTION ============ */}
      <section className="py-24 border-t border-border-card/40 relative" id="architecture">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light text-xs font-bold mb-4">
              🏗️ Architecture
            </div>
            <h2 className="text-4xl font-extrabold font-outfit text-white mb-4">
              Built to Scale from Day One
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">⚛️</div>
              <h4 className="font-bold text-base text-white">Frontend Stack</h4>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "React", "TypeScript", "TailwindCSS", "Framer Motion"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">⚡</div>
              <h4 className="font-bold text-base text-white">Backend Layer</h4>
              <div className="flex flex-wrap gap-2">
                {["FastAPI", "Python", "Pydantic", "SQLAlchemy", "Uvicorn"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">🤖</div>
              <h4 className="font-bold text-base text-white">AI Engine Stack</h4>
              <div className="flex flex-wrap gap-2">
                {["OpenAI GPT-4o", "LangChain", "ChromaDB", "RAG Pipeline", "Embeddings"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">🗄️</div>
              <h4 className="font-bold text-base text-white">Data Layer</h4>
              <div className="flex flex-wrap gap-2">
                {["PostgreSQL", "Redis Cache", "ChromaDB", "AWS S3 Bucket"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">☁️</div>
              <h4 className="font-bold text-base text-white">Infrastructure</h4>
              <div className="flex flex-wrap gap-2">
                {["Docker Engine", "Docker Compose", "Nginx Gateway", "GitHub Actions"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border-card p-6 rounded-3xl space-y-3">
              <div className="text-2xl">🔐</div>
              <h4 className="font-bold text-base text-white">Security Specs</h4>
              <div className="flex flex-wrap gap-2">
                {["Bearer JWT Tokens", "OAuth 2.0 flow", "bcrypt hashing", "Rate Limiting"].map(t => (
                  <span key={t} className="bg-bg-dark border border-border-card/60 px-2.5 py-1 rounded-lg text-[10px] text-text-secondary font-bold">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* RAG pipeline steps flow */}
          <div className="bg-bg-card border border-border-card rounded-3xl p-6 mt-12 max-w-4xl mx-auto overflow-x-auto">
            <h4 className="font-outfit font-bold text-sm text-white mb-4 text-center">Data Ingestion RAG Pipeline Steps</h4>
            <div className="flex items-center justify-between gap-2.5 text-[10px] font-bold text-text-secondary whitespace-nowrap min-w-[700px] px-4">
              <span>📂 Gov PDFs</span>
              <span className="text-text-muted">→</span>
              <span>✂️ Chunking</span>
              <span className="text-text-muted">→</span>
              <span>🧮 Embeddings</span>
              <span className="text-text-muted">→</span>
              <span>🗃️ ChromaDB Vector Store</span>
              <span className="text-text-muted">→</span>
              <span>🔍 Semantic Similarity Query</span>
              <span className="text-text-muted">→</span>
              <span>🤖 GPT-4o Prompt Injection</span>
              <span className="text-text-muted">→</span>
              <span className="text-emerald-light">✅ Answer + Source Citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border-card py-16 bg-bg-card/25">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-primary rounded-lg flex items-center justify-center">
                <Compass className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-outfit font-bold text-white">GovGuide AI</span>
            </Link>
            <p className="text-xs text-text-secondary leading-relaxed">
              Helping citizens of Kazakhstan understand, compare, and navigate government opportunities in seconds.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Product</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
              <a href="#features" className="hover:text-white">Features</a>
              <Link href="/chat" className="hover:text-white">AI Chat</Link>
              <Link href="/analyze" className="hover:text-white">Document Analysis</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Official Sources</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
              <a href="https://egov.kz" target="_blank" rel="noopener noreferrer" className="hover:text-white">eGov.kz</a>
              <a href="https://baiterek.gov.kz" target="_blank" rel="noopener noreferrer" className="hover:text-white">Baiterek</a>
              <a href="https://astana-hub.kz" target="_blank" rel="noopener noreferrer" className="hover:text-white">Astana Hub</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Language Support</h4>
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
              <span className="bg-bg-dark px-2.5 py-1.5 rounded-lg border border-border-card">Қазақша</span>
              <span className="bg-bg-dark px-2.5 py-1.5 rounded-lg border border-border-card">Русский</span>
              <span className="bg-bg-dark px-2.5 py-1.5 rounded-lg border border-border-card">English</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border-card/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-text-muted">© 2026 GovGuide AI. All rights reserved. Built with ❤️ for Kazakhstan.</p>
          <div className="flex gap-6 text-[10px] text-text-muted">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
