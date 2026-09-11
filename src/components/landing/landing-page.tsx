"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone,
  QrCode,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Check,
  Dumbbell,
  CreditCard,
  Server,
  Lock,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SessionUser } from "@/types/auth";

interface LandingPageProps {
  session?: SessionUser | null;
}

export function LandingPage({ session }: LandingPageProps) {
  const [activeStory, setActiveStory] = useState(0);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [simulatedGateState, setSimulatedGateState] = useState<"idle" | "scanning" | "unlocked">("idle");
  const [demoClassBooked, setDemoClassBooked] = useState(false);

  const handleSimulateScan = () => {
    if (simulatedGateState !== "idle") return;
    setSimulatedGateState("scanning");
    setTimeout(() => {
      setSimulatedGateState("unlocked");
      setTimeout(() => {
        setSimulatedGateState("idle");
      }, 2500);
    }, 600);
  };

  const portalOptions = [
    {
      id: "member",
      title: "Athlete & Member Portal",
      role: "Gym Members",
      description: "Digital entrance QR pass, real-time group class bookings, workout streak tracker, and active subscription.",
      icon: Smartphone,
      accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      badge: "Athletes",
      href: "/portal/login",
      demoInfo: "Preset: +1 (555) 234-5678 (Marcus Vance)",
      actionLabel: "Open Member Pass",
    },
    {
      id: "staff",
      title: "Front Desk & Kiosk Access",
      role: "Desk Staff & Coaches",
      description: "Sub-50ms optical turnstile camera scanner, live attendance stream, walk-in admissions, and manual overrides.",
      icon: QrCode,
      accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      badge: "Front Desk",
      href: "/login?preset=staff",
      demoInfo: "staff@ironpulse.local • Staff12345!",
      actionLabel: "Launch Kiosk Desk",
    },
    {
      id: "admin",
      title: "Gym Owner & Admin ERP",
      role: "Owners & General Managers",
      description: "Complete operational control: athlete CRM, coach notes, automated revenue ledger, and class schedule management.",
      icon: LayoutDashboard,
      accent: "from-emerald-500/20 via-teal-500/5 to-transparent",
      badge: "Management",
      href: "/login?preset=admin",
      demoInfo: "admin@ironpulse.local • Admin12345!",
      actionLabel: "Enter Admin Console",
    },
    {
      id: "platform",
      title: "Global Platform Console",
      role: "Enterprise & Franchise Admins",
      description: "Multi-tenant gym provisioning, PostgreSQL connection pool health, strict Row-Level Security isolation, and system telemetry.",
      icon: ShieldCheck,
      accent: "from-purple-500/20 via-indigo-500/5 to-transparent",
      badge: "Superadmin",
      href: "/platform/login",
      demoInfo: "platform@gymerp.local • Admin12345!",
      actionLabel: "Platform Superadmin",
    },
  ];

  const storyChapters = [
    {
      step: "01",
      tag: "OPTICAL INGRESS",
      title: "Sub-40ms Entrance Turnstiles",
      description: "High-contrast dynamic tokens scanned instantly by front-desk kiosks. Anti-proxy rotation prevents pass sharing while maintaining near-instantaneous magnetic door unlocks.",
      stat: "38ms",
      statLabel: "Average Gate Authorization",
    },
    {
      step: "02",
      tag: "CLASS ENGINE",
      title: "Real-Time Capacity Orchestration",
      description: "Athletes reserve HIIT, Strength, and Combat spots from their mobile pass. Dynamic capacity locking prevents overbooking and auto-notifies coaches in real-time.",
      stat: "100%",
      statLabel: "Zero Double-Booking Guarantee",
    },
    {
      step: "03",
      tag: "FINANCIAL LEDGER",
      title: "Autonomous Revenue Reconciliation",
      description: "Every membership renewal, personal training package, and drop-in is written to an immutable financial ledger with direct payment gateway webhook sync.",
      stat: "₹0",
      statLabel: "Unreconciled Cash Slippage",
    },
    {
      step: "04",
      tag: "DEDICATED DAEMON",
      title: "Dedicated Node Fastify Engine",
      description: "Heavy multi-tenant queries and high-frequency hardware scanner pings are handled by a dedicated Fastify daemon with PostgreSQL connection pooling and strict RLS.",
      stat: "<5ms",
      statLabel: "Pooled Database Latency",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 selection:bg-brand selection:text-black font-sans relative overflow-x-hidden">
      {/* Background Ambience & Fine Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      {/* Top Sticky Minimalist Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand text-carbon-950 flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_16px_rgba(62,207,142,0.25)] transition-transform group-hover:scale-105">
              G
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-widest leading-none">
                GYMERP
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                v2.4 Core
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#portals" className="hover:text-white transition-colors">
              Access Portals
            </a>
            <a href="#storytelling" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              High-Speed Architecture
            </a>
          </nav>

          {/* Right Action */}
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
                  className="h-8 px-3.5 bg-brand text-carbon-950 hover:bg-brand/90 font-semibold text-xs rounded-lg shadow-sm"
                >
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPortalModalOpen(true)}
                  className="h-8 px-3 text-xs border-white/[0.08] bg-[#0c0d10] text-zinc-300 hover:text-white hover:bg-[#16181d] rounded-lg gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Choose Portal</span>
                </Button>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="h-8 px-3.5 bg-brand text-carbon-950 hover:bg-brand/90 font-semibold text-xs rounded-lg shadow-[0_0_12px_rgba(62,207,142,0.25)]"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c0d10] border border-white/[0.08] text-xs text-zinc-300 font-mono shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-zinc-400">Gym Operating System</span>
            <span className="text-zinc-600">•</span>
            <span className="text-brand font-semibold">Sub-Millisecond Engine</span>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Physical operations. <br />
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                Zero friction.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
              An obsidian-crafted gym management ERP built for speed. Instant turnstile QR validation, automated revenue ledgers, real-time group class scheduling, and tenant-isolated PostgreSQL security.
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <a href="#portals">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-6 bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-xl shadow-[0_0_20px_rgba(62,207,142,0.25)] text-sm gap-2"
              >
                <span>Select Login Portal</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/portal/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-5 border-white/[0.08] bg-[#0c0d10] text-zinc-200 hover:text-white hover:bg-[#16181d] rounded-xl text-sm gap-2"
              >
                <Smartphone className="w-4 h-4 text-brand" />
                <span>Member Pass Demo</span>
              </Button>
            </Link>
          </motion.div>

          {/* Interactive Hardware Telemetry Strip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="pt-8"
          >
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0d10]/80 backdrop-blur-md max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Turnstile Auth
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
                  <span className="text-brand">38ms</span>
                  <span className="text-[10px] text-zinc-500 font-sans font-normal">ingress</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Tenant Isolation
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-emerald-400">
                  <span>Strict RLS</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Dedicated Daemon
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
                  <span>Fastify Node</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Reconciliation
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
                  <span>100% Auto</span>
                  <Check className="w-3.5 h-3.5 text-brand" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION: ACCESS PORTALS SELECTOR */}
        <section id="portals" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand block font-semibold">
              ROLE-BASED DIRECT ACCESS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Choose Your Access Portal
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each stakeholder has a dedicated, secure entry point designed specifically for their operational workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {portalOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  className="group relative rounded-2xl border border-white/[0.06] bg-[#0c0d10] hover:border-brand/40 p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                >
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${opt.accent} rounded-full blur-3xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 uppercase tracking-wider">
                        {opt.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors">
                        {opt.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-zinc-500 block">
                        Quick Demo:
                      </span>
                      <span className="text-xs font-mono text-zinc-300 bg-[#08090a] px-2.5 py-1 rounded-md border border-white/[0.04] inline-block mt-1">
                        {opt.demoInfo}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 relative z-10">
                    <Link href={opt.href} className="w-full">
                      <Button
                        className="w-full h-10 bg-white/[0.04] hover:bg-brand hover:text-carbon-950 text-zinc-200 border border-white/[0.08] font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-between px-4 group-hover:border-brand/40"
                      >
                        <span>{opt.actionLabel}</span>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-carbon-950 transition-colors" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION: SCROLL-BASED STORYTELLING */}
        <section id="storytelling" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand block font-semibold">
              SCROLL-BASED OPERATIONAL NARRATIVE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Anatomy of a Fast Gym
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Explore how GymERP orchestrates high-throughput attendance, real-time rosters, and continuous database isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Story Navigation Rail (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {storyChapters.map((ch, idx) => {
                const isActive = activeStory === idx;
                return (
                  <button
                    key={ch.step}
                    type="button"
                    onClick={() => setActiveStory(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
                      isActive
                        ? "bg-[#0c0d10] border-brand/40 shadow-[0_4px_24px_rgba(62,207,142,0.1)]"
                        : "bg-[#08090a] border-white/[0.04] hover:border-white/[0.08] hover:bg-[#0c0d10]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isActive ? "text-brand" : "text-zinc-500"
                        }`}
                      >
                        {ch.step} // {ch.tag}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        {ch.stat}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {ch.title}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {ch.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Interactive Story Visual Stage (7 cols sticky) */}
            <div className="lg:col-span-7 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex flex-col justify-between">
                {/* Background Ambient Glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

                {/* Chapter 01 Interactive: Turnstile Scanner Viewfinder */}
                {activeStory === 0 && (
                  <motion.div
                    key="turnstile-view"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                        <span className="text-xs font-mono text-zinc-300 font-semibold uppercase">
                          Turnstile Lane 01 • Optical Feed
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        FPS: 60 • ISO: AUTO
                      </span>
                    </div>

                    <div className="bg-[#08090a] rounded-2xl border border-white/[0.06] p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
                      <div className="w-40 h-40 rounded-xl bg-white p-3 shadow-inner flex items-center justify-center relative">
                        <QrCode className="w-32 h-32 text-black" />
                        {simulatedGateState === "scanning" && (
                          <div className="absolute inset-0 bg-brand/20 border-2 border-brand rounded-xl animate-pulse flex items-center justify-center">
                            <span className="text-[10px] font-mono font-bold bg-carbon-950 text-brand px-2 py-0.5 rounded">
                              DECODING 38ms
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          Dynamic Single-Scan Member QR
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Member: Alex Mercer • Plan: All-Access Black Card
                        </p>
                      </div>

                      {simulatedGateState === "unlocked" ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>AUTHORIZATION CONFIRMED • GATE UNLOCKED (38ms)</span>
                        </div>
                      ) : (
                        <Button
                          onClick={handleSimulateScan}
                          disabled={simulatedGateState !== "idle"}
                          className="h-9 px-4 bg-brand text-carbon-950 hover:bg-brand/90 font-bold text-xs rounded-xl"
                        >
                          {simulatedGateState === "scanning" ? "Verifying..." : "Simulate Live Ingress Scan"}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">SCAN DELAY</span>
                        <span className="text-white font-bold">38ms</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">SECURITY</span>
                        <span className="text-emerald-400 font-bold">Anti-Proxy</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">PASS SHARING</span>
                        <span className="text-white font-bold">Blocked</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Chapter 02 Interactive: Class Capacity Locking */}
                {activeStory === 1 && (
                  <motion.div
                    key="class-view"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono text-zinc-300 font-semibold uppercase">
                          Live Studio Schedule Engine
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                        Lock Active
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#08090a] border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            Today • 07:00 AM
                          </span>
                          <h4 className="text-base font-bold text-white">
                            Olympic Powerlifting & Clean Tech
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono">
                            Coach Marcus Ray • Strength Zone
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-white bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                          {demoClassBooked ? "19 / 20" : "18 / 20"} Spots
                        </span>
                      </div>

                      {/* Visual Capacity Bar */}
                      <div className="w-full h-2 rounded-full bg-zinc-900 border border-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-brand transition-all duration-300 rounded-full"
                          style={{ width: demoClassBooked ? "95%" : "90%" }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-zinc-400">
                          {demoClassBooked
                            ? "✓ Spot reserved for Alex Mercer"
                            : "Only 2 spots remaining for this session"}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setDemoClassBooked(!demoClassBooked)}
                          className={`h-8 px-3.5 text-xs font-bold rounded-lg transition-all ${
                            demoClassBooked
                              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900"
                              : "bg-brand text-carbon-950 hover:bg-brand/90"
                          }`}
                        >
                          {demoClassBooked ? "Cancel Spot" : "Simulate Reservation"}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Instant synchronization between athlete mobile reservations, front-desk attendance rosters, and trainer tablets.
                    </p>
                  </motion.div>
                )}

                {/* Chapter 03 Interactive: Autonomous Revenue Ledger */}
                {activeStory === 2 && (
                  <motion.div
                    key="ledger-view"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand" />
                        <span className="text-xs font-mono text-zinc-300 font-semibold uppercase">
                          Autonomous Reconciliation Ledger
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Synced 2s ago
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        {
                          name: "Vikram Malhotra",
                          tier: "Annual Elite Membership",
                          amount: "₹18,500",
                          time: "Just now",
                          status: "Captured",
                        },
                        {
                          name: "Pooja Sharma",
                          tier: "Monthly Unlimited Pass",
                          amount: "₹2,499",
                          time: "14m ago",
                          status: "Settled",
                        },
                        {
                          name: "Rahul Verma",
                          tier: "Quarterly Strength Access",
                          amount: "₹6,999",
                          time: "1h ago",
                          status: "Settled",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#08090a] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white font-sans">{item.name}</p>
                            <p className="text-[11px] text-zinc-500">{item.tier}</p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="font-bold text-white">{item.amount}</p>
                            <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-800/30">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-400 flex items-center justify-between font-mono">
                      <span>Zero Manual Entry: Razorpay & Stripe Webhooks</span>
                      <span className="text-brand font-bold">100% Match</span>
                    </div>
                  </motion.div>
                )}

                {/* Chapter 04 Interactive: Dedicated Node Fastify Engine */}
                {activeStory === 3 && (
                  <motion.div
                    key="daemon-view"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-purple-400" />
                        <span className="text-zinc-300 font-semibold uppercase">
                          Node Fastify Telemetry (:4000)
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>HEALTHY</span>
                      </span>
                    </div>

                    <div className="bg-[#08090a] rounded-2xl border border-white/[0.06] p-4 text-zinc-300 space-y-2 leading-relaxed">
                      <p className="text-zinc-500"># Fastify Runtime Metrics</p>
                      <p>GET /health ───&gt; 200 OK (2ms)</p>
                      <p>POST /api/attendance/scan ───&gt; 200 OK (38ms)</p>
                      <p className="text-emerald-400">
                        PG Pool: 10 connections established • Idle: 8 • Ping: 3ms
                      </p>
                      <p className="text-purple-400">
                        RLS Status: SET LOCAL app.current_tenant_id = &apos;ironpulse_prod&apos;
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">POSTGRES PING</span>
                        <span className="text-emerald-400 font-bold">~3ms</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">MEMORY RSS</span>
                        <span className="text-white font-bold">64 MB</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">ISOLATION</span>
                        <span className="text-purple-400 font-bold">Row-Level</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer Controls for Story Stage */}
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono">
                  <span>Step {activeStory + 1} of 4</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeStory === 0}
                      onClick={() => setActiveStory((prev) => Math.max(0, prev - 1))}
                      className="px-2.5 py-1 rounded bg-white/[0.04] text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={activeStory === storyChapters.length - 1}
                      onClick={() =>
                        setActiveStory((prev) => Math.min(storyChapters.length - 1, prev + 1))
                      }
                      className="px-2.5 py-1 rounded bg-white/[0.04] text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ARCHITECTURE & COMPARISON */}
        <section id="architecture" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand block font-semibold">
              ENGINEERED DIFFERENTLY
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Obsidian Architecture vs. Legacy Gym Software
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Legacy software is bloated with outdated clunky menus and 5-second turnstile lag. GymERP was built for physical gym throughput.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Legacy Column */}
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-4">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">
                Legacy Software (Mindbody, ABC, Zen Planner)
              </span>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>3 to 5 second camera scanning lag creating long peak-hour lines at turnstiles.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Screenshot pass sharing abuse with static barcode/QR graphics.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Manual spreadsheet exporting to reconcile cash, cards, and bank payments.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Over-engineered, washed-out grey interfaces with endless nested dropdowns.</span>
                </li>
              </ul>
            </div>

            {/* GymERP Column */}
            <div className="p-6 rounded-2xl border border-brand/40 bg-emerald-950/10 space-y-4 shadow-[0_0_30px_rgba(62,207,142,0.06)]">
              <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider block">
                GymERP 2.4 (Linear / Supabase Inspired)
              </span>
              <ul className="space-y-3 text-xs text-zinc-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Sub-40ms optical ingress recognition directly through lightweight kiosks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Encrypted dynamic tokens rotated per-scan to eliminate pass fraud.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Automated double-entry ledger with instant Razorpay/Stripe webhook receipts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Pure obsidian dark design with dedicated Node Fastify backend and strict RLS.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA: JUMP IN */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to experience zero-friction gym management?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Test any role immediately with live seeded demo credentials across athletes, desk staff, gym owners, or platform engineers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/portal/login">
              <Button className="h-10 px-5 bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-xl text-xs">
                Athlete Member Pass
              </Button>
            </Link>
            <Link href="/login?preset=staff">
              <Button
                variant="outline"
                className="h-10 px-5 border-white/[0.08] bg-[#0c0d10] text-zinc-200 hover:text-white rounded-xl text-xs"
              >
                Front Desk Scanner
              </Button>
            </Link>
            <Link href="/login?preset=admin">
              <Button
                variant="outline"
                className="h-10 px-5 border-white/[0.08] bg-[#0c0d10] text-zinc-200 hover:text-white rounded-xl text-xs"
              >
                Gym Admin Console
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* MINIMALIST FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#050506] py-12 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand text-carbon-950 flex items-center justify-center font-bold text-xs">
              G
            </div>
            <span className="font-extrabold text-white tracking-widest text-sm">GYMERP</span>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-[11px] text-zinc-400">High-Performance ERP</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span>Daemon: Online</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span>PostgreSQL: RLS Isolated</span>
          </div>

          <p className="text-[11px] text-zinc-500">
            © {new Date().getFullYear()} GymERP. Engineered for physical performance.
          </p>
        </div>
      </footer>

      {/* QUICK PORTAL SELECTOR MODAL */}
      <Dialog open={isPortalModalOpen} onOpenChange={setIsPortalModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-[#0c0d10] border-white/[0.08] rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand" />
              <span>Select Access Portal</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Choose the access portal corresponding to your role at the gym.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {portalOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.id}
                  href={opt.href}
                  onClick={() => setIsPortalModalOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#08090a] border border-white/[0.06] hover:border-brand/40 hover:bg-white/[0.02] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-brand">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-brand transition-colors">
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">{opt.demoInfo}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
