"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Dumbbell,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Filter,
  UserCheck,
  Search,
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
import { toast } from "sonner";

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
  category: "Strength" | "Cardio" | "Combat" | "Mind & Body";
}

const INITIAL_CLASSES: GymClassItem[] = [
  {
    id: "cls-1",
    name: "Morning Functional HIIT",
    trainer: "Coach Marcus Vance",
    time: "07:00 AM",
    durationMinutes: 45,
    dayOfWeek: "Daily",
    location: "Studio 1 (Turf)",
    capacity: 20,
    bookedCount: 16,
    category: "Cardio",
  },
  {
    id: "cls-2",
    name: "Olympic Lifting & Deadlift Barbell",
    trainer: "Coach Elena Rostova",
    time: "10:00 AM",
    durationMinutes: 60,
    dayOfWeek: "Mon, Wed, Fri",
    location: "Main Weight Room",
    capacity: 12,
    bookedCount: 10,
    category: "Strength",
  },
  {
    id: "cls-3",
    name: "Power Vinyasa Yoga Flow",
    trainer: "Coach Priya Patel",
    time: "04:30 PM",
    durationMinutes: 50,
    dayOfWeek: "Tue, Thu, Sat",
    location: "Zen Studio B",
    capacity: 18,
    bookedCount: 14,
    category: "Mind & Body",
  },
  {
    id: "cls-4",
    name: "Boxing Technique & Heavy Bags",
    trainer: "Coach Devon Miles",
    time: "06:30 PM",
    durationMinutes: 60,
    dayOfWeek: "Daily",
    location: "Combat Ring 1",
    capacity: 15,
    bookedCount: 15,
    category: "Combat",
  },
  {
    id: "cls-5",
    name: "Kettlebell Conditioning & Core",
    trainer: "Coach Marcus Vance",
    time: "08:00 PM",
    durationMinutes: 45,
    dayOfWeek: "Mon, Wed, Fri",
    location: "Studio 2",
    capacity: 16,
    bookedCount: 9,
    category: "Strength",
  },
];

export function ClassesView() {
  const [classes, setClasses] = useState<GymClassItem[]>(INITIAL_CLASSES);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTrainer.trim() || !newTime.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const created: GymClassItem = {
      id: `cls-${Date.now()}`,
      name: newName.trim(),
      trainer: newTrainer.trim(),
      time: newTime.trim(),
      durationMinutes: 60,
      dayOfWeek: newDay,
      location: newLocation.trim(),
      capacity: parseInt(newCapacity, 10) || 20,
      bookedCount: 0,
      category: newCategory,
    };

    setClasses((prev) => [created, ...prev]);
    toast.success(`Class "${created.name}" added to schedule!`);
    setIsModalOpen(false);
    setNewName("");
    setNewTrainer("");
    setNewTime("");
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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand/10 text-brand border border-brand/30">
              WEEKLY ROSTER
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Group fitness sessions, trainer assignments, athlete capacity limits, and bookings.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand hover:bg-brand/90 text-carbon-950 font-bold px-4 py-2.5 rounded-xl shadow-[0_0_18px_rgba(118,185,0,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Schedule Class</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search class, trainer, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 rounded-xl text-xs text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          {(["all", "Strength", "Cardio", "Combat", "Mind & Body"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterCategory === cat
                  ? "bg-zinc-800 text-brand font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "All Disciplines" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cls) => {
          const fillPercentage = Math.min(100, Math.round((cls.bookedCount / cls.capacity) * 100));
          const isFull = cls.bookedCount >= cls.capacity;

          return (
            <div
              key={cls.id}
              className="glass-card p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {cls.category}
                  </span>
                  <span className="text-xs font-mono font-semibold text-brand flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{cls.time}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-2.5 group-hover:text-brand transition-colors">
                  {cls.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{cls.trainer}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span>{cls.location}</span>
                  </span>
                  <span className="text-zinc-400">{cls.dayOfWeek}</span>
                </div>

                {/* Capacity progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Roster Capacity</span>
                    <span
                      className={`font-semibold ${
                        isFull ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {cls.bookedCount} / {cls.capacity} spots filled
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? "bg-amber-400" : "bg-brand"
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-brand" />
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
                className="bg-zinc-900 border-zinc-800 text-xs"
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
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Start Time *</label>
                <Input
                  required
                  placeholder="e.g. 07:00 AM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Days Active</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-2 text-xs text-zinc-100"
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
                  className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-2 text-xs text-zinc-100"
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
                  className="bg-zinc-900 border-zinc-800 text-xs"
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
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-zinc-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand text-carbon-950 font-bold text-xs hover:bg-brand/90"
              >
                Add Class
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
