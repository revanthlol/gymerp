import React from "react";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ClassesView } from "@/components/admin/classes-view";
import { getClassesAction } from "@/lib/api/classes";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitness Classes & Scheduling | Staff GymERP",
  description: "Manage group class schedules and athlete attendance",
};

export const dynamic = "force-dynamic";

export default async function StaffClassesPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const rawClasses = await getClassesAction();
  const classes = rawClasses.map((c: any) => ({
    id: c.id,
    name: c.name,
    trainer: c.trainer,
    time: c.time,
    durationMinutes: c.durationMinutes,
    dayOfWeek: c.dayOfWeek,
    location: c.location,
    capacity: c.capacity,
    bookedCount: c.bookedCount,
    category: (c.category as "Strength" | "Cardio" | "Combat" | "Mind & Body") || "Strength",
  }));

  return <ClassesView initialClasses={classes} />;
}
