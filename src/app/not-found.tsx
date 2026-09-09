import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080809] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-orange-400 font-mono text-lg font-bold">
          404
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Page Not Found</h1>
        <p className="text-sm text-zinc-400">
          The requested route does not exist or has been relocated within the partition.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="secondary" className="gap-2 text-xs">
              <MoveLeft className="w-3.5 h-3.5" />
              <span>Back to Authentication</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
