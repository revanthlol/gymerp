import { cookies, headers } from "next/headers";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://gymerp.duckdns.org";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    const memberCookie = cookieStore.get("__member_session")?.value;

    const cookieParts: string[] = [];
    if (sessionCookie) {
      cookieParts.push(`__session=${sessionCookie}`);
      reqHeaders["Authorization"] = `Bearer ${sessionCookie}`;
    }
    if (memberCookie) {
      cookieParts.push(`__member_session=${memberCookie}`);
    }

    if (cookieParts.length > 0) {
      reqHeaders["Cookie"] = cookieParts.join("; ");
    }
  } catch {
    // In client component or non-SSR context, cookies() might throw
  }

  return reqHeaders;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const defaultHeaders = await getAuthHeaders();

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to reach backend API gateway",
    };
  }
}
