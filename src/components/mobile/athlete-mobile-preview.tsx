"use client";

import React, { useState } from "react";
import {
  Bell,
  Search,
  SlidersHorizontal,
  Flame,
  Dumbbell,
  Heart,
  Timer,
  MessageSquare,
  Play,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Compass,
  TrendingUp,
  User,
  ChevronRight,
  QrCode,
  Scan,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recordAttendanceScanAction } from "@/lib/api/attendance";
import { toast } from "sonner";

interface MemberItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
  qrToken: string;
}

interface PlanItem {
  id: string;
  name: string;
  price: string;
  durationDays: number;
}

interface AthleteMobilePreviewProps {
  members: MemberItem[];
  plans: PlanItem[];
  currentGymQr?: {
    tokenString: string;
    qrDataUrl: string;
    remainingSeconds: number;
  };
}

export function AthleteMobilePreview({
  members,
  plans,
  currentGymQr,
}: AthleteMobilePreviewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members[0]?.id || ""
  );
  const [activeScreen, setActiveScreen] = useState<"home" | "workout" | "schedule">("home");
  const [activeCategory, setActiveCategory] = useState("Strength");
  const [selectedDay, setSelectedDay] = useState("Tue 30");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const getInitials = (name?: string) => {
    if (!name) return "AT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleTriggerScan = async () => {
    if (!selectedMember) {
      toast.error("No member selected");
      return;
    }
    if (!currentGymQr) {
      toast.error("No active gym turnstile QR token available");
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      // Execute live check-in against PostgreSQL attendance database
      const res = await recordAttendanceScanAction(
        selectedMember.id,
        currentGymQr.tokenString
      );

      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (res.success) {
        setScanResult({
          success: true,
          message: res.message || "Turnstile Gate Unlocked",
          timestamp: time,
        });
        toast.success(`Access Granted: ${selectedMember.fullName}`);
      } else {
        setScanResult({
          success: false,
          message: res.message || "Scan validation failed",
          timestamp: time,
        });
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to connect to turnstile terminal");
    } finally {
      setScanning(false);
    }
  };

  const days = [
    { day: "Mon", date: "29", id: "Mon 29" },
    { day: "Tue", date: "30", id: "Tue 30" },
    { day: "Wed", date: "1", id: "Wed 1" },
    { day: "Thu", date: "2", id: "Thu 2" },
    { day: "Fri", date: "3", id: "Fri 3" },
    { day: "Sat", date: "4", id: "Sat 4" },
    { day: "Sun", date: "5", id: "Sun 5" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Member Switcher & Screen Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Athlete Mobile Experience</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live preview for registered gym athletes with turnstile QR scanner
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real Member Selector */}
          {members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium hidden md:inline">Athlete:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  setScanResult(null);
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Screen Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveScreen("home")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeScreen === "home"
                  ? "bg-brand text-carbon-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              1. Home
            </button>
            <button
              onClick={() => setActiveScreen("workout")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeScreen === "workout"
                  ? "bg-brand text-carbon-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              2. Workout
            </button>
            <button
              onClick={() => setActiveScreen("schedule")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeScreen === "schedule"
                  ? "bg-brand text-carbon-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              3. Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Device Mockup Container */}
      <div className="flex justify-center py-2">
        <div className="w-[380px] min-h-[780px] rounded-[44px] border-[5px] border-zinc-800 bg-[#0c0c0e] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between relative">
          {/* Dynamic Island Bar */}
          <div className="pt-3 px-7 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>9:41</span>
            <div className="w-24 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-zinc-700" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2 rounded-sm border border-zinc-400 flex items-center p-0.5">
                <div className="w-full h-full bg-zinc-200 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {activeScreen === "home" && (
              <>
                {/* Athlete Profile Header */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-brand">
                      {getInitials(selectedMember?.fullName)}
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        Welcome Back
                      </p>
                      <h2 className="text-sm font-bold text-white">
                        {selectedMember?.fullName || "Gym Athlete"}
                      </h2>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-brand/30 text-brand bg-brand/10 uppercase"
                  >
                    {selectedMember?.status || "Active"}
                  </Badge>
                </div>

                {/* Member Entrance QR Scan CTA Banner */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                        <Scan className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Entrance Turnstile</p>
                        <p className="text-[10px] text-zinc-400">Scan 2-hour dynamic gate code</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setScannerOpen(true)}
                      className="h-8 text-xs bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-xl px-3 gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan QR</span>
                    </Button>
                  </div>
                </div>

                {/* Health Grade Hero Card (Wireframe design) */}
                <div className="p-5 rounded-3xl bg-brand text-carbon-950 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Health Grade</h3>
                      <p className="text-xs font-medium text-carbon-950/80 max-w-[190px] mt-1 leading-snug">
                        Your gym consistency is strong. 4 check-ins recorded this week.
                      </p>
                    </div>

                    <div className="relative w-16 h-16 rounded-full border-4 border-carbon-950/20 flex items-center justify-center bg-carbon-950/10">
                      <span className="font-extrabold text-sm text-carbon-950 font-mono">88%</span>
                    </div>
                  </div>
                </div>

                {/* Heart Rate & Workout Time Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs">
                      <span>Resting HR</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <p className="text-lg font-bold text-white font-mono">
                      64 <span className="text-xs font-normal text-zinc-400">BPM</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs">
                      <span>Weekly Time</span>
                      <Timer className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <p className="text-lg font-bold text-white font-mono">
                      5h 20m <span className="text-xs font-normal text-zinc-400">wk</span>
                    </p>
                  </div>
                </div>

                {/* Today's Workout Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">Today&apos;s Workout</p>
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      ● Strength & Hypertrophy
                    </span>
                    <h4 className="text-sm font-bold text-white">Compound Push & Pull</h4>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">50 Mins · 5 Exercises</span>
                      <button
                        onClick={() => setActiveScreen("workout")}
                        className="w-8 h-8 rounded-full bg-brand text-carbon-950 flex items-center justify-center font-bold"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeScreen === "workout" && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <h2 className="text-base font-bold text-white">Workout Programs</h2>
                  <Badge variant="outline" className="text-zinc-400 border-zinc-800 text-[10px]">
                    4 Active
                  </Badge>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      name: "Upper Body Hypertrophy",
                      duration: "45 Mins",
                      burn: "320 kcal",
                      level: "Intermediate",
                    },
                    {
                      name: "Olympic Lift Fundamentals",
                      duration: "60 Mins",
                      burn: "450 kcal",
                      level: "Advanced",
                    },
                    {
                      name: "Functional Core & Mobility",
                      duration: "30 Mins",
                      burn: "210 kcal",
                      level: "All Levels",
                    },
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] text-brand font-mono uppercase">{w.level}</span>
                        <h4 className="text-sm font-bold text-white">{w.name}</h4>
                        <p className="text-xs text-zinc-400 font-mono">
                          {w.duration} · {w.burn}
                        </p>
                      </div>
                      <button className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeScreen === "schedule" && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <h2 className="text-base font-bold text-white">Schedule</h2>
                  <Calendar className="w-4 h-4 text-brand" />
                </div>

                {/* Day Calendar Strip */}
                <div className="flex items-center justify-between gap-1.5 py-1">
                  {days.map((d) => {
                    const active = selectedDay === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDay(d.id)}
                        className={`flex flex-col items-center p-2 rounded-xl text-xs transition-colors ${
                          active
                            ? "bg-brand text-carbon-950 font-bold"
                            : "bg-zinc-900/80 text-zinc-400 border border-zinc-800"
                        }`}
                      >
                        <span className="text-[10px]">{d.day}</span>
                        <span className="font-bold text-sm">{d.date}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Exercise Checklist */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-zinc-300">Assigned Session</p>
                  {[
                    { title: "Barbell Back Squat", sets: "4 Sets × 8 Reps", done: true },
                    { title: "Romanian Deadlift", sets: "3 Sets × 10 Reps", done: true },
                    { title: "Bulgarian Split Squats", sets: "3 Sets × 12 Reps", done: false },
                    { title: "Standing Calf Raises", sets: "4 Sets × 15 Reps", done: false },
                  ].map((ex, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            ex.done
                              ? "bg-brand border-brand text-carbon-950"
                              : "border-zinc-700 bg-zinc-950"
                          }`}
                        >
                          {ex.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className={`font-semibold ${ex.done ? "line-through text-zinc-500" : "text-white"}`}>
                            {ex.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">{ex.sets}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Member Camera Scanner Modal Overlay */}
          {scannerOpen && (
            <div className="absolute inset-0 bg-[#080809]/95 backdrop-blur-md p-6 flex flex-col justify-between z-50">
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <Scan className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-white">Entrance Turnstile Scanner</span>
                </div>
                <button
                  onClick={() => {
                    setScannerOpen(false);
                    setScanResult(null);
                  }}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewfinder Reticle */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-56 h-56 rounded-3xl border-2 border-dashed border-brand/50 bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brand" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brand" />

                  <QrCode className="w-12 h-12 text-zinc-600 mb-2" />
                  <p className="text-[11px] text-zinc-400 font-medium leading-tight">
                    Point camera at Kiosk Terminal display
                  </p>
                  <p className="text-[9px] text-zinc-500 font-mono mt-1">
                    2-Hour Anti-Proxy Code
                  </p>
                </div>

                {/* Scan Result Feedback */}
                {scanResult && (
                  <div
                    className={`w-full p-3.5 rounded-2xl border text-xs ${
                      scanResult.success
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                        : "bg-red-950/60 border-red-500/50 text-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {scanResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">{scanResult.message}</p>
                        {scanResult.timestamp && (
                          <p className="text-[10px] opacity-75 font-mono">{scanResult.timestamp}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Trigger */}
              <div className="space-y-2 pb-6">
                <Button
                  onClick={handleTriggerScan}
                  disabled={scanning}
                  className="w-full h-11 bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-2xl"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Verifying 2-Hour QR...</span>
                    </>
                  ) : (
                    <span>Scan Turnstile Gate</span>
                  )}
                </Button>
                <p className="text-[10px] text-center text-zinc-500">
                  Validates against live Iron Pulse turnstile terminal
                </p>
              </div>
            </div>
          )}

          {/* Bottom App Navigation Bar */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-around text-xs">
            <button
              onClick={() => setActiveScreen("home")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "home" ? "text-brand" : "text-zinc-500"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px]">Home</span>
            </button>
            <button
              onClick={() => setActiveScreen("workout")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "workout" ? "text-brand" : "text-zinc-500"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[9px]">Explore</span>
            </button>
            <button
              onClick={() => setActiveScreen("schedule")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "schedule" ? "text-brand" : "text-zinc-500"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[9px]">Routine</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-zinc-500">
              <User className="w-4 h-4" />
              <span className="text-[9px]">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
