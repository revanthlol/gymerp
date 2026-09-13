export interface GymClassEvent {
  id: string;
  name: string;
  trainer: string;
  time: string; // e.g. "07:00 AM" or "18:00"
  durationMinutes: number;
  dayOfWeek: string; // e.g. "Monday" | "Daily" | "Tuesday"
  location: string;
  category: string;
}

// Compute the next upcoming Date for a day of week and time
export function getNextClassDateTime(dayOfWeek: string, timeStr: string): { start: Date; end: Date } {
  const now = new Date();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  let targetDayIndex = daysOfWeek.indexOf(dayOfWeek);
  if (targetDayIndex === -1) {
    // If "Daily" or unspecified, use today (or tomorrow if time passed)
    targetDayIndex = now.getDay();
  }

  // Parse timeStr (e.g. "07:00 AM", "6:30 PM", "18:00")
  let hours = 9;
  let minutes = 0;

  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const meridiem = match12[3]?.toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  }

  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);

  // Calculate day difference
  let dayDiff = targetDayIndex - now.getDay();
  if (dayDiff < 0 || (dayDiff === 0 && start.getTime() <= now.getTime())) {
    dayDiff += 7;
  }
  start.setDate(now.getDate() + dayDiff);

  const end = new Date(start.getTime() + 60 * 60 * 1000); // 60 mins default
  return { start, end };
}

// Format date into iCalendar/Google UTC format: YYYYMMDDTHHmmssZ
function formatToCalUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// 1. Google Calendar 1-Click Link
export function generateGoogleCalendarUrl(cls: GymClassEvent): string {
  const { start, end } = getNextClassDateTime(cls.dayOfWeek, cls.time);
  const startIso = formatToCalUtc(start);
  const endIso = formatToCalUtc(end);

  const title = `${cls.name} Class — GymERP`;
  const details = `Gym workout session led by Coach ${cls.trainer}.\nCategory: ${cls.category}\nDuration: ${cls.durationMinutes || 60} minutes\nLocation: ${cls.location}\n\nPlease arrive 10 minutes early and check in via turnstile.`;
  const location = cls.location || "Gym Studio";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    location
  )}`;
}

// 2. Standard Apple / Outlook / iCalendar (.ics) File Generator & Downloader
export function downloadIcsFile(cls: GymClassEvent): void {
  const { start, end } = getNextClassDateTime(cls.dayOfWeek, cls.time);
  const startIso = formatToCalUtc(start);
  const endIso = formatToCalUtc(end);
  const nowIso = formatToCalUtc(new Date());

  const uid = `class-${cls.id}-${startIso}@gymerp.app`;
  const title = `${cls.name} Class — GymERP`;
  const description = `Workout session with Coach ${cls.trainer}. Category: ${cls.category}. Location: ${cls.location}. Check in via turnstile on arrival.`;
  const location = cls.location || "Gym Studio";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GymERP//Class Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    // 1-Hour Pre-Class Notification Alert
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${cls.name} begins in 1 hour at ${cls.location}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cls.name.toLowerCase().replace(/\s+/g, "_")}_class.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
