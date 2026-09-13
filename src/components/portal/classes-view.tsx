"use client";

import React, { useState, useTransition } from "react";
import {
  Dumbbell,
  Clock,
  MapPin,
  UserCheck,
  Calendar,
  CheckCircle2,
  CalendarPlus,
  Filter,
  Sparkles,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { rsvpMemberClassAction } from "@/lib/api/classes";

interface GymClassItem {
  id: string;
  name: string;
  trainer: string;
  time: string;
  durationMinutes: number;
  dayOfWeek: string;
  location: string;
  capacity: number;
  bookedCount: number;
  category: string;
}

interface ClassesViewProps {
  initialClasses: GymClassItem[];
  gymName: string;
}

const CATEGORIES = ["All", "Strength", "Cardio", "Combat", "Mind & Body"];
const DAYS = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Daily"];

export function ClassesView({ initialClasses, gymName }: ClassesViewProps) {
  const [classesList, setClassesList] = useState(initialClasses);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");
  const [bookedClassIds, setBookedClassIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("gymerp:my_booked_classes");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isPending, startTransition] = useTransition();
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);

  const toggleBooking = (cls: GymClassItem) => {
    const isBooked = bookedClassIds.has(cls.id);
    const action = isBooked ? "cancel" : "book";
    setPendingClassId(cls.id);

    startTransition(async () => {
      try {
        const res = await rsvpMemberClassAction(cls.id, action);
        if (res.success && res.gymClass) {
          setClassesList((prev) =>
            prev.map((c) => (c.id === cls.id ? { ...c, bookedCount: res.gymClass.bookedCount } : c))
          );
          setBookedClassIds((prev) => {
            const next = new Set(prev);
            if (isBooked) next.delete(cls.id);
            else next.add(cls.id);
            try {
              localStorage.setItem("gymerp:my_booked_classes", JSON.stringify(Array.from(next)));
            } catch {}
            return next;
          });
        }
      } catch (err) {
        console.error("Booking error:", err);
      } finally {
        setPendingClassId(null);
      }
    });
  };

  const filteredClasses = classesList.filter((c) => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesDay = selectedDay === "All" || c.dayOfWeek === selectedDay || c.dayOfWeek === "Daily";
    return matchesCat && matchesDay;
  });

  const generateGoogleCalendarUrl = (cls: GymClassItem) => {
    const title = encodeURIComponent(`${cls.name} at ${gymName}`);
    const details = encodeURIComponent(`Coach: ${cls.trainer}\nLocation: ${cls.location}\nDuration: ${cls.durationMinutes} mins`);
    const location = encodeURIComponent(`${cls.location}, ${gymName}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = (cls: GymClassItem) => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GymERP//Classes//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${cls.name} - ${gymName}`,
      `DESCRIPTION:Coach: ${cls.trainer} | Location: ${cls.location}`,
      `LOCATION:${cls.location}, ${gymName}`,
      `DURATION:PT${cls.durationMinutes}M`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${cls.name.toLowerCase().replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Group Fitness Classes & Timetable
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse upcoming sessions, reserve your spot with 1-click RSVP, and sync to your calendar.
          </p>
        </div>
      </div>

      {/* Filter Chips Toolbar */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">Category:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Day of Week Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">Day:</span>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
                selectedDay === day
                  ? "bg-foreground text-background font-bold shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Classes Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No classes match your selected category or day filter. Try clearing filters to see all available sessions.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSelectedDay("All");
            }}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const isBooked = bookedClassIds.has(cls.id);
            const isFull = cls.bookedCount >= cls.capacity && !isBooked;
            const spotsRemaining = Math.max(0, cls.capacity - cls.bookedCount);
            const percentFilled = Math.min(100, Math.round((cls.bookedCount / cls.capacity) * 100));

            return (
              <div
                key={cls.id}
                className={cn(
                  "p-6 rounded-3xl bg-card border transition-all shadow-sm flex flex-col justify-between space-y-5",
                  isBooked
                    ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                    : "border-border/80 hover:border-border"
                )}
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                      {cls.category || "Fitness"}
                    </span>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {cls.dayOfWeek}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                      {cls.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Instructor: <strong className="text-foreground font-semibold">{cls.trainer}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono">{cls.time} ({cls.durationMinutes} mins)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{cls.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Spots Available</span>
                    <span className="font-mono font-semibold text-foreground">
                      {isFull ? (
                        <span className="text-red-500 font-bold">Class Full</span>
                      ) : (
                        `${spotsRemaining} of ${cls.capacity} left`
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        percentFilled > 85 ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>

                {/* Booking & Calendar Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isPending || (isFull && !isBooked)}
                    onClick={() => toggleBooking(cls)}
                    className={cn(
                      "w-full h-10 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]",
                      isBooked
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : isFull
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    )}
                  >
                    {pendingClassId === cls.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isBooked ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Spot Reserved &bull; Click to Cancel</span>
                      </>
                    ) : isFull ? (
                      <span>Class Full</span>
                    ) : (
                      <>
                        <Dumbbell className="w-4 h-4" />
                        <span>Reserve Spot</span>
                      </>
                    )}
                  </button>

                  {/* Calendar Sync links */}
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground">
                    <a
                      href={generateGoogleCalendarUrl(cls)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      <span>Google Cal</span>
                    </a>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(cls)}
                      className="hover:text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>iCal / .ics</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
