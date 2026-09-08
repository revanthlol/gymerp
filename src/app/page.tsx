import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "platform") {
    redirect("/platform");
  } else if (session.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/staff");
  }
}
