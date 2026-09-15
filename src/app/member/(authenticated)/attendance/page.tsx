import React from "react";
import { Metadata } from "next";
import { getMemberPortalDataAction } from "@/lib/api/member-portal";
import { AttendanceView } from "@/components/portal/attendance-view";

export const metadata: Metadata = {
  title: "Workouts & Streaks | GymERP",
  description: "View your personal workout history, consistency streaks, and turnstile access logs",
};

export const dynamic = "force-dynamic";

export default async function MemberAttendancePage() {
  const data = await getMemberPortalDataAction();

  return (
    <div className="animate-in fade-in duration-300">
      <AttendanceView
        memberUid={data.member.id}
        attendanceList={data.recentAttendance}
        stats={data.stats}
      />
    </div>
  );
}
