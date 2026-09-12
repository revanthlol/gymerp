import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin text-primary shrink-0", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      default: "h-5 w-5",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      muted: "text-zinc-500",
      white: "text-white",
      current: "text-current",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

export interface SpinnerProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

export function Spinner({
  className,
  size,
  variant,
  label = "Loading...",
  ...props
}: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  );
}
