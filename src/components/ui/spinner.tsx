import * as React from "react"
import { cn } from "@/lib/utils"
import { RiLoaderLine } from "@remixicon/react"

export interface SpinnerProps extends Omit<React.ComponentProps<typeof RiLoaderLine>, "children"> {
  size?: "xs" | "sm" | "md" | "lg"
  variant?: "default" | "primary" | "current"
}

const sizeMap = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

function Spinner({ className, size = "sm", variant, ...props }: SpinnerProps) {
  return (
    <RiLoaderLine
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin",
        sizeMap[size] || "size-4",
        variant === "primary" && "text-primary",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
