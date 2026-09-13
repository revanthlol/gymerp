"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Users,
  Plus,
  Dumbbell,
  MapPin,
  Search,
  Trash2,
  UserPlus,
  UserMinus,
  Calendar,
  CalendarDays,
  LayoutGrid,
  CalendarPlus,
  Download,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClassAction, deleteClassAction, adjustClassBookingAction } from "@/lib/api/classes";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar/calendar-sync";

export interface GymClassItem {
  id: string;
  name: string;
  trainer: string;
  time: string;
  durationMinutes: number;
  dayOfWeek: string;
  location: string;
  capacity: number;
  bookedCount: number;
  category: "Strength" | "Cardio" | "Combat" | "Mind & Body";
}

interface ClassesViewProps {
  initialClasses?: GymClassItem[];
}

const fieldClass =
  "flex h-9 w-full rounded-xl border border-border bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ClassesView({ initialClasses = [] }: ClassesViewProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<GymClassItem[]>(initialClasses);
  const [viewMode, setViewMode] = useState<"cards" | "schedule">("cards");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClassForRsvp, setSelectedClassForRsvp] = useState<GymClassItem | null>(null);

  // Form states for creating a new class
  const [newName, setNewName] = useState("");
  const [newTrainer, setNewTrainer] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDay, setNewDay] = useState("Monday");
  const [newLocation, setNewLocation] = useState("Studio 1");
  const [newCapacity, setNewCapacity] = useState("20");
  const [newCategory, setNewCategory] = useState<GymClassItem["category"]>("Strength");

  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

  const filtered = classes.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.trainer.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q);
    const matchesCat = filterCategory === "all" || c.category === filterCategory;
    return matchesQ && matchesCat;
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTrainer.trim() || !newTime.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createClassAction({
        name: newName.trim(),
        trainer: newTrainer.trim(),
        time: newTime.trim(),
        durationMinutes: 60,
        dayOfWeek: newDay,
        location: newLocation.trim(),
        capacity: parseInt(newCapacity, 10) || 20,
        category: newCategory,
      });
      if (res.success && res.gymClass) {
        const created: GymClassItem = {
          ...res.gymClass,
          category: res.gymClass.category as GymClassItem["category"],
        };
        setClasses((prev) => [created, ...prev]);
        router.refresh();
        toast.success(`Class "${created.name}" scheduled`);
        setIsCreateModalOpen(false);
        setNewName("");
        setNewTrainer("");
        setNewTime("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteClassAction(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success(`"${name}" deleted`);
      if (selectedClassForRsvp?.id === id) {
        setSelectedClassForRsvp(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleAdjustSpots = async (id: string, delta: number) => {
    try {
      const res = await adjustClassBookingAction(id, delta);
      if (res.success && res.gymClass) {
        setClasses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, bookedCount: res.gymClass.bookedCount } : c))
        );
        if (selectedClassForRsvp?.id === id) {
          setSelectedClassForRsvp((prev) =>
            prev ? { ...prev, bookedCount: res.gymClass.bookedCount } : null
          );
        }
        toast.success(delta > 0 ? "Member RSVP spot booked" : "Spot released");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust spot");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Classes & Group Scheduling
          </h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} class{classes.length !== 1 ? "es" : ""} scheduled · Timetable sync & calendar export
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("schedule")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "schedule"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-3.5" />
              <span>Weekly Timetable</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 gap-2 text-xs font-semibold rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Class</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search classes, trainers, studios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/60 border-border text-xs rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "Strength", "Cardio", "Combat", "Mind & Body"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Class Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((cls) => {
              const fillPct = Math.min(100, Math.round((cls.bookedCount / cls.capacity) * 100));
              const isFull = cls.bookedCount >= cls.capacity;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  key={cls.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {cls.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="size-3" />
                        {cls.time}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Coach {cls.trainer}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {cls.location}
                      </span>
                      <span className="font-mono font-medium">{cls.dayOfWeek}</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="size-3" />
                          <span>RSVP</span>
                        </span>
                        <span className={`font-mono font-semibold ${isFull ? "text-amber-500" : "text-foreground"}`}>
                          {cls.bookedCount}/{cls.capacity} spots {isFull && "(Full)"}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions & Calendar Toolbar */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {/* 1-Click Google Calendar */}
                        <a
                          href={generateGoogleCalendarUrl(cls)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                          title="Add to Google Calendar"
                        >
                          <CalendarPlus className="size-3.5 text-primary" />
                        </a>

                        {/* Download .ICS File */}
                        <button
                          onClick={() => downloadIcsFile(cls)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                          title="Download Apple / Outlook .ICS Event"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedClassForRsvp(cls)}
                          className="h-8 px-2.5 text-xs rounded-xl"
                        >
                          <span>Manage</span>
                        </Button>

                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Delete Class"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Mode 2: Weekly Schedule Timetable Grid */}
      {viewMode === "schedule" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = classes.filter(
                (c) => c.dayOfWeek === day || c.dayOfWeek === "Daily"
              );

              return (
                <div
                  key={day}
                  className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3 flex flex-col"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                      {dayClasses.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayClasses.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic py-4 text-center">
                        No sessions
                      </p>
                    ) : (
                      dayClasses.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedClassForRsvp(cls)}
                          className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-mono font-medium">{cls.time}</span>
                            <span className="font-semibold text-primary">{cls.category}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {cls.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {cls.trainer} · {cls.location}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RSVP / Class Management Dialog */}
      <Dialog
        open={!!selectedClassForRsvp}
        onOpenChange={(open) => {
          if (!open) setSelectedClassForRsvp(null);
        }}
      >
        {selectedClassForRsvp && (
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="size-4 text-primary" />
                <span>{selectedClassForRsvp.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Led by Coach {selectedClassForRsvp.trainer} · {selectedClassForRsvp.dayOfWeek} at {selectedClassForRsvp.time}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Location and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Location</span>
                  <p className="text-xs font-medium text-foreground">{selectedClassForRsvp.location}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</span>
                  <p className="text-xs font-medium text-foreground">{selectedClassForRsvp.durationMinutes || 60} mins</p>
                </div>
              </div>

              {/* Roster / Capacity Controls */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Enrolled Participants</span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {selectedClassForRsvp.bookedCount} / {selectedClassForRsvp.capacity}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedClassForRsvp.bookedCount <= 0}
                    onClick={() => handleAdjustSpots(selectedClassForRsvp.id, -1)}
                    className="flex-1 h-8 text-xs gap-1.5 rounded-xl"
                  >
                    <UserMinus className="size-3.5" />
                    <span>Release Spot</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedClassForRsvp.bookedCount >= selectedClassForRsvp.capacity}
                    onClick={() => handleAdjustSpots(selectedClassForRsvp.id, 1)}
                    className="flex-1 h-8 text-xs gap-1.5 rounded-xl font-semibold shadow-xs"
                  >
                    <UserPlus className="size-3.5" />
                    <span>Book Spot</span>
                  </Button>
                </div>
              </div>

              {/* Calendar Integration Links */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-muted-foreground">Calendar Integration</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={generateGoogleCalendarUrl(selectedClassForRsvp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30 text-xs font-medium hover:bg-muted/80 hover:text-primary transition-all text-foreground"
                  >
                    <CalendarPlus className="size-3.5 text-primary" />
                    <span>Google Calendar</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>

                  <button
                    type="button"
                    onClick={() => downloadIcsFile(selectedClassForRsvp)}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30 text-xs font-medium hover:bg-muted/80 hover:text-foreground transition-all"
                  >
                    <Download className="size-3.5 text-muted-foreground" />
                    <span>Download .ICS</span>
                  </button>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClassForRsvp(null)}
                className="h-8 px-4 text-xs rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4 text-primary" />
              Schedule New Class
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a workout session, assign trainer, set timing and room capacity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} id="create-class-form">
            <DialogBody className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Class Name *</label>
                <Input
                  required
                  placeholder="e.g. HIIT Morning Blast"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Trainer / Coach *</label>
                  <Input
                    required
                    placeholder="Coach Sarah"
                    value={newTrainer}
                    onChange={(e) => setNewTrainer(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className={fieldClass}
                  >
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Combat">Combat</option>
                    <option value="Mind & Body">Mind & Body</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Time *</label>
                  <Input
                    required
                    placeholder="07:00 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Location / Room</label>
                  <Input
                    placeholder="Main Studio"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="25"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 px-4 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 px-4 text-xs gap-1.5 rounded-xl font-semibold shadow-sm"
              >
                {isSubmitting ? <Spinner size="sm" variant="current" /> : "Schedule Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
