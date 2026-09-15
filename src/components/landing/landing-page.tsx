"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Smartphone,
  QrCode,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ShieldCheck,
  Check,
  Sparkles,
  Users,
  CreditCard,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionUser } from "@/types/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  session?: SessionUser | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export function LandingPage({ session }: LandingPageProps) {
  const router = useRouter();

  // Tablet Simulator States
  const [simTab, setSimTab] = useState<"qr" | "keypad">("qr");
  const [simState, setSimState] = useState<"idle" | "scanning" | "granted" | "expired">("idle");
  const [simToken, setSimToken] = useState("tk_7f8e9a");
  const [simCountdown, setSimCountdown] = useState(20);
  const [simPhoneNumber, setSimPhoneNumber] = useState("5550192834");

  // Secret Platform Superadmin Backdoor (5-click on footer logo or Ctrl+Shift+P)
  const [secretClicks, setSecretClicks] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Simulate rotating token countdown
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
        setSimToken("tk_" + Math.random().toString(36).substring(2, 8));
        setSimCountdown(20);
        setSimState("idle");
      }, 3200);
    }, 600);
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

  const benefits = [
    {
      title: "Smart Phone Passes",
      description: "Members check in with their phone. Auto-refreshing tokens prevent members from sharing screenshots with unpaid friends.",
      metric: "<0.4s",
      metricLabel: "Door check-in speed",
      icon: Smartphone,
    },
    {
      title: "Live Attendance & Headcount",
      description: "See who walked through the doors today. Zero lag during 7 AM and 6 PM rush hours with real-time occupancy logging.",
      metric: "100% Live",
      metricLabel: "Headcount accuracy",
      icon: Users,
    },
    {
      title: "Automated Fees & Renewals",
      description: "Collect dues, freeze passes, and instantly catch expired subscriptions at the turnstile before members enter.",
      metric: "Zero Leaks",
      metricLabel: "Revenue protection",
      icon: CreditCard,
    },
  ];

  const portals = [
    {
      id: "member",
      title: "Member Portal",
      audience: "Gym Members & Athletes",
      description: "Instant mobile access pass, attendance streak records, and membership status right on their phone.",
      icon: Smartphone,
      href: "/member/login",
      actionLabel: "Launch Member Pass",
      primary: true,
    },
    {
      id: "staff",
      title: "Front Desk & Reception",
      audience: "Desk Staff & Trainers",
      description: "Rapid attendee lookup, live gym floor headcount, new client onboarding, and physical kiosk monitoring.",
      icon: QrCode,
      href: "/login",
      actionLabel: "Front Desk Sign In",
      primary: false,
    },
    {
      id: "admin",
      title: "Owner & Management",
      audience: "Gym Owners & General Managers",
      description: "Tiered membership plans, recurring revenue insights, staff permissions, and complete facility controls.",
      icon: LayoutDashboard,
      href: "/login",
      actionLabel: "Owner Sign In",
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      {/* Subtle ambient gradient mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-primary/10 blur-[130px] rounded-full dark:opacity-80 opacity-50" />
      </div>

      {/* Navigation Bar — Floating Frosted Glass treatment matching Admin Portal */}
      <div className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center">
        <header
          className={cn(
            "w-full max-w-6xl h-14 sm:h-16 rounded-2xl px-4 sm:px-6 pointer-events-auto flex items-center justify-between transition-all duration-300 ease-out",
            isScrolled
              ? "bg-background/80 dark:bg-black/60 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)_contrast(105%)] border border-border/90 dark:border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
              : "bg-background/60 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-border/70 dark:border-white/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shadow-sm transition-transform group-hover:scale-105">
              G
            </div>
            <span className="font-bold text-foreground text-sm tracking-wide">
              GYMERP
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#benefits" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#kiosk-demo" className="hover:text-foreground transition-colors">
              Front Door Demo
            </a>
            <a href="#portals" className="hover:text-foreground transition-colors">
              Portals
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link href={session.role === "admin" ? "/admin" : session.role === "staff" ? "/staff" : "/member"}>
                <Button
                  size="sm"
                  className="relative overflow-hidden rounded-full h-9 px-4 font-semibold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 group"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="size-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-9 px-4 font-semibold text-xs hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-border"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-5"
          >
            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.12]"
            >
              Run Your Gym,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                Not Spreadsheets.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
            >
              Member check-ins, automated renewals, and live front-desk access — all in one modern platform. No bulky apps, no paper cards, and zero unpaid entries.
            </motion.p>

            {/* Action CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full max-w-md"
            >
              <Link href="/member/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 font-semibold text-sm rounded-xl gap-2 shadow-sm"
                >
                  <Smartphone className="size-4" />
                  <span>Launch Member Pass</span>
                </Button>
              </Link>

              <a href="#kiosk-demo" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 text-foreground rounded-xl text-sm gap-2"
                >
                  <QrCode className="size-4 text-primary" />
                  <span>Try Front Door Simulator</span>
                </Button>
              </a>
            </motion.div>

            {/* Hardware & Latency Telemetry */}
            <motion.div
              variants={itemVariants}
              className="pt-12 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-left"
            >
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Check-In Speed</span>
                <span className="text-lg font-bold text-foreground font-mono">&lt;0.4s</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Pass Sharing</span>
                <span className="text-lg font-bold text-primary font-mono">100% Blocked</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Token Refresh</span>
                <span className="text-lg font-bold text-foreground font-mono">20 Seconds</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Hardware Setup</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">Any Tablet</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* BENEFITS STRIP */}
        <section id="benefits" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Built For Gyms
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
              Everything Your Front Desk Needs Every Day
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Designed with direct feedback from gym owners, trainers, and athletes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{b.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                  <div className="pt-4 border-t border-border flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">{b.metricLabel}</span>
                    <span className="text-sm font-bold text-primary font-mono">{b.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INTERACTIVE TABLET KIOSK SIMULATOR */}
        <section id="kiosk-demo" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Interactive Test
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
              Test How the Front Door Tablet Works
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Mount any iPad or Android tablet at your turnstile. Tap the buttons below to simulate real active and expired check-ins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Tablet Display (7 cols) */}
            <div className="lg:col-span-7">
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden bg-card shadow-lg ${
                  simState === "granted"
                    ? "border-primary"
                    : simState === "expired"
                    ? "border-destructive"
                    : "border-border"
                }`}
              >
                {/* Tablet Hardware Top Status */}
                <div className="flex items-center justify-between border-b border-border pb-3 mb-5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">Front Entrance Station #01</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Clock className="size-3.5" />
                    <span>Live Scanner</span>
                  </div>
                </div>

                {/* Tablet Mode Selector */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <button
                    onClick={() => setSimTab("qr")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      simTab === "qr"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-muted/60"
                    }`}
                  >
                    Dynamic QR Scan
                  </button>
                  <button
                    onClick={() => setSimTab("keypad")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      simTab === "keypad"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-muted/60"
                    }`}
                  >
                    Keypad Backup (Dead Phone)
                  </button>
                </div>

                {/* TAB 1: QR SCANNER */}
                {simTab === "qr" ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className="relative p-4 rounded-xl bg-white text-zinc-950 shadow-sm border border-border">
                      <div className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg relative overflow-hidden bg-white">
                        <QrCode className="size-32 text-zinc-950" />
                        {/* Laser Scan Line */}
                        {simState === "scanning" && (
                          <motion.div
                            initial={{ top: 0 }}
                            animate={{ top: "100%" }}
                            transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-primary shadow-sm"
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        Token: <span className="text-foreground font-semibold">{simToken}</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Rotates in <span className="text-primary font-bold">{simCountdown}s</span> • Stops screenshots
                      </p>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: KEYPAD BACKUP */
                  <div className="max-w-xs mx-auto py-2 space-y-3">
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-center font-mono text-base font-semibold tracking-wider text-foreground">
                      {formatPhoneNumber(simPhoneNumber) || "Enter Phone Number"}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"].map((key) => (
                        <button
                          key={key}
                          onClick={() => handleKeypadPress(key)}
                          className="h-10 rounded-lg bg-muted/80 hover:bg-muted text-foreground text-xs font-semibold border border-border transition-colors flex items-center justify-center cursor-pointer"
                        >
                          {key === "del" ? "⌫" : key === "clear" ? "C" : key}
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleTriggerSimScan("granted")}
                      disabled={simPhoneNumber.length < 10 || simState !== "idle"}
                      className="w-full h-9 font-semibold text-xs rounded-lg"
                    >
                      Verify Attendance
                    </Button>
                  </div>
                )}

                {/* Live Feedback Banner */}
                <AnimatePresence>
                  {simState === "granted" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>ACCESS GRANTED • ALEX VANCE (Active Membership)</span>
                    </motion.div>
                  )}
                  {simState === "expired" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-center flex items-center justify-center gap-2 text-xs font-medium text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>MEMBERSHIP EXPIRED • PLEASE RENEW AT FRONT DESK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Test Triggers (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-4">
                <div>
                  <span className="text-xs font-semibold text-primary">Interactive Controller</span>
                  <h3 className="text-base font-semibold text-foreground mt-0.5">Test Live Scenarios</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Trigger simulated scans to see how the turnstile verifies passes and alerts expired accounts.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    onClick={() => handleTriggerSimScan("granted")}
                    disabled={simState !== "idle"}
                    className="w-full h-10 font-semibold text-xs rounded-xl flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="size-4" />
                      <span>Simulate Active Member</span>
                    </span>
                    <span className="text-[11px] font-mono opacity-80">Grant Access</span>
                  </Button>

                  <Button
                    onClick={() => handleTriggerSimScan("expired")}
                    disabled={simState !== "idle"}
                    variant="outline"
                    className="w-full h-10 border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs rounded-xl flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="size-4" />
                      <span>Simulate Expired Member</span>
                    </span>
                    <span className="text-[11px] font-mono opacity-80">Red Alert</span>
                  </Button>
                </div>

                <div className="pt-3 border-t border-border text-xs text-muted-foreground flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>Anti-Sharing Engine:</span>
                    <span className="text-primary font-semibold">Active Nonce</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Door Response Latency:</span>
                    <span className="text-foreground font-mono">&lt; 400ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE DEDICATED PORTALS */}
        <section id="portals" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Gateways
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
              Three Dedicated Portals
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tailored interfaces built for athletes, front-desk staff, and facility owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portals.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between bg-card transition-all duration-200 ${
                    p.primary
                      ? "border-primary/40 hover:border-primary shadow-sm"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {p.audience}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {p.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link href={p.href} className="w-full">
                      <Button
                        className={`w-full h-10 font-semibold text-xs rounded-xl flex items-center justify-between px-4 ${
                          p.primary
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                        }`}
                      >
                        <span>{p.actionLabel}</span>
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-muted/20 py-10 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* Secret Backdoor: 5 clicks on 'G' navigates to /platform/login */}
            <button
              onClick={handleSecretLogoClick}
              title="GymERP Core"
              aria-label="GymERP Core Brand Icon"
              className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              G
            </button>
            <div>
              <span className="font-bold text-foreground text-sm tracking-wide block">
                GYMERP
              </span>
              <span className="text-xs text-muted-foreground">
                Modern Gym Operations & Access Verification
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
            <Link href="/member/login" className="hover:text-foreground transition-colors text-primary font-semibold">
              Member Pass
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Staff & Admin
            </Link>
            <Link href="/staff/kiosk" target="_blank" className="hover:text-foreground transition-colors">
              Physical Kiosk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
