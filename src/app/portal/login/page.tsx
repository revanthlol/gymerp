"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memberLoginAction } from "@/lib/api/member-portal";

export default function MemberLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg("Please enter your mobile number or email");
      return;
    }

    startTransition(async () => {
      const res = await memberLoginAction({ identifier });
      if (!res.success) {
        setErrorMsg(res.message || "Failed to locate member account");
      } else {
        router.push("/portal");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-svh w-full flex flex-col justify-between p-6 sm:p-10 bg-[#090a0f] text-zinc-100">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2.5 font-medium group">
          <div className="flex size-7 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold text-sm">
            G
          </div>
          <span className="font-semibold text-white tracking-tight text-base">
            GymERP
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Member Portal
            </h1>
            <p className="text-sm text-zinc-400">
              Enter your mobile number or email to access your pass
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-medium text-zinc-300">
                Mobile Number or Email
              </label>
              <Input
                id="identifier"
                type="text"
                required
                placeholder="+1 (555) 000-0000 or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isPending}
                className="h-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Open Pass</span>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-zinc-400">
            Gym staff or administrator?{" "}
            <Link href="/login" className="text-white hover:underline underline-offset-4 font-medium">
              Staff sign in &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} GymERP. All rights reserved.
      </div>
    </div>
  );
}
