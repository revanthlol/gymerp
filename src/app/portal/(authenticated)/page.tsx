import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getMemberPortalDataAction } from "@/lib/api/member-portal";
import { CheckInTrigger } from "@/components/portal/check-in-trigger";
import {
  Flame,
  CreditCard,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MapPin,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Member Overview | GymERP",
  description: "Access your gym membership, workout streaks, upcoming classes, and fast kiosk check-in",
};

export const dynamic = "force-dynamic";

export default async function MemberOverviewPage() {
  const data = await getMemberPortalDataAction();
  const { member, gym, activeMembership, recentAttendance, upcomingClasses, stats } = data;

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const lastVisit = recentAttendance[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ---------------------------------------------------- */}
      {/* 1. ATHLETE GREETING & HERO BANNER                    */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-muted/40 border border-border p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-muted border border-border text-muted-foreground">
                UID: #{member.id.slice(0, 8)}
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                  member.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                )}
              >
                {member.status} Pass
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{gym.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              Welcome back, {member.fullName.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg">
              Check in by pointing your camera at the gym turnstile display, or enter the station code below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <CheckInTrigger memberUid={member.id} variant="hero" />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. TOP METRIC CARDS                                  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Membership */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Membership Plan</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xl font-bold text-foreground truncate">
              {activeMembership?.planName || "Standard Membership"}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-primary">
                {activeMembership?.daysRemaining ?? 0} days left
              </span>
              <span className="text-muted-foreground">&bull;</span>
              <span className="text-muted-foreground truncate">
                {activeMembership?.endDate
                  ? `Renews ${new Date(activeMembership.endDate).toLocaleDateString()}`
                  : "Active"}
              </span>
            </div>
          </div>
          <Link
            href="/portal/membership"
            className="mt-4 pt-3 border-t border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>View plan details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Workout Streak */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-black text-foreground">
              {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.currentStreak > 0
                ? "Keep the momentum going!"
                : "Check in today to start a streak"}
            </p>
          </div>
          <Link
            href="/portal/attendance"
            className="mt-4 pt-3 border-t border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>View streak history</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Monthly Sessions */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-black text-foreground">
              {stats.workoutsThisMonth} {stats.workoutsThisMonth === 1 ? "session" : "sessions"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWorkouts} total visits all-time
            </p>
          </div>
          <Link
            href="/portal/attendance"
            className="mt-4 pt-3 border-t border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>View monthly ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: Last Visit */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Last Check-In</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-base font-bold text-foreground">
              {lastVisit
                ? new Date(lastVisit.checkedInAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })
                : "No visits yet"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastVisit
                ? `${new Date(lastVisit.checkedInAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} (${lastVisit.method.replace("_", " ")})`
                : "Your first session awaits"}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-medium text-muted-foreground">
            {lastVisit ? "Turnstile verified" : "Zero-touch enabled"}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TWO COLUMN CONTENT: CLASSES & ATTENDANCE          */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Upcoming Fitness Classes
              </h2>
              <p className="text-xs text-muted-foreground">
                Reserve your spot in upcoming group training sessions
              </p>
            </div>
            <Link
              href="/portal/classes"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Full timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No Classes Scheduled Today</p>
                <p className="text-xs text-muted-foreground">
                  Check back soon or view the weekly timetable for upcoming sessions.
                </p>
              </div>
              <Link href="/portal/classes">
                <button className="text-xs font-semibold px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors">
                  Browse Timetable
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingClasses.slice(0, 4).map((c: any) => {
                const spotsLeft = Math.max(0, c.capacity - c.bookedCount);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                          {c.category || "Fitness"}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {c.dayOfWeek}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground tracking-tight">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Coach {c.trainer}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{c.time}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : "Waitlist"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Check-in Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Recent Check-Ins
              </h2>
              <p className="text-xs text-muted-foreground">
                Your latest facility entries
              </p>
            </div>
            <Link
              href="/portal/attendance"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-sm">
            {recentAttendance.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">No recent check-in records.</p>
                <CheckInTrigger memberUid={member.id} variant="compact" />
              </div>
            ) : (
              recentAttendance.slice(0, 5).map((log: any) => {
                const isExit = log.method.includes("exit");
                return (
                  <div key={log.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                          isExit
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {isExit ? "Facility Exit" : "Access Granted"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(log.checkedInAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-medium text-foreground">
                        {new Date(log.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {log.method.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
