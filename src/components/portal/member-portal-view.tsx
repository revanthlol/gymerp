"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  QrCode,
  Flame,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  User,
  Users,
  MapPin,
  RefreshCw,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { memberLogoutAction } from "@/lib/api/member-portal";
import { toast } from "sonner";

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
  const { member, gym, activeMembership, recentAttendance, recentPayments, stats } = data;
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
      toast.success(`Spot reserved for ${className}! See you there.`);
    }
  };

  const isMemberActive = member.status === "active";

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-100 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md glow-bar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand text-carbon-950 flex items-center justify-center font-black text-sm shadow-[0_0_14px_rgba(118,185,0,0.3)]">
              G
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-wider leading-none">
                GRYM
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block leading-tight truncate">
                {gym.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              <User className="w-3.5 h-3.5 text-brand" />
              <span className="font-medium text-white">{member.fullName}</span>
            </div>

            <form action={memberLogoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Welcome & Member Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Welcome back, {member.fullName.split(" ")[0]}</span>
              <span className="text-brand">⚡</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Your digital athlete pass, workout stats, and scheduled fitness classes.
            </p>
          </div>

          <div>
            {isMemberActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Member</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-mono font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="capitalize">{member.status} Pass</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Grid: Digital Pass on Left, Subscription & Streaks on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Digital Member Pass Card (5 cols) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-6 rounded-3xl border border-brand/30 bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950/90 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-5"
            >
              {/* Card Ambient Glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand/20 rounded-full blur-3xl pointer-events-none" />

              {/* Pass Header */}
              <div className="w-full flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="text-left">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Digital Pass
                  </span>
                  <span className="text-sm font-bold text-white">{gym.name}</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* High-Resolution Personal QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-2xl relative group">
                <img
                  src={member.passQrUrl}
                  alt="Member Check-in Pass QR"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain select-none"
                />
              </div>

              {/* Pass Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">Scan at Gym Entrance Kiosk</p>
                <p className="text-[11px] text-zinc-400">
                  Hold this code up to the front-desk scanner camera for immediate entry.
                </p>
              </div>

              {/* Member Pass Footer Details */}
              <div className="w-full pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-left text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Athlete</span>
                  <span className="text-white font-semibold truncate block">{member.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Member Since</span>
                  <span className="text-zinc-300 block">
                    {new Date(member.joinDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Stats, Subscription, Schedule (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel p-4 rounded-2xl border-zinc-800/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-1">
                  <Flame className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-white font-mono">
                  {stats.workoutsThisMonth}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">This Month</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border-zinc-800/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-1">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-brand font-mono">
                  {stats.totalWorkouts}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Visits</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border-zinc-800/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-sky-400 font-mono">
                  {stats.daysRemaining}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Days Left</p>
              </div>
            </div>

            {/* Membership Plan Card */}
            <div className="glass-panel p-5 rounded-2xl border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Membership Subscription
                  </h2>
                </div>
                {activeMembership && (
                  <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                    ₹{parseFloat(activeMembership.planPrice).toFixed(0)}
                  </span>
                )}
              </div>

              {activeMembership ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {activeMembership.planName}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Valid until{" "}
                        {new Date(activeMembership.endDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs text-brand font-semibold">
                      {activeMembership.daysRemaining} days left
                    </div>
                  </div>

                  {/* Visual Countdown Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-brand rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, (activeMembership.daysRemaining / (activeMembership.durationDays || 30)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No active membership subscription linked.
                </div>
              )}
            </div>

            {/* Today's Gym Classes Schedule */}
            <div className="glass-panel p-5 rounded-2xl border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Today&apos;s Group Classes
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                  Open Booking
                </span>
              </div>

              <div className="space-y-2.5">
                {classesList.map((cls) => {
                  const isBooked = bookedClasses.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-white">{cls.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                          <span>{cls.time}</span>
                          <span>•</span>
                          <span>{cls.trainer}</span>
                          <span>•</span>
                          <span className="text-zinc-500">{cls.location}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleToggleClass(cls.id, cls.name)}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                          isBooked
                            ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60"
                            : "bg-brand text-carbon-950 hover:bg-brand/90"
                        }`}
                      >
                        {isBooked ? "Reserved ✓" : "Book Spot"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Check-Ins & Workouts */}
            <div className="glass-panel p-5 rounded-2xl border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Workouts
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {recentAttendance.length} visits recorded
                </span>
              </div>

              {recentAttendance.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center">No check-ins recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recentAttendance.slice(0, 5).map((att) => {
                    const d = new Date(att.checkedInAt);
                    return (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Gym Visit Confirmed</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {att.kioskId || "Front Kiosk"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                          {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
