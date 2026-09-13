"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock, Users, Plus, Dumbbell, MapPin, Search, Trash2, UserPlus, UserMinus, Calendar,
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
  "flex h-9 w-full rounded-lg border border-border bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

export function ClassesView({ initialClasses = [] }: ClassesViewProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<GymClassItem[]>(initialClasses);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newTrainer, setNewTrainer] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDay, setNewDay] = useState("Daily");
  const [newLocation, setNewLocation] = useState("Studio 1");
  const [newCapacity, setNewCapacity] = useState("20");
  const [newCategory, setNewCategory] = useState<GymClassItem["category"]>("Strength");

  useEffect(() => { setClasses(initialClasses); }, [initialClasses]);

  const filtered = classes.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || c.name.toLowerCase().includes(q) || c.trainer.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
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
        name: newName.trim(), trainer: newTrainer.trim(), time: newTime.trim(),
        durationMinutes: 60, dayOfWeek: newDay, location: newLocation.trim(),
        capacity: parseInt(newCapacity, 10) || 20, category: newCategory,
      });
      if (res.success && res.gymClass) {
        const created: GymClassItem = { ...res.gymClass, category: res.gymClass.category as GymClassItem["category"] };
        setClasses((prev) => [created, ...prev]);
        router.refresh();
        toast.success(`Class "${created.name}" scheduled`);
        setIsModalOpen(false);
        setNewName(""); setNewTrainer(""); setNewTime("");
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
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleAdjustSpots = async (id: string, delta: number) => {
    try {
      const res = await adjustClassBookingAction(id, delta);
      if (res.success && res.gymClass) {
        setClasses((prev) => prev.map((c) => c.id === id ? { ...c, bookedCount: res.gymClass.bookedCount } : c));
        toast.success(delta > 0 ? "Spot booked" : "Spot released");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} class{classes.length !== 1 ? "es" : ""} scheduled
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs self-start sm:self-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="size-3.5 stroke-[2.5]" />
          Add Class
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search classes, trainers, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/60 border-border text-xs"
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
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{cls.category}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="size-3" />{cls.time}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cls.trainer}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3" />{cls.location}
                    </span>
                    <span className="font-mono">{cls.dayOfWeek}</span>
                  </div>

                  {/* Capacity bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className={`font-semibold font-mono ${isFull ? "text-amber-500" : "text-foreground"}`}>
                        {cls.bookedCount}/{cls.capacity}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isFull ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustSpots(cls.id, 1)}
                        disabled={isFull}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                      >
                        <UserPlus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustSpots(cls.id, -1)}
                        disabled={cls.bookedCount <= 0}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 transition-colors"
                      >
                        <UserMinus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-3">
            <Dumbbell className="size-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No classes found</p>
          </div>
        )}
      </div>

      {/* Add class dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="size-4 text-primary" />
              Schedule New Class
            </DialogTitle>
            <DialogDescription>Create a group session for your members.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} id="add-class-form">
            <DialogBody className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Class Title *</label>
                <Input required placeholder="e.g. Kickboxing" value={newName} onChange={(e) => setNewName(e.target.value)} className={fieldClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Trainer *</label>
                  <Input required placeholder="Coach Elena" value={newTrainer} onChange={(e) => setNewTrainer(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Start Time *</label>
                  <Input required placeholder="07:00 AM" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={fieldClass + " font-mono"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Schedule</label>
                  <select value={newDay} onChange={(e) => setNewDay(e.target.value)} className={fieldClass}>
                    <option value="Daily">Daily</option>
                    <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                    <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
                    <option value="Weekends">Weekends</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className={fieldClass}>
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Combat">Combat</option>
                    <option value="Mind & Body">Mind & Body</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Room / Studio</label>
                  <Input placeholder="Studio 1" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Capacity</label>
                  <Input type="number" min="5" max="100" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} className={fieldClass + " font-mono"} />
                </div>
              </div>
            </DialogBody>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-class-form" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" variant="current" className="mr-1.5" /> Scheduling...</> : "Schedule Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
