"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Camera,
  Flame,
  Calendar,
  Clock,
  Sparkles,
  LogOut,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  User,
  MapPin,
  ChevronRight,
  RefreshCw,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { memberLogoutAction } from "@/lib/api/member-portal";
import { CameraScannerModal } from "@/components/portal/camera-scanner-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MemberPortalProps {
  data: {
    member: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string;
      status: string;
      joinDate: string;
      qrToken: string;
      passQrUrl: string;
    };
    gym: {
      name: string;
      slug: string;
      phone: string | null;
      contactEmail: string | null;
    };
    activeMembership: {
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      planName: string;
      planPrice: string;
      durationDays: number;
      daysRemaining: number;
    } | null;
    recentAttendance: Array<{
      id: string;
      checkedInAt: Date | string;
      method: string;
      kioskId: string | null;
    }>;
    recentPayments: Array<{
      id: string;
      amount: string;
      method: string;
      status: string;
      paidAt: Date | string | null;
      createdAt: Date | string;
      notes: string | null;
    }>;
    stats: {
      totalWorkouts: number;
      workoutsThisMonth: number;
      daysRemaining: number;
    };
  };
}

export function MemberPortalView({ data }: MemberPortalProps) {
  const router = useRouter();
  const { member, gym, activeMembership, recentAttendance, recentPayments, stats } = data;

  const [activeTab, setActiveTab] = useState<"pass" | "classes" | "history">("pass");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [bookedClasses, setBookedClasses] = useState<string[]>(["c1"]);

  const classesList = [
    {
      id: "c1",
      name: "HIIT Performance & Conditioning",
      time: "07:00 AM - 08:00 AM",
      trainer: "Coach Marcus",
      location: "Studio 1",
      spotsLeft: 4,
    },
    {
      id: "c2",
      name: "Functional Strength & Deadlifts",
      time: "12:00 PM - 01:00 PM",
      trainer: "Coach Elena",
      location: "Weight Room",
      spotsLeft: 2,
    },
    {
      id: "c3",
      name: "Boxing Sparring & Heavy Bags",
      time: "06:30 PM - 07:30 PM",
      trainer: "Coach Devon",
      location: "Combat Ring",
      spotsLeft: 6,
    },
  ];

  const handleToggleClass = (classId: string, className: string) => {
    if (bookedClasses.includes(classId)) {
      setBookedClasses((prev) => prev.filter((id) => id !== classId));
      toast.info(`Booking cancelled for ${className}`);
    } else {
      setBookedClasses((prev) => [...prev, classId]);
      toast.success(`Spot reserved for ${className}!`);
    }
  };

  const isMemberActive = member.status === "active";

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 pb-28 md:pb-16 relative overflow-x-hidden">
      {/* Background Dynamic Ambient Glow Meshes */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-primary/15 via-emerald-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Camera Scanner Modal Component */}
      <CameraScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={() => {
          router.refresh();
        }}
      />

      {/* Floating Frosted Glass Top Navigation Bar */}
      <header className="fixed top-3 sm:top-4 left-3 right-3 max-w-5xl md:mx-auto z-40 h-14 rounded-2xl px-4 sm:px-6 bg-white/40 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-zinc-200/70 dark:border-white/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground flex items-center justify-center font-black text-sm shadow-[0_0_14px_rgba(62,207,142,0.3)]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-foreground text-xs sm:text-sm tracking-wider leading-none block">
              GYMERP
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block leading-tight truncate">
              {gym.name}
            </span>
          </div>
        </div>

        {/* Desktop Tab Switcher */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("pass")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "pass"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Athlete Card
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "classes"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Classes ({bookedClasses.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Workout Log
          </button>
        </nav>

        {/* Top Right: Instant Scan Button + Theme + User / Logout */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setScannerOpen(true)}
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 px-3 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Kiosk</span>
          </Button>

          <ThemeToggle />

          <form action={memberLogoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 space-y-6">
        {/* Athlete Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Hey, {member.fullName.split(" ")[0]}</span>
              <span className="text-primary">⚡</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Ready for today&apos;s workout session at {gym.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isMemberActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Member</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="capitalize">{member.status} Pass</span>
              </span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ATHLETE CARD & PASS VIEW */}
        {/* ============================================================ */}
        {activeTab === "pass" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Apple Wallet-Style Digital Athlete Pass (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 rounded-3xl border border-white/[0.12] bg-gradient-to-br from-[#12141a] via-[#0d0f14] to-[#08090c] shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between min-h-[340px] space-y-6"
              >
                {/* Ambient Metallic Shine Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Card Top: Gym Branding & Plan Badge */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary text-[#08090a] flex items-center justify-center font-black text-base shadow-[0_0_14px_rgba(62,207,142,0.4)]">
                      G
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-wider text-white block">
                        {gym.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-primary block">
                        Verified Athlete Pass
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/[0.06] border border-white/[0.1] text-zinc-200">
                    {activeMembership?.planName || "Active Plan"}
                  </span>
                </div>

                {/* Card Middle: Athlete Name & Details */}
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                    Athlete Name
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {member.fullName}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 pt-0.5">
                    <span>ID: #{member.id.slice(0, 8).toUpperCase()}</span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {activeMembership ? `${activeMembership.daysRemaining} Days Left` : "Active"}
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Primary Scan Kiosk Action & Backup QR Button */}
                <div className="relative z-10 pt-4 border-t border-white/[0.08] space-y-2.5">
                  {/* Big Glowing Camera Scan Action */}
                  <Button
                    onClick={() => setScannerOpen(true)}
                    className="w-full h-11 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-sm rounded-xl gap-2 shadow-[0_0_24px_rgba(62,207,142,0.4)] cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Kiosk QR to Check In</span>
                  </Button>

                  {/* Secondary Toggle: Show Personal Backup Barcode / QR */}
                  <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                    <DialogTrigger asChild>
                      <button className="w-full text-center text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 py-1 cursor-pointer">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Show Front-Desk Scanner Barcode</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm bg-[#0c0d12] border-white/[0.1] text-center space-y-4">
                      <DialogHeader>
                        <DialogTitle className="text-white text-base">Personal Member Barcode</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-400">
                          For front-desk staff scanning with physical handheld barcode guns.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="p-4 bg-white rounded-2xl mx-auto shadow-2xl">
                        <img
                          src={member.passQrUrl}
                          alt="Personal Member Pass QR"
                          className="w-48 h-48 object-contain mx-auto select-none"
                        />
                      </div>

                      <div className="text-xs font-mono text-zinc-400">
                        Pass #{member.id.slice(0, 8).toUpperCase()}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>

              {/* Gym Location & Contact Helper */}
              <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] text-xs text-zinc-400 space-y-2">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Facility Access</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Present your phone at the front-desk kiosk when arriving. Your check-in automatically verifies your pass validity.
                </p>
              </div>
            </div>

            {/* Quick Stat Tiles & Membership Breakdown (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-white">{stats.totalWorkouts}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Workouts
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-white">{stats.workoutsThisMonth}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    This Month
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {activeMembership ? activeMembership.daysRemaining : 0}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Days Active
                  </div>
                </div>
              </div>

              {/* Active Plan Card */}
              {activeMembership ? (
                <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Active Membership
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                      ₹{activeMembership.planPrice}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">{activeMembership.planName}</span>
                      <span className="text-zinc-300 font-mono">
                        Expires {new Date(activeMembership.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress Bar of Plan Validity */}
                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/[0.06]">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              ((activeMembership.durationDays - activeMembership.daysRemaining) /
                                activeMembership.durationDays) *
                                100
                            )
                          )}%`,
                        }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-primary rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No Active Plan Assigned</p>
                  <p className="text-xs text-zinc-400">
                    Contact your gym administrator to activate or renew your pass.
                  </p>
                </div>
              )}

              {/* Today's Recommended Fitness Classes */}
              <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Today&apos;s Sessions
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("classes")}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {classesList.slice(0, 2).map((cls) => {
                    const isBooked = bookedClasses.includes(cls.id);
                    return (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-xs text-white">{cls.name}</p>
                          <p className="text-[11px] text-zinc-400">
                            {cls.time} • {cls.trainer}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleToggleClass(cls.id, cls.name)}
                          className={`h-7 px-3 text-[11px] rounded-lg font-semibold transition-all ${
                            isBooked
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-primary hover:bg-primary-deep text-[#08090a]"
                          }`}
                        >
                          {isBooked ? "Reserved" : "Book"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CLASSES SCHEDULE VIEW */}
        {/* ============================================================ */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Daily Workout Classes</h2>
                  <p className="text-xs text-zinc-400">
                    Reserve your slot with trainers. Drop in with your active membership pass.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {bookedClasses.length} Booked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classesList.map((cls) => {
                  const isBooked = bookedClasses.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                          {cls.location}
                        </span>
                        <h3 className="font-bold text-sm text-white">{cls.name}</h3>
                        <p className="text-xs text-zinc-400 font-medium">{cls.time}</p>
                        <p className="text-xs text-zinc-500 font-mono">Trainer: {cls.trainer}</p>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">{cls.spotsLeft} spots left</span>
                        <Button
                          size="sm"
                          onClick={() => handleToggleClass(cls.id, cls.name)}
                          className={`h-8 px-3.5 text-xs rounded-xl font-bold transition-all ${
                            isBooked
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-primary hover:bg-primary-deep text-[#08090a]"
                          }`}
                        >
                          {isBooked ? "Cancel Spot" : "Reserve"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: WORKOUT HISTORY & RECENT ATTENDANCE */}
        {/* ============================================================ */}
        {activeTab === "history" && (
          <div className="space-y-5">
            <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Check-Ins & Gate Logs
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {recentAttendance.length} records
                </span>
              </div>

              {recentAttendance.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-500">
                  No attendance history recorded yet. Scan at the front-desk kiosk on your next visit!
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {recentAttendance.map((log) => {
                    const isExit = log.method.includes("exit");
                    return (
                      <div
                        key={log.id}
                        className="py-3 flex items-center justify-between text-xs hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isExit
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            <Dumbbell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {isExit ? "Workout Completed" : "Session Check-In"}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {new Date(log.checkedInAt).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <p className="text-zinc-300">
                            {new Date(log.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span
                            className={`text-[10px] uppercase font-semibold ${
                              isExit ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {isExit ? "Exit" : "Entry"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Ledger Section */}
            <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Membership Invoices & Receipts
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {recentPayments.length} transactions
                </span>
              </div>

              {recentPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No payment invoices found.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between text-xs hover:bg-white/[0.02] px-2 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-white capitalize">{p.method} Payment</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <p className="text-white font-bold">₹{p.amount}</p>
                        <span className="text-[10px] uppercase text-emerald-400 font-semibold">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* iOS-STYLE MOBILE STICKY BOTTOM ICON NAVBAR */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#07080a]/90 backdrop-blur-2xl border-t border-white/[0.08] px-6 py-2 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.7)]">
        {/* Tab 1: Pass */}
        <button
          onClick={() => setActiveTab("pass")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 ${
            activeTab === "pass" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Pass</span>
        </button>

        {/* Center Tab: Elevated High-Energy Scan Kiosk Button */}
        <button
          onClick={() => setScannerOpen(true)}
          className="relative -top-3 flex flex-col items-center cursor-pointer group"
          title="Scan Kiosk QR"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-[#08090a] flex items-center justify-center shadow-[0_0_24px_rgba(62,207,142,0.5)] group-active:scale-95 transition-transform">
            <Camera className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1">Scan</span>
        </button>

        {/* Tab 2: Classes */}
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 relative ${
            activeTab === "classes" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Classes</span>
          {bookedClasses.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {/* Tab 3: History */}
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 ${
            activeTab === "history" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">History</span>
        </button>
      </div>
    </div>
  );
}
