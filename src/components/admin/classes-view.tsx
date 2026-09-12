"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClassAction, deleteClassAction, adjustClassBookingAction } from "@/lib/api/classes";
import { toast } from "sonner";

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

export function ClassesView({ initialClasses = [] }: ClassesViewProps) {
  const [classes, setClasses] = useState<GymClassItem[]>(initialClasses);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrainer, setNewTrainer] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDay, setNewDay] = useState("Daily");
  const [newLocation, setNewLocation] = useState("Studio 1");
  const [newCapacity, setNewCapacity] = useState("20");
  const [newCategory, setNewCategory] = useState<GymClassItem["category"]>("Strength");

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
          id: res.gymClass.id,
          name: res.gymClass.name,
          trainer: res.gymClass.trainer,
          time: res.gymClass.time,
          durationMinutes: res.gymClass.durationMinutes,
          dayOfWeek: res.gymClass.dayOfWeek,
          location: res.gymClass.location,
          capacity: res.gymClass.capacity,
          bookedCount: res.gymClass.bookedCount,
          category: res.gymClass.category as GymClassItem["category"],
        };

        setClasses((prev) => [created, ...prev]);
        toast.success(`Class "${created.name}" created and saved!`);
        setIsModalOpen(false);
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteClassAction(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Class "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete class");
    }
  };

  const handleAdjustSpots = async (id: string, delta: number) => {
    try {
      const res = await adjustClassBookingAction(id, delta);
      if (res.success && res.gymClass) {
        setClasses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, bookedCount: res.gymClass.bookedCount } : c))
        );
        toast.success(delta > 0 ? "Athlete spot booked" : "Spot released");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update booking count");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Classes & Group Scheduling
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              Active Roster
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Group fitness sessions, trainer assignments, athlete capacities, and bookings.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Class</span>
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c0d10]/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search classes, trainers, studios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#08090a] border-white/[0.07] text-xs h-9 rounded-lg focus:border-primary text-zinc-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "Strength", "Cardio", "Combat", "Mind & Body"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterCategory === cat
                  ? "bg-white/[0.1] text-primary font-semibold border border-white/[0.1]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              {cat === "all" ? "All Sessions" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((cls) => {
            const fillPercentage = Math.min(100, Math.round((cls.bookedCount / cls.capacity) * 100));
            const isFull = cls.bookedCount >= cls.capacity;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                key={cls.id}
                className="glass-card p-5 rounded-xl border border-white/[0.07] bg-[#0c0d10]/90 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#08090a] border border-white/[0.07] text-zinc-400">
                      {cls.category}
                    </span>
                    <span className="text-xs font-mono font-medium text-primary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.time}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 group-hover:text-primary transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{cls.trainer}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/[0.07]">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{cls.location}</span>
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">{cls.dayOfWeek}</span>
                  </div>

                  {/* Capacity progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500">Roster Capacity</span>
                      <span
                        className={`font-semibold ${
                          isFull ? "text-amber-400" : "text-primary"
                        }`}
                      >
                        {cls.bookedCount} / {cls.capacity} spots filled
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#08090a] overflow-hidden border border-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? "bg-amber-400" : "bg-primary"
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Class Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustSpots(cls.id, 1)}
                        disabled={isFull}
                        title="Book athlete spot"
                        className="p-1 rounded text-zinc-400 hover:text-primary hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustSpots(cls.id, -1)}
                        disabled={cls.bookedCount <= 0}
                        title="Release spot"
                        className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      title="Delete class"
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-xl border border-dashed border-white/[0.08] bg-[#0c0d10]/40 space-y-2">
            <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-300 font-medium">No fitness classes found</p>
            <p className="text-xs text-zinc-500">
              Create a new class session or modify your category filter.
            </p>
          </div>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span>Schedule New Fitness Class</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Create a group class session for your gym members to book.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Class Title *</label>
              <Input
                required
                placeholder="e.g. Olympic Weightlifting, Kickboxing"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Instructor / Trainer *</label>
                <Input
                  required
                  placeholder="e.g. Coach Elena"
                  value={newTrainer}
                  onChange={(e) => setNewTrainer(e.target.value)}
                  className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Start Time *</label>
                <Input
                  required
                  placeholder="e.g. 07:00 AM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-[#08090a] border-white/[0.08] text-xs font-mono text-zinc-100 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Days Active</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full h-9 bg-[#08090a] border border-white/[0.08] rounded-md px-2 text-xs text-zinc-100 focus:border-primary focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                  <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
                  <option value="Weekends">Weekends Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-9 bg-[#08090a] border border-white/[0.08] rounded-md px-2 text-xs text-zinc-100 focus:border-primary focus:outline-none"
                >
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Combat">Combat</option>
                  <option value="Mind & Body">Mind & Body</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Room / Studio</label>
                <Input
                  placeholder="Studio 1"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Max Capacity</label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="bg-[#08090a] border-white/[0.08] text-xs font-mono text-zinc-100 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-white/[0.08] text-xs bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs"
              >
                {isSubmitting ? "Adding..." : "Add Class"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
