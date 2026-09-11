"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  QrCode,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  CreditCard,
  Server,
  Lock,
  ChevronRight,
  Clock,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  RefreshCw,
  Phone,
  ShieldAlert,
  Database,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionUser } from "@/types/auth";

interface LandingPageProps {
  session?: SessionUser | null;
}

export function LandingPage({ session }: LandingPageProps) {
  // Simulator states for interactive turnstile preview
  const [simMode, setSimMode] = useState<"entry" | "exit" | "auto">("entry");
  const [simState, setSimState] = useState<"idle" | "scanning" | "granted" | "expired">("idle");
  const [simToken, setSimToken] = useState("tk_9a8f7c");
  const [simCountdown, setSimCountdown] = useState(20);
  const [activeStoryChapter, setActiveStoryChapter] = useState(0);

  // Simulate anti-proxy countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSimCountdown((prev) => {
        if (prev <= 1) {
          setSimToken("tk_" + Math.random().toString(36).substring(2, 8));
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerSimScan = (status: "granted" | "expired") => {
    if (simState !== "idle") return;
    setSimState("scanning");
    setTimeout(() => {
      setSimState(status);
      setTimeout(() => {
        // Rotate token immediately upon scan (burned nonce)
        setSimToken("tk_" + Math.random().toString(36).substring(2, 8));
        setSimCountdown(20);
        setSimState("idle");
      }, 3500);
    }, 650);
  };

  const loginGateways = [
    {
      id: "member",
      title: "Member & Athlete Portal",
      audience: "Gym Members",
      description:
        "Instant phone entry pass, see active membership status, book workout classes, and check attendance history.",
      icon: Smartphone,
      accent: "from-primary/20 via-primary/5 to-transparent",
      badge: "Members",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      href: "/portal/login",
      actionLabel: "Open Member Pass",
      featured: true,
    },
    {
      id: "staff",
      title: "Front Desk & Staff",
      audience: "Receptionists & Trainers",
      description:
        "Quick member check-in, see who is currently working out on the gym floor, register walk-ins, and manage classes.",
      icon: QrCode,
      accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      badge: "Front Desk",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      href: "/login",
      actionLabel: "Front Desk Sign In",
      featured: false,
    },
    {
      id: "admin",
      title: "Gym Owner & Manager",
      audience: "Gym Owners & Managers",
      description:
        "Full control over your gym: create membership plans, track monthly revenue, manage member renewals, and add staff accounts.",
      icon: LayoutDashboard,
      accent: "from-emerald-500/20 via-teal-500/5 to-transparent",
      badge: "Gym Management",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      href: "/login",
      actionLabel: "Owner Sign In",
      featured: false,
    },
    {
      id: "platform",
      title: "Platform Console",
      audience: "Franchise Operators & Admins",
      description:
        "Create new gym accounts, issue licenses, and manage multi-location gym franchises from a single master dashboard.",
      icon: ShieldCheck,
      accent: "from-purple-500/20 via-indigo-500/5 to-transparent",
      badge: "Superadmin",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      href: "/platform/login",
      actionLabel: "Platform Sign In",
      featured: false,
    },
  ];

  const storyChapters = [
    {
      id: "kiosk",
      step: "01",
      tag: "EASY CHECK-IN",
      title: "Instant Phone Check-In at the Door",
      subtitle: "Mount a tablet at your entrance. Members scan and walk in.",
      description:
        "Mount any standard tablet or iPad at your front door. When members arrive, they simply scan the code with their smartphone camera. They are checked in under a second — no plastic keycards to buy, and members do not have to install any bulky apps.",
      highlight: "1-Second Check-In",
      badge: "No App Required",
    },
    {
      id: "crypto",
      step: "02",
      tag: "STOP CHEATING",
      title: "Stop Pass Sharing Between Friends",
      subtitle: "Members can't screenshot a pass and send it to their buddies.",
      description:
        "With old-school barcode cards, members screenshot their pass and share it with friends to let them sneak in for free. GymERP automatically changes the check-in code every 20 seconds. As soon as one person scans it, that code expires instantly so nobody else can reuse it.",
      highlight: "Stops Free Entry",
      badge: "Auto-Rotating Code",
    },
    {
      id: "dead-battery",
      step: "03",
      tag: "BACKUP ACCESS",
      title: "Dead Phone? Keypad Check-In",
      subtitle: "Nobody gets locked out if their phone battery dies during work.",
      description:
        "If a member comes straight from work with a dead phone, they simply tap the tablet screen and enter their phone number. Their photo and membership status immediately pop up on screen. If their membership expired, it clearly shows in red so your front desk can collect payment.",
      highlight: "100% Reliable",
      badge: "Phone Number Backup",
    },
    {
      id: "daemon",
      step: "04",
      tag: "PEAK HOUR SPEED",
      title: "Never Lags During Morning & Evening Rushes",
      subtitle: "Built to stay fast even when 50 members walk in at the same time.",
      description:
        "Most gym software slows down or crashes during the 7 AM and 6 PM rush hours. GymERP is built on high-speed servers with direct database links, so check-ins happen in real time with zero loading spinners or awkward door bottlenecks.",
      highlight: "Zero Rush Hour Lag",
      badge: "Instant Response",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 selection:bg-primary/30 selection:text-primary font-sans relative overflow-x-hidden">
      {/* Subtle Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
      </div>

      {/* Clean Minimal Navbar (No Cluttered Links) */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-[#08090a] flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_16px_rgba(62,207,142,0.3)] transition-transform group-hover:scale-105">
              G
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-widest leading-none">
                GYMERP
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 hidden sm:inline-block">
                Core OS
              </span>
            </div>
          </Link>

          {/* Right Action Gateways */}
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href={
                  session.role === "platform"
                    ? "/platform"
                    : session.role === "admin"
                    ? "/admin"
                    : "/staff"
                }
              >
                <Button
                  size="sm"
                  className="h-9 px-4 bg-primary text-[#08090a] hover:bg-primary-deep font-semibold text-xs rounded-lg shadow-sm"
                >
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                {/* Secondary Staff/Admin Login Link */}
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-9 px-3 text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg"
                  >
                    <span>Staff & Admin</span>
                  </Button>
                </Link>

                {/* Primary Member Login Button - Front & Center */}
                <Link href="/portal/login">
                  <Button
                    size="sm"
                    className="h-9 px-4 bg-primary text-[#08090a] hover:bg-primary-deep font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(62,207,142,0.25)] flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Member Login</span>
                  </Button>
                </Link>

                {/* Discreet Superadmin Link */}
                <Link
                  href="/platform/login"
                  title="Platform Superadmin Console"
                  className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] items-center justify-center transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Storytelling Experience */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
          {/* Status Capsule */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0c0d10] border border-white/[0.08] text-xs font-mono shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-zinc-400">Gym Management & Check-In</span>
            <span className="text-zinc-600">•</span>
            <span className="text-primary font-semibold">Fast Check-In • No Pass Sharing</span>
          </motion.div>

          {/* Editorial Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Run your gym smoothly. <br />
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                Stop pass sharing.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
              The modern management software for gyms, fitness studios, and martial arts dojos.
              Instant phone check-in at the front desk, automatic expired pass alerts, and members
              can't screenshot passes to sneak friends in.
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link href="/portal/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-6 bg-primary text-[#08090a] font-bold hover:bg-primary-deep rounded-xl shadow-[0_0_20px_rgba(62,207,142,0.25)] text-sm flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Member Check-In & Login</span>
              </Button>
            </Link>
            <a href="#interactive-kiosk" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-5 border-white/[0.08] bg-[#0c0d10] text-zinc-200 hover:text-white hover:bg-[#14161b] rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-primary" />
                <span>See How Check-In Works</span>
              </Button>
            </a>
          </motion.div>
        </section>

        {/* SECTION: INTERACTIVE PHYSICAL KIOSK & SCANNER SIMULATOR */}
        <section id="interactive-kiosk" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold block">
              LIVE FRONT DOOR SIMULATOR
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              See How Front Door Check-In Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Watch how the tablet at your front door lets members scan to enter and catches expired
              memberships automatically.
            </p>
          </div>

          {/* Dual Simulator Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Physical Tablet Kiosk Display (7 cols) */}
            <div className="lg:col-span-7">
              <div
                className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden bg-[#0a0b0e] shadow-2xl ${
                  simState === "granted"
                    ? "border-primary shadow-[0_0_40px_rgba(62,207,142,0.25)]"
                    : simState === "expired"
                    ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.25)]"
                    : "border-white/[0.08]"
                }`}
              >
                {/* Kiosk Status Bar */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-white font-semibold">FRONT DOOR CHECK-IN TABLET</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live Tablet Screen</span>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {(["entry", "exit", "auto"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSimMode(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                        simMode === m
                          ? "bg-white/[0.1] text-primary border border-primary/30 font-bold"
                          : "text-zinc-400 hover:text-white bg-white/[0.02]"
                      }`}
                    >
                      {m === "entry" ? "Entry Door" : m === "exit" ? "Exit Door" : "Both (Auto)"}
                    </button>
                  ))}
                </div>

                {/* Main QR Display */}
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <div className="relative p-4 rounded-2xl bg-white text-[#08090a] shadow-xl">
                    <div className="w-44 h-44 flex flex-col items-center justify-center border-4 border-dashed border-zinc-300 rounded-xl relative overflow-hidden bg-white">
                      <QrCode className="w-36 h-36 text-zinc-950" />
                      {/* Scanning laser beam overlay */}
                      {simState === "scanning" && (
                        <motion.div
                          initial={{ top: 0 }}
                          animate={{ top: "100%" }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_10px_#3ecf8e]"
                        />
                      )}
                    </div>
                  </div>

                  {/* 20-Second Progress Timer */}
                  <div className="w-56 space-y-1.5 text-center">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Code: {simToken}</span>
                      <span className="text-primary font-bold">New code in {simCountdown}s</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(simCountdown / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Feedback Toast Notification */}
                <AnimatePresence>
                  {simState === "granted" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3.5 rounded-xl bg-primary/15 border border-primary/40 text-center flex items-center justify-center gap-2 text-xs font-semibold text-primary"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>WELCOME IN • ALEX VANCE (Active Membership)</span>
                    </motion.div>
                  )}
                  {simState === "expired" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-center flex items-center justify-center gap-2 text-xs font-semibold text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>MEMBERSHIP EXPIRED • PLEASE RENEW AT FRONT DESK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Interactive Test Triggers (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#0c0d10] border border-white/[0.08] space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-primary font-bold">
                    TRY BOTH SCENARIOS
                  </span>
                  <h3 className="text-lg font-bold text-white">See It in Action</h3>
                  <p className="text-xs text-zinc-400">
                    Test how your door tablet greets active members and automatically catches unpaid expired memberships.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Button
                    onClick={() => handleTriggerSimScan("granted")}
                    disabled={simState !== "idle"}
                    className="w-full h-11 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs rounded-xl flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Simulate Paid Member Scan</span>
                    </span>
                    <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded">
                      Access Granted
                    </span>
                  </Button>

                  <Button
                    onClick={() => handleTriggerSimScan("expired")}
                    disabled={simState !== "idle"}
                    variant="outline"
                    className="w-full h-11 border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 font-semibold text-xs rounded-xl flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Simulate Expired Member Scan</span>
                    </span>
                    <span className="font-mono text-[10px] bg-red-500/20 px-2 py-0.5 rounded">
                      Red Alert
                    </span>
                  </Button>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-zinc-400 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Pass Sharing Protection:</span>
                    <span className="text-primary font-bold">Active (Single-Use Code)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Door Response Time:</span>
                    <span className="text-zinc-200">Under 1 second</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: SEAMLESS SCROLL STORYTELLING CHAPTERS */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary block font-semibold">
              WHY GYM OWNERS CHOOSE GYMERP
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built Specifically for Real Gyms
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Four simple reasons gym owners switch to GymERP for door access and member management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Story Navigation Rail (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {storyChapters.map((ch, idx) => {
                const isActive = activeStoryChapter === idx;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveStoryChapter(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
                      isActive
                        ? "bg-[#0c0d10] border-primary/40 shadow-[0_4px_24px_rgba(62,207,142,0.1)]"
                        : "bg-[#08090a] border-white/[0.04] hover:border-white/[0.08] hover:bg-[#0c0d10]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isActive ? "text-primary" : "text-zinc-500"
                        }`}
                      >
                        {ch.step} // {ch.tag}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        {ch.badge}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white">{ch.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {ch.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Story Dynamic Content Display (7 cols) */}
            <div className="lg:col-span-7">
              <div className="p-7 sm:p-9 rounded-3xl border border-white/[0.08] bg-[#0c0d10] relative overflow-hidden space-y-6 shadow-2xl min-h-[380px] flex flex-col justify-between">
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">
                      Feature {storyChapters[activeStoryChapter].step} • {storyChapters[activeStoryChapter].tag}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-300 bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.08]">
                      {storyChapters[activeStoryChapter].highlight}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {storyChapters[activeStoryChapter].title}
                  </h3>

                  <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                    {storyChapters[activeStoryChapter].description}
                  </p>
                </div>

                {/* Practical Gym Benefits Box */}
                <div className="p-4 rounded-2xl bg-[#08090a] border border-white/[0.06] grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400 relative z-10">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Door Security</span>
                    <span className="text-white font-bold">Stops Pass Sharing</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Dead Battery Backup</span>
                    <span className="text-primary font-bold">Phone Keypad Entry</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Payment Alerts</span>
                    <span className="text-white font-bold">Instant Red Warning</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Supported Hardware</span>
                    <span className="text-emerald-400 font-bold">Any Tablet or iPad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: THE FOUR SECURE GATEWAYS (LOGINS) */}
        <section id="portals" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary block font-semibold">
              ROLE-BASED AUTHENTICATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Four Dedicated Portals
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each stakeholder enters through a specialized interface built exclusively for their role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loginGateways.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  className={`group relative rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-[#0c0d10] ${
                    opt.featured
                      ? "border-primary/40 shadow-[0_0_30px_rgba(62,207,142,0.12)] hover:border-primary"
                      : "border-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  <div
                    className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${opt.accent} rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity`}
                  />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full border uppercase tracking-wider font-semibold ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {opt.title}
                      </h3>
                      <span className="text-xs text-zinc-500 font-mono block mt-0.5">
                        For: {opt.audience}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 relative z-10">
                    <Link href={opt.href} className="w-full">
                      <Button
                        className={`w-full h-10 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-between px-4 ${
                          opt.featured
                            ? "bg-primary text-[#08090a] hover:bg-primary-deep"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08]"
                        }`}
                      >
                        <span>{opt.actionLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Minimal Obsidian Footer */}
      <footer className="border-t border-white/[0.06] bg-[#060708] py-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary text-[#08090a] flex items-center justify-center font-black text-xs">
              G
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-wider block">
                GYMERP CORE
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Modern Gym Management & Door Access System
              </span>
            </div>
          </div>

          {/* Direct Role Links */}
          <div className="flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <Link href="/portal/login" className="hover:text-white transition-colors text-primary font-semibold">
              Member Portal
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Staff & Admin
            </Link>
            <Link href="/staff/kiosk" target="_blank" className="hover:text-white transition-colors">
              Physical Kiosk
            </Link>
            <Link href="/platform/login" className="hover:text-white transition-colors text-zinc-500">
              Platform Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
