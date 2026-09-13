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
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionUser } from "@/types/auth";
import { toast } from "sonner";

interface LandingPageProps {
  session?: SessionUser | null;
}

export function LandingPage({ session }: LandingPageProps) {
  const router = useRouter();

  // Tablet Simulator States
  const [simTab, setSimTab] = useState<"qr" | "keypad">("qr");
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

  // Dedicated 3 Public Portals
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
      badgeVariant: "success" as const,
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
      accent: "from-sky-500/20 via-sky-500/5 to-transparent",
      badge: "Front Desk",
      badgeVariant: "secondary" as const,
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
      badgeVariant: "outline" as const,
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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-[140px] rounded-full dark:opacity-100 opacity-60" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[400px] bg-gradient-to-tr from-sky-500/10 via-teal-500/5 to-transparent blur-[130px] rounded-full dark:opacity-100 opacity-50" />
      </div>

      {/* Floating Frosted Glass Navbar */}
      <div className="sticky top-3 sm:top-4 z-50 w-full px-4 sm:px-6">
        <header className="max-w-5xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-zinc-200/70 dark:border-white/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
              G
            </div>
            <span className="font-extrabold text-foreground text-sm tracking-wider leading-none">
              GYMERP
            </span>
          </Link>

          {/* Nav Anchor Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
            <a href="#interactive-kiosk" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              Capabilities
            </a>
            <a href="#portals" className="hover:text-foreground transition-colors">
              Portals
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

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
                  className="h-8 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    <span>Staff</span>
                  </Button>
                </Link>

                <Link href="/portal/login">
                  <Button
                    size="sm"
                    className="h-8 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Smartphone className="size-3.5" />
                    <span>Member Login</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Main Experience */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-xs font-normal border-border bg-card/60 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span>Multi-Tenant Gym Operations & Dynamic Door Passes</span>
          </Badge>

          {/* Bold Editorial Headline */}
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
              Run your gym smoothly. <br />
              <span className="bg-gradient-to-r from-emerald-600 via-primary to-teal-500 bg-clip-text text-transparent">
                Stop pass sharing forever.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed font-normal pt-2">
              The modern management platform for fitness clubs, dojos, and gyms.
              Instant smartphone check-in at the front desk, automatic expired subscription alerts,
              and members can&apos;t screenshot passes to sneak friends in.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
            <Link href="/portal/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-7 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 rounded-xl shadow-xs text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="size-4" />
                <span>Member Check-In & Login</span>
              </Button>
            </Link>

            <a href="#interactive-kiosk" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-6 border-border bg-card/70 hover:bg-muted text-foreground rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="size-4 text-primary" />
                <span>See Live Tablet Simulator</span>
              </Button>
            </a>
          </div>

          {/* Fleet Telemetry Strip */}
          <div className="pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs">
              <span className="text-[11px] text-muted-foreground block">Check-In Speed</span>
              <span className="text-base font-bold text-foreground font-mono">&lt;0.4s</span>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs">
              <span className="text-[11px] text-muted-foreground block">Pass Protection</span>
              <span className="text-base font-bold text-primary font-mono">100% Active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs">
              <span className="text-[11px] text-muted-foreground block">Token Expiry Nonce</span>
              <span className="text-base font-bold text-foreground font-mono">20 Seconds</span>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs">
              <span className="text-[11px] text-muted-foreground block">Hardware Cost</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">$0 Setup</span>
            </div>
          </div>
        </section>

        {/* SECTION: INTERACTIVE PHYSICAL KIOSK & SCANNER SIMULATOR */}
        <section id="interactive-kiosk" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 mb-10">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Live Front Door Simulator
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Test How the Front Door Tablet Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Try both active and expired member scans, or switch to keypad backup mode to see how members check in with a dead phone.
            </p>
          </div>

          {/* Dual Simulator Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Physical Tablet Display (7 cols) */}
            <div className="lg:col-span-7">
              <div
                className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden bg-card shadow-xl ${
                  simState === "granted"
                    ? "border-primary shadow-[0_0_40px_rgba(62,207,142,0.2)]"
                    : simState === "expired"
                    ? "border-destructive shadow-[0_0_40px_rgba(239,68,68,0.2)]"
                    : "border-border"
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
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">Front Door Tablet</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Clock className="size-3.5" />
                    <span>Live Kiosk Display</span>
                  </div>
                </div>

                {/* Tablet Mode Selector (QR Scan vs Keypad Backup) */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <button
                    onClick={() => setSimTab("qr")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      simTab === "qr"
                        ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-muted/40"
                    }`}
                  >
                    Dynamic QR Scan
                  </button>
                  <button
                    onClick={() => setSimTab("keypad")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      simTab === "keypad"
                        ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-muted/40"
                    }`}
                  >
                    Dead Phone Keypad Backup
                  </button>
                </div>

                {/* TAB 1: DYNAMIC QR SCANNER DISPLAY */}
                {simTab === "qr" ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className="relative p-4 rounded-2xl bg-white text-zinc-950 shadow-md border border-border">
                      <div className="w-44 h-44 flex flex-col items-center justify-center border-4 border-dashed border-zinc-300 rounded-xl relative overflow-hidden bg-white">
                        <QrCode className="size-36 text-zinc-950" />
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

                    {/* Progress Bar */}
                    <div className="w-56 space-y-1.5 text-center">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                        <span>Token: {simToken}</span>
                        <span className="text-primary font-bold">{simCountdown}s remaining</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
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
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                        Enter Registered Mobile
                      </span>
                      <span className="font-mono text-base font-bold text-foreground tracking-wider">
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
                          className="h-10 rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground font-mono text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer"
                        >
                          {key === "del" ? (
                            <Delete className="size-4 text-muted-foreground" />
                          ) : key === "clear" ? (
                            <span className="text-[10px] text-muted-foreground uppercase">Clear</span>
                          ) : (
                            key
                          )}
                        </motion.button>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleTriggerSimScan("granted")}
                      disabled={simPhoneNumber.length < 10 || simState !== "idle"}
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl cursor-pointer"
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
                      className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>WELCOME IN • ALEX VANCE (Active Membership)</span>
                    </motion.div>
                  )}
                  {simState === "expired" && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: [-8, 8, -6, 6, -3, 3, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mt-4 p-3.5 rounded-xl bg-destructive/15 border border-destructive/40 text-center flex items-center justify-center gap-2 text-xs font-semibold text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>MEMBERSHIP EXPIRED • PLEASE RENEW AT FRONT DESK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Interactive Test Triggers (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card className="p-6 border border-border bg-card shadow-xs flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">Interactive Controller</span>
                  <h3 className="text-lg font-bold text-foreground">Test Real Door Scenarios</h3>
                  <p className="text-xs text-muted-foreground">
                    Trigger test scans to see how your front door tablet verifies active members and catches unpaid expired accounts.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    onClick={() => handleTriggerSimScan("granted")}
                    disabled={simState !== "idle"}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="size-4" />
                      <span>Simulate Active Member Scan</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      Access Granted
                    </Badge>
                  </Button>

                  <Button
                    onClick={() => handleTriggerSimScan("expired")}
                    disabled={simState !== "idle"}
                    variant="outline"
                    className="w-full h-11 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="size-4" />
                      <span>Simulate Expired Member Scan</span>
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      Red Warning
                    </Badge>
                  </Button>
                </div>

                <div className="pt-3 border-t border-border text-xs text-muted-foreground flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>Pass Sharing Protection:</span>
                    <span className="text-primary font-semibold">Active (Single-Use Token)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Door Response Latency:</span>
                    <span className="text-foreground font-mono">Under 400ms</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION: SEAMLESS SCROLL STORYTELLING CHAPTERS */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Key Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Built Specifically for Real Gym Operations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Four fundamental reasons gym owners switch to GymERP for reliable door access and member management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Story Navigation Rail (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {storyChapters.map((ch, idx) => {
                const isActive = activeStoryChapter === idx;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveStoryChapter(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer ${
                      isActive
                        ? "bg-card border-primary/40 shadow-sm"
                        : "bg-muted/30 border-border/60 hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {ch.step} • {ch.tag}
                      </span>
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {ch.metrics}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-foreground">{ch.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {ch.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Story Dynamic Content Display (7 cols) */}
            <div className="lg:col-span-7">
              <Card className="p-7 sm:p-9 border border-border bg-card relative overflow-hidden flex flex-col justify-between shadow-lg min-h-[380px] gap-6">
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      Feature {storyChapters[activeStoryChapter].step} — {storyChapters[activeStoryChapter].tag}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground px-2.5 py-1 rounded-md bg-muted border border-border">
                      {storyChapters[activeStoryChapter].metrics}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    {storyChapters[activeStoryChapter].title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                    {storyChapters[activeStoryChapter].description}
                  </p>
                </div>

                {/* Practical Gym Benefits Box */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground relative z-10">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Door Security</span>
                    <span className="text-foreground font-semibold">Stops Pass Sharing</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Dead Battery Backup</span>
                    <span className="text-primary font-semibold">Phone Keypad Entry</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Payment Alerts</span>
                    <span className="text-foreground font-semibold">Instant Red Warning</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Supported Hardware</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Any Tablet or iPad</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION: THREE PUBLIC GATEWAYS (LOGINS) */}
        <section id="portals" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Dedicated Portals
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Three Tailored Portals
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Specialized entry interfaces crafted specifically for each daily workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loginGateways.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card
                  key={opt.id}
                  className={`group relative border p-6 flex flex-col justify-between overflow-hidden bg-card transition-all duration-200 shadow-xs hover:shadow-md ${
                    opt.featured
                      ? "border-primary/40 hover:border-primary"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Icon className="size-5" />
                      </div>
                      <Badge variant={opt.badgeVariant}>
                        {opt.badge}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {opt.title}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        For: {opt.audience}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 relative z-10">
                    <Link href={opt.href} className="w-full">
                      <Button
                        className={`w-full h-10 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-between px-4 cursor-pointer ${
                          opt.featured
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                        }`}
                      >
                        <span>{opt.actionLabel}</span>
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer with Hidden Easter Egg Backdoor */}
      <footer className="border-t border-border bg-muted/20 py-12 px-4 sm:px-6 relative z-10">
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
            <div className="flex flex-col">
              <span className="font-extrabold text-foreground text-sm tracking-wider block">
                GYMERP
              </span>
              <span className="text-[11px] text-muted-foreground">
                Modern Gym Operations & Check-in Verification
              </span>
            </div>
          </div>

          {/* Public Portal Links (Platform Console is NOT exposed here) */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
            <Link href="/portal/login" className="hover:text-foreground transition-colors text-primary font-semibold">
              Member Portal
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
