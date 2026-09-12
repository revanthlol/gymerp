"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  QrCode,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Phone,
  ShieldCheck,
  Delete,
  Check,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionUser } from "@/types/auth";
import { toast } from "sonner";

interface LandingPageProps {
  session?: SessionUser | null;
}

export function LandingPage({ session }: LandingPageProps) {
  const router = useRouter();

  // Tablet Simulator States
  const [simTab, setSimTab] = useState<"qr" | "keypad">("qr");
  const [simMode, setSimMode] = useState<"entry" | "exit">("entry");
  const [simState, setSimState] = useState<"idle" | "scanning" | "granted" | "expired">("idle");
  const [simToken, setSimToken] = useState("tk_7f8e9a");
  const [simCountdown, setSimCountdown] = useState(20);
  const [simPhoneNumber, setSimPhoneNumber] = useState("5550192834");

  // Storytelling interactive chapters
  const [activeStoryChapter, setActiveStoryChapter] = useState(0);

  // Hidden Platform Superadmin Backdoor (5-click on footer logo or Ctrl+Shift+P)
  const [secretClicks, setSecretClicks] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        toast.info("Entering Platform Console gateway...");
        router.push("/platform/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleSecretLogoClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 5) {
      toast.success("Platform Superadmin sequence verified");
      router.push("/platform/login");
      setSecretClicks(0);
    } else {
      setTimeout(() => setSecretClicks(0), 2500);
    }
  };

  // Simulate rotating anti-proxy countdown
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
        // Burn nonce and regenerate fresh token immediately
        setSimToken("tk_" + Math.random().toString(36).substring(2, 8));
        setSimCountdown(20);
        setSimState("idle");
      }, 3500);
    }, 650);
  };

  const handleKeypadPress = (val: string) => {
    if (val === "clear") {
      setSimPhoneNumber("");
    } else if (val === "del") {
      setSimPhoneNumber((prev) => prev.slice(0, -1));
    } else if (simPhoneNumber.length < 10) {
      setSimPhoneNumber((prev) => prev + val);
    }
  };

  const formatPhoneNumber = (num: string) => {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `(${num.slice(0, 3)}) ${num.slice(3)}`;
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6, 10)}`;
  };

  // Dedicated 3 Public Portals (Platform console is strictly hidden)
  const loginGateways = [
    {
      id: "member",
      title: "Member & Athlete Pass",
      audience: "Gym Members",
      description:
        "Instant smartphone entry pass, verify active membership, check workout streak records, and register attendance history.",
      icon: Smartphone,
      accent: "from-primary/20 via-primary/5 to-transparent",
      badge: "Members",
      badgeColor: "bg-primary/10 text-primary border-primary/25",
      href: "/portal/login",
      actionLabel: "Launch Member Pass",
      featured: true,
    },
    {
      id: "staff",
      title: "Front Desk & Reception",
      audience: "Receptionists & Trainers",
      description:
        "Rapid attendee check-in, live gym floor occupancy count, register new walk-in signups, and monitor front kiosks.",
      icon: QrCode,
      accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      badge: "Front Desk",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
      href: "/login",
      actionLabel: "Front Desk Sign In",
      featured: false,
    },
    {
      id: "admin",
      title: "Gym Owner & Management",
      audience: "Owners & General Managers",
      description:
        "Full control over membership plans, live recurring revenue analytics, staff roster access, and front-desk check-in stations.",
      icon: LayoutDashboard,
      accent: "from-emerald-500/20 via-teal-500/5 to-transparent",
      badge: "Gym Management",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      href: "/login",
      actionLabel: "Owner Sign In",
      featured: false,
    },
  ];

  const storyChapters = [
    {
      id: "kiosk",
      step: "01",
      tag: "Easy Check-In",
      title: "Instant Phone Check-In at the Door",
      subtitle: "Mount any standard tablet or iPad at your front entrance. Members scan and walk in.",
      description:
        "No proprietary card readers or expensive RFID scanners required. Mount any budget iPad or Android tablet at your front door. Members open their digital pass on their phone, tap it against the scanner, and walk in within 400 milliseconds.",
      metrics: "0.4s Check-in",
      benefit: "No bulky apps or plastic cards to buy",
    },
    {
      id: "crypto",
      step: "02",
      tag: "Stop Pass Sharing",
      title: "Block Pass Screenshots Between Friends",
      subtitle: "Auto-refreshing dynamic passes prevent members from sharing screenshots.",
      description:
        "Traditional barcode cards let gym members screenshot their card and send it to friends to sneak in for free. GymERP rotates every QR token every 20 seconds. Once scanned at the door, that token is verified and invalidated immediately so it cannot be copied.",
      metrics: "Anti-Share",
      benefit: "100% protection against unpaid guest entry",
    },
    {
      id: "dead-battery",
      step: "03",
      tag: "Backup Access",
      title: "Dead Phone? Keypad Backup",
      subtitle: "Nobody gets locked out if their phone battery dies during the day.",
      description:
        "If a member comes straight from a long workday with 0% battery, they simply tap the on-screen keypad on your tablet and enter their phone number. Their photo and membership status pop up instantly, letting your front desk verify them effortlessly.",
      metrics: "100% Reliable",
      benefit: "Zero awkward lockouts or front-desk bottlenecks",
    },
    {
      id: "daemon",
      step: "04",
      tag: "Peak Hour Speed",
      title: "Never Lags During Morning & Evening Rushes",
      subtitle: "Engineered to stay blazing fast even when 50 members arrive simultaneously.",
      description:
        "Old gym software slows down and crashes during 7 AM and 6 PM rush hours. GymERP is powered by an ultra-fast backend architecture with direct connection pooling, verifying check-ins in real time with zero spinning loaders or doorway queues.",
      metrics: "Zero Lag",
      benefit: "Sub-second response under high concurrency",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 selection:bg-primary/30 selection:text-primary font-sans relative overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.2, 0.12],
            x: ["-50%", "-48%", "-50%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-1/2 w-[850px] h-[450px] bg-gradient-to-b from-primary/20 via-emerald-600/10 to-transparent blur-[140px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.06, 0.12, 0.06],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-teal-500/10 to-transparent blur-[130px] rounded-full"
        />
        {/* Subtle dot matrix grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Modern Sticky Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090a]/75 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-lg bg-primary text-[#08090a] flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_18px_rgba(62,207,142,0.35)]"
            >
              G
            </motion.div>
            <span className="font-extrabold text-white text-base tracking-widest leading-none">
              GYMERP
            </span>
          </Link>

          {/* Quick Anchor Jump Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#interactive-kiosk" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Key Capabilities
            </a>
            <a href="#portals" className="hover:text-white transition-colors">
              Portals
            </a>
          </nav>

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
                  className="h-9 px-4 bg-primary text-[#08090a] hover:bg-primary-deep font-semibold text-xs rounded-xl shadow-sm cursor-pointer"
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
                    className="text-xs h-9 px-3.5 text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-xl cursor-pointer"
                  >
                    <span>Staff & Admin</span>
                  </Button>
                </Link>

                {/* Primary Member Login Button */}
                <Link href="/portal/login">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      className="h-9 px-4 bg-primary text-[#08090a] hover:bg-primary-deep font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(62,207,142,0.3)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Member Login</span>
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Experience */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">

          {/* Bold Editorial Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
              Run your gym smoothly. <br />
              <span className="bg-gradient-to-r from-primary via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Stop pass sharing forever.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-normal pt-2">
              The modern management platform for gyms, fitness clubs, and martial arts studios.
              Instant smartphone check-in at the front desk, automatic expired subscription alerts,
              and members can't screenshot passes to sneak friends in.
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3"
          >
            <Link href="/portal/login" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-11 px-7 bg-primary text-[#08090a] font-bold hover:bg-primary-deep rounded-xl shadow-[0_0_25px_rgba(62,207,142,0.3)] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Member Check-In & Login</span>
                </Button>
              </motion.div>
            </Link>

            <a href="#interactive-kiosk" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 border-white/[0.1] bg-[#0c0d10] text-zinc-200 hover:text-white hover:bg-[#14161b] rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>See Live Tablet Simulator</span>
                </Button>
              </motion.div>
            </a>
          </motion.div>

          {/* Live Fleet Telemetry Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-8 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left"
          >
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 block">Check-In Speed</span>
              <span className="text-base font-bold text-white font-mono">&lt;0.4s</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 block">Pass Sharing Protection</span>
              <span className="text-base font-bold text-primary font-mono">100% Active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 block">Token Expiry Nonce</span>
              <span className="text-base font-bold text-white font-mono">20 Seconds</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 block">Hardware Cost</span>
              <span className="text-base font-bold text-emerald-400 font-mono">$0 Setup</span>
            </div>
          </motion.div>
        </section>

        {/* SECTION: INTERACTIVE PHYSICAL KIOSK & SCANNER SIMULATOR */}
        <section id="interactive-kiosk" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <p className="text-xs font-semibold text-primary tracking-wide">
              Live Front Door Simulator
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Test How the Front Door Tablet Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Try both active and expired member scans, or switch to keypad backup mode to see how members check in with a dead phone.
            </p>
          </div>

          {/* Dual Simulator Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Physical Tablet Display (7 cols) */}
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
                {/* Visual Expanding Ripple Effect upon Scan Grant */}
                <AnimatePresence>
                  {simState === "granted" && (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Tablet Hardware Top Status Bar */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-white font-medium">Front Door Tablet</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live Kiosk Display</span>
                  </div>
                </div>

                {/* Tablet Mode Selector (QR Scan vs Keypad Backup) */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <button
                    onClick={() => setSimTab("qr")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      simTab === "qr"
                        ? "bg-white/[0.1] text-primary border border-primary/30 font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white bg-white/[0.02]"
                    }`}
                  >
                    Dynamic QR Scan
                  </button>
                  <button
                    onClick={() => setSimTab("keypad")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      simTab === "keypad"
                        ? "bg-white/[0.1] text-primary border border-primary/30 font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white bg-white/[0.02]"
                    }`}
                  >
                    Dead Phone Keypad Backup
                  </button>
                </div>

                {/* TAB 1: DYNAMIC QR SCANNER DISPLAY */}
                {simTab === "qr" ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className="relative p-4 rounded-2xl bg-white text-[#08090a] shadow-xl">
                      <div className="w-44 h-44 flex flex-col items-center justify-center border-4 border-dashed border-zinc-300 rounded-xl relative overflow-hidden bg-white">
                        <QrCode className="w-36 h-36 text-zinc-950" />
                        {/* Sweeping Laser Beam Animation */}
                        {simState === "scanning" && (
                          <motion.div
                            initial={{ top: 0 }}
                            animate={{ top: "100%" }}
                            transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_12px_#3ecf8e]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Circular / Linear Progress Bar */}
                    <div className="w-56 space-y-1.5 text-center">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>Token: {simToken}</span>
                        <span className="text-primary font-bold">{simCountdown}s remaining</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          style={{ width: `${(simCountdown / 20) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: TACTILE ON-SCREEN KEYPAD BACKUP */
                  <div className="py-2 space-y-4 max-w-[280px] mx-auto">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.08] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">
                        Enter Registered Mobile
                      </span>
                      <span className="font-mono text-base font-bold text-white tracking-wider">
                        {simPhoneNumber ? formatPhoneNumber(simPhoneNumber) : "(___) ___-____"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"].map((key) => (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleKeypadPress(key)}
                          className="h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white font-mono text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer"
                        >
                          {key === "del" ? (
                            <Delete className="w-4 h-4 text-zinc-400" />
                          ) : key === "clear" ? (
                            <span className="text-[10px] text-zinc-400 uppercase">Clear</span>
                          ) : (
                            key
                          )}
                        </motion.button>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleTriggerSimScan("granted")}
                      disabled={simPhoneNumber.length < 10 || simState !== "idle"}
                      className="w-full h-10 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Verify Attendance
                    </Button>
                  </div>
                )}

                {/* Live Feedback Toast Notification */}
                <AnimatePresence>
                  {simState === "granted" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
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
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: [-8, 8, -6, 6, -3, 3, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
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
                  <span className="text-xs font-semibold text-primary">Interactive Controller</span>
                  <h3 className="text-lg font-bold text-white">Test Real Door Scenarios</h3>
                  <p className="text-xs text-zinc-400">
                    Trigger test scans to see how your front door tablet verifies active members and catches unpaid expired accounts.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleTriggerSimScan("granted")}
                      disabled={simState !== "idle"}
                      className="w-full h-11 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Simulate Active Member Scan</span>
                      </span>
                      <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded">
                        Access Granted
                      </span>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleTriggerSimScan("expired")}
                      disabled={simState !== "idle"}
                      variant="outline"
                      className="w-full h-11 border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 font-semibold text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Simulate Expired Member Scan</span>
                      </span>
                      <span className="font-mono text-[10px] bg-red-500/20 px-2 py-0.5 rounded">
                        Red Warning
                      </span>
                    </Button>
                  </motion.div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] text-xs text-zinc-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Pass Sharing Protection:</span>
                    <span className="text-primary font-semibold">Active (Single-Use Token)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Door Response Latency:</span>
                    <span className="text-zinc-200 font-mono">Under 400ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: SEAMLESS SCROLL STORYTELLING CHAPTERS */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-16">
            <p className="text-xs font-semibold text-primary tracking-wide">
              Key Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built Specifically for Real Gym Operations
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Four fundamental reasons gym owners switch to GymERP for reliable door access and member management.
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
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer ${
                      isActive
                        ? "bg-[#0c0d10] border-primary/40 shadow-[0_4px_24px_rgba(62,207,142,0.12)]"
                        : "bg-[#08090a] border-white/[0.04] hover:border-white/[0.08] hover:bg-[#0c0d10]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? "text-primary" : "text-zinc-500"
                        }`}
                      >
                        {ch.step} • {ch.tag}
                      </span>
                      <span className="text-[11px] text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                        {ch.metrics}
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
                    <span className="text-xs font-semibold text-primary">
                      Feature {storyChapters[activeStoryChapter].step} — {storyChapters[activeStoryChapter].tag}
                    </span>
                    <span className="text-xs font-medium text-zinc-300 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
                      {storyChapters[activeStoryChapter].metrics}
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
                <div className="p-4 rounded-2xl bg-[#08090a] border border-white/[0.06] grid grid-cols-2 gap-4 text-xs text-zinc-400 relative z-10">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Door Security</span>
                    <span className="text-white font-semibold">Stops Pass Sharing</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Dead Battery Backup</span>
                    <span className="text-primary font-semibold">Phone Keypad Entry</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Payment Alerts</span>
                    <span className="text-white font-semibold">Instant Red Warning</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Supported Hardware</span>
                    <span className="text-emerald-400 font-semibold">Any Tablet or iPad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: THE THREE PUBLIC GATEWAYS (LOGINS) */}
        <section id="portals" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <p className="text-xs font-semibold text-primary tracking-wide">
              Dedicated Portals
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three Tailored Portals
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each user type enters through a specialized interface crafted specifically for their daily workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loginGateways.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.div
                  key={opt.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative rounded-2xl border p-6 flex flex-col justify-between overflow-hidden bg-[#0c0d10] ${
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
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {opt.title}
                      </h3>
                      <span className="text-xs text-zinc-500 block mt-0.5">
                        For: {opt.audience}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 relative z-10">
                    <Link href={opt.href} className="w-full">
                      <Button
                        className={`w-full h-10 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-between px-4 cursor-pointer ${
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
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Clean Obsidian Footer with Hidden Easter Egg Backdoor */}
      <footer className="border-t border-white/[0.06] bg-[#060708] py-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* Secret Backdoor: 5 clicks on 'G' navigates to /platform/login */}
            <button
              onClick={handleSecretLogoClick}
              title="GymERP Core"
              aria-label="GymERP Core Brand Icon"
              className="w-7 h-7 rounded-lg bg-primary text-[#08090a] flex items-center justify-center font-black text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              G
            </button>
            <div>
              <span className="font-extrabold text-white text-sm tracking-wider block">
                GYMERP
              </span>
              <span className="text-[11px] text-zinc-500">
                Modern Gym Operations & Check-in Verification
              </span>
            </div>
          </div>

          {/* Public Portal Links (Platform Console is NOT exposed here) */}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
