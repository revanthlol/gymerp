import React from "react";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ClassesView } from "@/components/admin/classes-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitness Classes & Scheduling | GymERP",
  description: "Schedule group classes, track athlete registrations, and assign instructors",
};

export default async function AdminClassesPage() {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    redirect("/login");
  }

  return <ClassesView />;
}
