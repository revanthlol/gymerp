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
import {
  getMemberActivitiesAction,
  updateMemberNotesAction,
  updateMemberStatusAction,
  deleteMemberAction,
} from "@/lib/api/members";
import {
  Search,
  ChevronDown,
  X,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export interface MemberItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  status: string;
  notes?: string | null;
  qrToken: string;
  joinDate: string | Date;
  createdAt: string | Date;
}

export interface PlanItem {
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
  const [membersList, setMembersList] = useState<MemberItem[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "active" | "frozen" | "expired">("all");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(
    initialMembers[0] || null
  );
  const [activeTab, setActiveTab] = useState<"overview" | "activities">("overview");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [noteText, setNoteText] = useState(initialMembers[0]?.notes || "");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  // When selected member changes, populate their note
  useEffect(() => {
    if (selectedMember) {
      setNoteText(selectedMember.notes || "");
    }
  }, [selectedMember?.id]);

  // Filter members
  const filteredMembers = membersList.filter((m) => {
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

  const handleSaveNote = async () => {
    if (!selectedMember || !noteText.trim()) return;

    setIsSavingNote(true);
    try {
      const res = await updateMemberNotesAction(selectedMember.id, noteText);
      if (res.success && res.member) {
        setMembersList((prev) =>
          prev.map((m) => (m.id === selectedMember.id ? { ...m, notes: res.member.notes } : m))
        );
        setSelectedMember((prev) => (prev ? { ...prev, notes: res.member.notes } : null));
        toast.success("Coach note saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save coach note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: "active" | "frozen" | "expired") => {
    if (!selectedMember) return;
    try {
      const res = await updateMemberStatusAction(selectedMember.id, newStatus);
      if (res.success && res.member) {
        setMembersList((prev) =>
          prev.map((m) => (m.id === selectedMember.id ? { ...m, status: newStatus } : m))
        );
        setSelectedMember((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success(`Athlete status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update member status");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    if (!confirm(`Are you sure you want to remove ${selectedMember.fullName}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteMemberAction(selectedMember.id);
      const remaining = membersList.filter((m) => m.id !== selectedMember.id);
      setMembersList(remaining);
      setSelectedMember(remaining[0] || null);
      toast.success("Member account removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove member");
    }
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
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)] pb-12">
      {/* Left / Center Table Section */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Athletes & Members
            </h1>
            <span className="text-xs font-mono font-medium text-zinc-400 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.07]">
              {membersList.length} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AddClientDialog plans={plans} />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0c0d10] border border-white/[0.07]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search athlete by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#08090a] border-white/[0.07] text-xs h-9 rounded-lg focus:border-primary text-zinc-200"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "active", "frozen", "expired"] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => setFilterScope(scope)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  filterScope === scope
                    ? "bg-white/[0.1] text-primary font-semibold border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0c0d10] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#08090a]/80">
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredMembers.length > 0 &&
                      filteredMembers.every((m) => checkedIds[m.id])
                    }
                    className="w-4 h-4 rounded bg-[#08090a] border-zinc-700 text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                </TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Athlete</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Status</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Join Date</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-zinc-500 text-xs">
                    No members found matching your search.
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
                      className={`cursor-pointer transition-colors border-b border-white/[0.05] ${
                        isSelected
                          ? "bg-white/[0.06] hover:bg-white/[0.08]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-12 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCheck(member.id, e as any)}
                          className="w-4 h-4 rounded bg-[#08090a] border-zinc-700 text-primary focus:ring-0 cursor-pointer accent-primary"
                        />
                      </TableCell>

                      {/* Name with Initials Badge */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#14161b] border border-white/[0.08] text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <span className="font-semibold text-white text-sm block">
                              {member.fullName}
                            </span>
                            {member.email && (
                              <span className="text-[11px] text-zinc-500">{member.email}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-xs py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                            member.status === "active"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : member.status === "frozen"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {member.status}
                        </span>
                      </TableCell>

                      {/* Join Date */}
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

      {/* Right Details Drawer */}
      <AnimatePresence mode="wait">
        {selectedMember && (
          <motion.aside
            key={selectedMember.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-96 rounded-xl border border-white/[0.07] bg-[#0c0d10] p-5 flex flex-col justify-between shrink-0 shadow-xl self-start"
          >
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#14161b] border border-white/[0.08] text-primary flex items-center justify-center text-lg font-bold">
                    {getInitials(selectedMember.fullName)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                      {selectedMember.fullName}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border mt-1 ${
                        selectedMember.status === "active"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : selectedMember.status === "frozen"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {selectedMember.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="p-2 rounded-lg bg-[#08090a] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-500 text-[11px] font-mono">Set Status:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusChange("active")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      selectedMember.status === "active"
                        ? "bg-primary/20 text-primary"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusChange("frozen")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      selectedMember.status === "frozen"
                        ? "bg-sky-500/20 text-sky-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Frozen
                  </button>
                  <button
                    onClick={() => handleStatusChange("expired")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      selectedMember.status === "expired"
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Expired
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/[0.07] text-xs">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                    activeTab === "overview"
                      ? "text-primary border-primary"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("activities")}
                  className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                    activeTab === "activities"
                      ? "text-primary border-primary"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  Check-ins Log
                </button>
              </div>

              {activeTab === "overview" ? (
                <div className="space-y-4 text-xs">
                  {/* Contact Info */}
                  <div className="space-y-2 p-3 rounded-lg bg-[#08090a] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Phone</span>
                      </span>
                      <span className="text-white font-mono">{selectedMember.phone}</span>
                    </div>

                    {selectedMember.email && (
                      <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-white/[0.04]">
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Email</span>
                        </span>
                        <span className="text-white truncate max-w-[160px]">
                          {selectedMember.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coach Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-300">Coach Notes</h3>
                      <span className="text-[10px] text-zinc-500">Persisted to database</span>
                    </div>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add personal notes, injuries, fitness goals, or attendance notes..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#08090a] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary resize-none transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="w-full text-xs gap-1.5 h-8 font-semibold bg-primary hover:bg-primary-deep text-[#08090a]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingNote ? "Saving..." : "Save Coach Note"}</span>
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={handleDeleteMember}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Athlete Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Activities Tab */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Recent Visits</span>
                    <span className="font-mono text-primary">{activities.length} recorded</span>
                  </div>

                  {loadingActivities ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      Loading check-in history...
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
                          className="p-2.5 rounded-lg bg-[#08090a] border border-white/[0.06] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
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
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                            {act.method}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
