import React from "react";
import { Metadata } from "next";
import { getMemberClassesAction } from "@/lib/api/classes";
import { getMemberPortalDataAction } from "@/lib/api/member-portal";
import { ClassesView } from "@/components/portal/classes-view";

export const metadata: Metadata = {
  title: "Group Fitness Classes | GymERP",
  description: "Browse the weekly timetable, reserve your spot with 1-click RSVP, and sync to your calendar",
};

export const dynamic = "force-dynamic";

export default async function MemberClassesPage() {
  const [classesList, portalData] = await Promise.all([
    getMemberClassesAction(),
    getMemberPortalDataAction(),
  ]);

  return (
    <div className="animate-in fade-in duration-300">
      <ClassesView
        initialClasses={classesList as any}
        gymName={portalData.gym.name}
      />
    </div>
  );
}
