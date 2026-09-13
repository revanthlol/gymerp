"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/admin/add-client-dialog";
import {
  getMemberActivitiesAction, updateMemberNotesAction, updateMemberStatusAction, deleteMemberAction,
} from "@/lib/api/members";
import {
  Search, Phone, Mail, Save, CheckCircle2, Trash2, X, UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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

function statusLabel(status: string) {
  if (status === "active") return <span className="text-xs font-semibold text-primary">Active</span>;
  if (status === "frozen") return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Frozen</span>;
  return <span className="text-xs font-semibold text-muted-foreground">Expired</span>;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function ClientsView({ initialMembers, plans }: ClientsViewProps) {
  const [membersList, setMembersList] = useState<MemberItem[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "active" | "frozen" | "expired">("all");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(initialMembers[0] || null);
  const [activeTab, setActiveTab] = useState<"overview" | "activities">("overview");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [noteText, setNoteText] = useState(initialMembers[0]?.notes || "");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => { setMembersList(initialMembers); }, [initialMembers]);
  useEffect(() => { if (selectedMember) setNoteText(selectedMember.notes || ""); }, [selectedMember?.id]);

  useEffect(() => {
    if (selectedMember && activeTab === "activities") {
      setLoadingActivities(true);
      getMemberActivitiesAction(selectedMember.id)
        .then((res) => setActivities(res || []))
        .catch(() => setActivities([]))
        .finally(() => setLoadingActivities(false));
    }
  }, [selectedMember, activeTab]);

  const filteredMembers = membersList.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch = m.fullName.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q));
    const matchesScope = filterScope === "all" || m.status === filterScope;
    return matchesSearch && matchesScope;
  });

  const handleSaveNote = async () => {
    if (!selectedMember) return;
    setIsSavingNote(true);
    try {
      await updateMemberNotesAction(selectedMember.id, noteText);
      setMembersList((prev) => prev.map((m) => m.id === selectedMember.id ? { ...m, notes: noteText } : m));
      setSelectedMember((prev) => prev ? { ...prev, notes: noteText } : prev);
      toast.success("Notes saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save notes");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: "active" | "expired" | "frozen") => {
    if (!selectedMember) return;
    try {
      await updateMemberStatusAction(selectedMember.id, newStatus);
      setMembersList((prev) => prev.map((m) => m.id === selectedMember.id ? { ...m, status: newStatus } : m));
      setSelectedMember((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    if (!confirm(`Remove ${selectedMember.fullName}? This cannot be undone.`)) return;
    try {
      const res = await deleteMemberAction(selectedMember.id);
      if (res && !res.success) { toast.error(res.error || "Failed"); return; }
      const remaining = membersList.filter((m) => m.id !== selectedMember.id);
      setMembersList(remaining);
      setSelectedMember(remaining[0] || null);
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">
            {membersList.length} registered · {membersList.filter((m) => m.status === "active").length} active
          </p>
        </div>
        <AddClientDialog
          plans={plans}
          onMemberAdded={(newMember) => {
            setMembersList((prev) => [newMember, ...prev]);
            setSelectedMember(newMember);
          }}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/60 border-border text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "active", "frozen", "expired"] as const).map((scope) => (
            <button
              key={scope}
              onClick={() => setFilterScope(scope)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterScope === scope
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left — member list */}
        <div className="lg:w-80 xl:w-96 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <UserX className="size-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}>
                        {getInitials(member.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-foreground" : "text-foreground"}`}>{member.fullName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{member.phone}</p>
                      </div>
                      <div className="ml-auto shrink-0">{statusLabel(member.status)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right — detail panel */}
        <AnimatePresence mode="wait">
          {selectedMember ? (
            <motion.div
              key={selectedMember.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
              className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col"
            >
              {/* Member header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {getInitials(selectedMember.fullName)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{selectedMember.fullName}</h2>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(selectedMember.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {/* Status toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-lg">
                  {(["active", "frozen", "expired"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                        selectedMember.status === s
                          ? s === "active" ? "bg-card text-primary shadow-sm border border-border"
                          : s === "frozen" ? "bg-card text-amber-500 shadow-sm border border-border"
                          : "bg-card text-muted-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-6">
                {(["overview", "activities"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 pt-3 px-1 mr-5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                      activeTab === tab
                        ? "text-foreground border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    {tab === "activities" ? "Check-in Log" : tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "overview" ? (
                  <div className="space-y-6">
                    {/* Contact */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
                      <div className="rounded-lg border border-border divide-y divide-border">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="size-3.5" /> Phone
                          </span>
                          <span className="text-xs text-foreground font-mono">{selectedMember.phone}</span>
                        </div>
                        {selectedMember.email && (
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="size-3.5" /> Email
                            </span>
                            <span className="text-xs text-foreground truncate max-w-[180px]">{selectedMember.email}</span>
                          </div>
                        )}
                        {selectedMember.gender && (
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs text-muted-foreground">Gender</span>
                            <span className="text-xs text-foreground capitalize">{selectedMember.gender}</span>
                          </div>
                        )}
                        {selectedMember.emergencyContact && (
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs text-muted-foreground">Emergency</span>
                            <span className="text-xs text-foreground">{selectedMember.emergencyContact}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
                      <textarea
                        rows={3}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Injuries, goals, attendance notes..."
                        className="w-full rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                      />
                      <Button size="sm" onClick={handleSaveNote} disabled={isSavingNote} className="h-8 text-xs gap-1.5 w-full">
                        {isSavingNote ? <><Spinner size="sm" variant="current" className="mr-1" />Saving...</> : <><Save className="size-3.5" />Save Notes</>}
                      </Button>
                    </div>

                    {/* Danger */}
                    <div className="pt-2 border-t border-border">
                      <button onClick={handleDeleteMember} className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1.5 transition-colors">
                        <Trash2 className="size-3.5" />
                        Remove member account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Check-ins</span>
                      <span className="text-xs text-muted-foreground">{activities.length} total</span>
                    </div>
                    {loadingActivities ? (
                      <div className="py-10 flex items-center justify-center"><Spinner /></div>
                    ) : activities.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-xs text-muted-foreground">No check-ins recorded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {activities.map((act) => (
                          <div key={act.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-foreground">{new Date(act.checkedInAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{new Date(act.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground capitalize">{act.method}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-border flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a member to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
