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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AthleteMobilePreview() {
  const [activeScreen, setActiveScreen] = useState<"home" | "workout" | "schedule">("home");
  const [activeCategory, setActiveCategory] = useState("Strength");
  const [selectedDay, setSelectedDay] = useState("Tue 30");

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
      {/* Screen Switcher Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Athlete Mobile App Wireframe</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Interactive reference implementation derived from mobile wireframe (Image 3).
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveScreen("home")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeScreen === "home" ? "bg-brand text-carbon-950 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            1. Home
          </button>
          <button
            onClick={() => setActiveScreen("workout")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeScreen === "workout" ? "bg-brand text-carbon-950 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            2. Workout
          </button>
          <button
            onClick={() => setActiveScreen("schedule")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeScreen === "schedule" ? "bg-brand text-carbon-950 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            3. Schedule
          </button>
        </div>
      </div>

      {/* Mobile Device Mockup Container */}
      <div className="flex justify-center py-4">
        <div className="w-[380px] min-h-[780px] rounded-[44px] border-[6px] border-zinc-800 bg-[#0c0c0e] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between relative">
          {/* iOS Dynamic Island Bar */}
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
          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {activeScreen === "home" && (
              <>
                {/* User Greeting */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200">
                      ML
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        Welcome Back!
                      </p>
                      <h2 className="text-sm font-bold text-white">Michael Law</h2>
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 relative">
                    <Bell className="w-4 h-4" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand absolute top-2 right-2" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    placeholder="Search workouts or classes"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand"
                  />
                  <SlidersHorizontal className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                </div>

                {/* Popular Plans Category Pills */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">Popular Plans</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {["Strength", "Fat Loss", "Cardio", "Stretch"].map((cat) => {
                      const active = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                            active
                              ? "bg-brand text-carbon-950 shadow-[0_0_12px_rgba(198,255,0,0.3)]"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                          }`}
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Health Grade Hero Card (Exact match to Wireframe) */}
                <div className="p-5 rounded-3xl bg-brand text-carbon-950 space-y-3 relative overflow-hidden shadow-[0_12px_30px_rgba(198,255,0,0.2)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Health Grade</h3>
                      <p className="text-xs font-medium text-carbon-950/80 max-w-[190px] mt-1 leading-snug">
                        Your fitness journey is on track. Stay consistent to achieve even better results.
                      </p>
                    </div>

                    {/* Radial Ring 85% */}
                    <div className="relative w-16 h-16 rounded-full border-4 border-carbon-950/20 flex items-center justify-center bg-carbon-950/10">
                      <span className="font-extrabold text-sm text-carbon-950 font-mono">85%</span>
                    </div>
                  </div>
                </div>

                {/* Heart Rate & Workout Time Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs">
                      <span>Heart Rate</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <p className="text-lg font-bold text-white font-mono">
                      120 <span className="text-xs font-normal text-zinc-400">BPM</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs">
                      <span>Workout Time</span>
                      <Timer className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <p className="text-lg font-bold text-white font-mono">
                      5h 40m <span className="text-xs font-normal text-zinc-400">wk</span>
                    </p>
                  </div>
                </div>

                {/* Trainer Feedback Banner */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-brand">
                      CN
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Coach Narez</p>
                      <p className="text-[10px] text-zinc-400">New Feedback Available</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Today's Workout Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">Today&apos;s Workout</p>
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 relative overflow-hidden">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      ● Mid-Level
                    </span>
                    <h4 className="text-base font-bold text-white">Biceps Workout</h4>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">45 Mins · 4 Sets</span>
                      <button className="w-8 h-8 rounded-full bg-brand text-carbon-950 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-carbon-950 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeScreen === "workout" && (
              <>
                {/* Workout Catalog */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveScreen("home")}
                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold text-white">Workout</h2>
                  <div className="w-8" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-white">Advance</h3>
                    <p className="text-[10px] text-zinc-500">Fitness Level</p>
                  </div>
                  <button className="text-[11px] text-brand font-semibold hover:underline">
                    See All &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: "Strength Training",
                      seasons: "42 Sessions",
                      desc: "Build muscle, increase strength, and improve your overall performance.",
                    },
                    {
                      title: "Functional Fitness",
                      seasons: "28 Sessions",
                      desc: "Enhance your mobility, balance, and endurance through functional exercises.",
                    },
                    {
                      title: "Mind & Mobility",
                      seasons: "34 Sessions",
                      desc: "Improve flexibility, reduce muscle tension, and support recovery.",
                    },
                    {
                      title: "Core Strength",
                      seasons: "36 Sessions",
                      desc: "Strengthen your core muscles to improve balance and stability.",
                    },
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{w.title}</h4>
                        <span className="text-[10px] font-mono text-brand">{w.seasons}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeScreen === "schedule" && (
              <>
                {/* Schedule Screen */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveScreen("home")}
                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold text-white">Schedule</h2>
                  <div className="w-8" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <h3 className="font-bold text-white">Workout Plan</h3>
                      <p className="text-[10px] text-zinc-500">Track, train, and improve</p>
                    </div>
                    <button className="text-[11px] text-brand font-semibold hover:underline">
                      See All &gt;
                    </button>
                  </div>

                  {/* Horizontal Day Selector */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {days.map((d) => {
                      const active = selectedDay === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDay(d.id)}
                          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                            active
                              ? "bg-brand text-carbon-950 font-bold shadow-[0_0_12px_rgba(198,255,0,0.3)]"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                          }`}
                        >
                          <span className="text-[9px] uppercase font-mono">{d.day}</span>
                          <span className="text-xs font-bold">{d.date}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Today's Focus Card */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    ● Today&apos;s Focus
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">Biceps Workout</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        1900 Kcal · 60 Min
                      </p>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-brand text-carbon-950 text-xs font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(198,255,0,0.2)]">
                      <span>Start</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Today's Plan Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-white">Today&apos;s Plan</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">3 Exercises</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { num: 1, name: "Barbell Curl", sets: "4 Sets · 10-12 Reps", status: "completed" },
                      { num: 2, name: "Hammer Curl", sets: "3 Sets · 10-12 Reps", status: "upcoming" },
                      { num: 3, name: "Preacher Curl", sets: "3 Sets · 10-12 Reps", status: "upcoming" },
                    ].map((item) => (
                      <div
                        key={item.num}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-mono font-bold text-[11px] flex items-center justify-center">
                            {item.num}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{item.sets}</p>
                          </div>
                        </div>

                        {item.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/40 border border-zinc-700/40 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Upcoming</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Weekly Progress</p>
                    <p className="text-[10px] text-zinc-400 font-mono">3 of 6 Workouts Completed</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom App Navigation Bar (Wireframe Match) */}
          <div className="h-16 border-t border-zinc-800 bg-zinc-950/95 px-6 flex items-center justify-between text-zinc-500">
            <button
              onClick={() => setActiveScreen("home")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "home" ? "text-brand" : "hover:text-white"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px]">Home</span>
            </button>

            <button
              onClick={() => setActiveScreen("workout")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "workout" ? "text-brand" : "hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[9px]">Workout</span>
            </button>

            {/* Glowing Center Action Button */}
            <button
              onClick={() => setActiveScreen("schedule")}
              className="w-10 h-10 -mt-5 rounded-full bg-brand text-carbon-950 flex items-center justify-center shadow-[0_0_16px_rgba(198,255,0,0.5)] active:scale-95 transition-transform"
            >
              <Flame className="w-5 h-5 fill-carbon-950" />
            </button>

            <button
              onClick={() => setActiveScreen("schedule")}
              className={`flex flex-col items-center gap-0.5 ${
                activeScreen === "schedule" ? "text-brand" : "hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[9px]">Schedule</span>
            </button>

            <button className="flex flex-col items-center gap-0.5 hover:text-white">
              <User className="w-4 h-4" />
              <span className="text-[9px]">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
