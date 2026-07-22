"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Compass, 
  LayoutDashboard, 
  Bot, 
  FileUp, 
  Trophy, 
  User, 
  LogOut, 
  Bell,
  Search,
  BookOpen,
  Globe,
  Activity,
  TrendingUp,
  DollarSign,
  MapPin,
  BarChart2,
  FileText,
  Clock,
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // Determine active mode based on current route
  const isEconMode = pathname.startsWith("/economy");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth?tab=login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-secondary">
        <div className="w-10 h-10 border-4 border-emerald-primary/30 border-t-emerald-primary rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-semibold tracking-wider uppercase font-outfit">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ── GovGuide sidebar menu ──────────────────────────────────────────────
  const govGuideMenu = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("aiChat"), href: "/chat", icon: Bot },
    { name: t("documentAnalyzer"), href: "/analyze", icon: FileUp },
    { name: t("eligibilityChecker"), href: "/eligibility", icon: Trophy },
    { name: t("govSearch"), href: "/search", icon: Search },
    { name: t("savedPrograms"), href: "/programs", icon: BookOpen },
  ];

  // ── EconPulse sidebar menu ─────────────────────────────────────────────
  const econPulseMenu = [
    { name: "Dashboard", href: "/economy", icon: LayoutDashboard },
    { name: "Economy", href: "/economy", icon: TrendingUp },
    { name: "Salary", href: "/economy/salary", icon: DollarSign },
    { name: "City Data", href: "/economy/city", icon: MapPin },
    { name: "Before/After", href: "/economy/before-after", icon: BarChart2 },
    { name: "Weekly Report", href: "/economy/weekly", icon: FileText },
    { name: "Historical", href: "/economy/historical", icon: Clock },
  ];

  const menuItems = isEconMode ? econPulseMenu : govGuideMenu;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col">
      {/* ============ APP NAVBAR ============ */}
      <header className="sticky top-0 z-40 bg-bg-card/80 backdrop-blur-md border-b border-border-card px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-primary to-emerald-dark rounded-lg flex items-center justify-center">
              <Compass className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-outfit font-bold tracking-tight text-white hidden sm:inline">
              GovGuide <span className="text-emerald-primary">AI</span>
            </span>
          </Link>
        </div>

        {/* ── Mode Switcher Pill ── */}
        <div className="flex items-center gap-1 bg-bg-dark border border-border-card p-1 rounded-2xl">
          {/* GovGuide button */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              !isEconMode
                ? "bg-emerald-primary/15 border border-emerald-primary/30 text-emerald-light shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">GovGuide</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-border-card" />

          {/* EconPulse button */}
          <Link
            href="/economy"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              isEconMode
                ? "bg-blue-500/15 border border-blue-500/30 text-blue-300 shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">EconPulse</span>
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-bg-dark border border-border-card px-2.5 py-1.5 rounded-xl">
            <Globe className="w-4 h-4 text-emerald-light" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="ru" className="bg-bg-card text-white">Русский</option>
              <option value="kz" className="bg-bg-card text-white">Қазақша</option>
              <option value="en" className="bg-bg-card text-white">English</option>
            </select>
          </div>

          <Link href="/notifications" className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
            <Bell className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-3 pl-3 border-l border-border-card">
            <div className="w-8 h-8 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light flex items-center justify-center font-bold text-sm">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white max-w-[120px] truncate">{user.full_name}</div>
              <div className="text-[10px] text-text-secondary">
                {user.is_premium ? "⭐ Premium" : "Free"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="flex-1 flex pb-16 md:pb-0">
        {/* Desktop Sidebar */}
        <aside
          className={`w-64 border-r hidden md:flex flex-col justify-between p-4 shrink-0 transition-colors duration-300 ${
            isEconMode
              ? "border-blue-500/20 bg-slate-950/60"
              : "border-border-card bg-bg-card/40"
          }`}
        >
          {/* Mode label */}
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 ${
              isEconMode ? "text-blue-400/60" : "text-emerald-primary/60"
            }`}>
              {isEconMode ? "📊 EconPulse" : "🧭 GovGuide"}
            </div>

            <div className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/economy" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? isEconMode
                          ? "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                          : "bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border-card/60 pt-4">
            <Link
              href="/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname === "/profile"
                  ? "bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
              }`}
            >
              <User className="w-5 h-5" />
              {t("profileSettings")}
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-primary/80 hover:text-red-primary hover:bg-red-primary/5 transition-all text-left"
            >
              <LogOut className="w-5 h-5" />
              {t("signOut")}
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ============ MOBILE BOTTOM BAR ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card/90 backdrop-blur-md border-t border-border-card px-2 py-2 flex items-center justify-around md:hidden">
        {/* Mode toggle in mobile bar */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 p-2 transition-all rounded-xl ${
            !isEconMode ? "text-emerald-light bg-emerald-primary/10" : "text-text-secondary"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-bold">Guide</span>
        </Link>

        {isEconMode ? (
          // EconPulse mobile nav items
          <>
            <Link href="/economy" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/economy" ? "text-blue-300" : "text-text-secondary"}`}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Economy</span>
            </Link>
            <Link href="/economy/salary" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/economy/salary" ? "text-blue-300" : "text-text-secondary"}`}>
              <DollarSign className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Salary</span>
            </Link>
            <Link href="/economy/city" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/economy/city" ? "text-blue-300" : "text-text-secondary"}`}>
              <MapPin className="w-5 h-5" />
              <span className="text-[9px] font-semibold">City</span>
            </Link>
          </>
        ) : (
          // GovGuide mobile nav items
          <>
            <Link href="/dashboard" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/dashboard" ? "text-emerald-light" : "text-text-secondary"}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Home</span>
            </Link>
            <Link href="/chat" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/chat" ? "text-emerald-light" : "text-text-secondary"}`}>
              <Bot className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Chat</span>
            </Link>
            <Link href="/eligibility" className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/eligibility" ? "text-emerald-light" : "text-text-secondary"}`}>
              <Trophy className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Eligibility</span>
            </Link>
          </>
        )}

        {/* EconPulse mode toggle */}
        <Link
          href="/economy"
          className={`flex flex-col items-center gap-1 p-2 transition-all rounded-xl ${
            isEconMode ? "text-blue-300 bg-blue-500/10" : "text-text-secondary"
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[9px] font-bold">Econ</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 transition-all ${pathname === "/profile" ? "text-emerald-light" : "text-text-secondary"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
