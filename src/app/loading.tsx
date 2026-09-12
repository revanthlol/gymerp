import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080809]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <Spinner size="md" className="text-white" />
        </div>
        <span className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}
