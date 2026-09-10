"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/admin/add-client-dialog";
import { getMemberActivitiesAction } from "@/lib/api/members";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  X,
  HelpCircle,
  Clock,
  QrCode,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface MemberItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  status: string;
  qrToken: string;
  joinDate: string | Date;
  createdAt: string | Date;
}

interface PlanItem {
  id: string;
  name: string;
  price: string;
  durationDays: number;
}

interface ClientsViewProps {
  initialMembers: MemberItem[];
  plans: PlanItem[];
}

export function ClientsView({ initialMembers, plans }: ClientsViewProps) {
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "active" | "inactive">("all");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(
    initialMembers[0] || null
  );
  const [activeTab, setActiveTab] = useState<"overview" | "activities">("overview");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  // Filter members
  const filteredMembers = initialMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));

    const matchesScope =
      filterScope === "all" ? true : m.status === filterScope;

    return matchesSearch && matchesScope;
  });

  // Fetch activities when member changes and tab is activities
  useEffect(() => {
    if (selectedMember && activeTab === "activities") {
      setLoadingActivities(true);
      getMemberActivitiesAction(selectedMember.id)
        .then((res) => setActivities(res || []))
        .catch(() => setActivities([]))
        .finally(() => setLoadingActivities(false));
    }
  }, [selectedMember, activeTab]);

  const handleSelectMember = (member: MemberItem) => {
    setSelectedMember(member);
    setNoteText("");
  };

  const handleToggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const allChecked = filteredMembers.every((m) => checkedIds[m.id]);
    const next: Record<string, boolean> = {};
    if (!allChecked) {
      filteredMembers.forEach((m) => {
        next[m.id] = true;
      });
    }
    setCheckedIds(next);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    toast.success("Coach note saved for athlete");
    setNoteText("");
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatActivityDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return "No activity recorded";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)] pb-12">
      {/* Left / Center Table Section */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clients</h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Quick Search */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Quick search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-900/70 border-zinc-800/90 text-xs h-10 rounded-xl focus:border-brand"
              />
            </div>

            {/* Scope Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as any)}
                className="appearance-none bg-zinc-900/70 border border-zinc-800/90 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-300 focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">All clients</option>
                <option value="active">My clients (Active)</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Right Tools: + Add Client & View Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <AddClientDialog plans={plans} />

            <button
              title="Toggle View Mode"
              className="w-9 h-9 rounded-xl bg-zinc-900/70 border border-zinc-800/90 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredMembers.length > 0 &&
                      filteredMembers.every((m) => checkedIds[m.id])
                    }
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer accent-brand"
                  />
                </TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Name</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
                    <span>Last activity</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-36 text-center text-zinc-500 text-xs">
                    No clients found. Click the &quot;+&quot; button above to register an athlete.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = selectedMember?.id === member.id;
                  const isChecked = !!checkedIds[member.id];

                  return (
                    <TableRow
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className={`cursor-pointer transition-colors border-b border-zinc-850/60 ${
                        isSelected
                          ? "bg-zinc-800/40 hover:bg-zinc-800/50"
                          : "hover:bg-zinc-900/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-12 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCheck(member.id, e as any)}
                          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer accent-brand"
                        />
                      </TableCell>

                      {/* Name with Initials Badge */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(member.fullName)}
                          </div>
                          <span className="font-medium text-white text-sm">
                            {member.fullName}
                          </span>
                          {member.status === "active" && (
                            <Badge variant="vip">VIP</Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Last Activity */}
                      <TableCell className="text-xs text-zinc-400 py-3.5">
                        {formatActivityDate(member.joinDate)}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-xs text-zinc-400 font-mono py-3.5">
                        {member.phone}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Slide-over Inspector Panel (Exact Wireframe Match) */}
      <AnimatePresence>
        {selectedMember && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full lg:w-[360px] shrink-0 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-5 space-y-6 flex flex-col justify-between self-start"
          >
            <div className="space-y-6">
              {/* Drawer Tabs & Close */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-5 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`relative pb-2 transition-colors ${
                      activeTab === "overview"
                        ? "text-brand"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Overview
                    {activeTab === "overview" && (
                      <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-brand rounded-full shadow-[0_0_8px_rgba(118,185,0,0.8)]" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("activities")}
                    className={`relative pb-2 transition-colors ${
                      activeTab === "activities"
                        ? "text-brand"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Activities
                    {activeTab === "activities" && (
                      <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-brand rounded-full shadow-[0_0_8px_rgba(118,185,0,0.8)]" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {activeTab === "overview" ? (
              <div className="space-y-6">
                {/* Profile Header Box */}
                <div className="flex items-start gap-4">
                  {/* Large Square Avatar Placeholder */}
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xl text-zinc-300 shrink-0">
                    {getInitials(selectedMember.fullName)}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white truncate">
                        {selectedMember.fullName}
                      </h2>
                      <Badge variant="vip">VIP</Badge>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      Last activity:{" "}
                      <span className="text-zinc-300">
                        {formatActivityDate(selectedMember.joinDate)}
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Member since:{" "}
                      <span className="text-zinc-300">
                        {new Date(selectedMember.joinDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                    Contacts
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Email:</span>
                      <span className="text-zinc-200 font-mono text-[11px] truncate max-w-[200px]">
                        {selectedMember.email || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Phone:</span>
                      <span className="text-zinc-200 font-mono text-[11px]">
                        {selectedMember.phone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Address:</span>
                      <span className="text-zinc-200 text-[11px] truncate max-w-[200px]">
                        {selectedMember.emergencyContact || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client's Info Section */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                    Client&apos;s info
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Gender:</span>
                      <span className="text-zinc-200">{selectedMember.gender || "—"}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Age:</span>
                      <span className="text-zinc-200 font-mono">
                        {selectedMember.dateOfBirth
                          ? Math.max(
                              18,
                              new Date().getFullYear() -
                                new Date(selectedMember.dateOfBirth).getFullYear()
                            )
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Birthday:</span>
                      <span className="text-zinc-200">
                        {selectedMember.dateOfBirth
                          ? new Date(selectedMember.dateOfBirth).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not recorded"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Kiosk Token:</span>
                      <span className="text-brand font-mono text-[10px] bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20 select-all">
                        {selectedMember.qrToken.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                    Notes
                  </h3>
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 resize-none transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={!noteText.trim()}
                      className="w-full text-xs gap-1.5 h-8 font-medium"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Record Note</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Activities Tab: Live Attendance Check-ins */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Gym Check-Ins</span>
                  <span className="font-mono text-brand">{activities.length} total</span>
                </div>

                {loadingActivities ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Loading check-in log...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    No check-ins recorded for this athlete yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-medium text-zinc-200">
                              {new Date(act.checkedInAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {new Date(act.checkedInAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                          {act.method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Help Icon */}
          <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
            <button
              title="Help & Shortcuts"
              className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
