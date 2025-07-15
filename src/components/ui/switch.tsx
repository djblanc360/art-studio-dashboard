import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "~/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "cursor-pointer peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-slate-300 bg-slate-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-75 disabled:border-slate-400 disabled:bg-slate-200 data-[state=checked]:bg-primary data-[state=checked]:disabled:bg-primary/60 data-[state=unchecked]:bg-slate-100 data-[state=unchecked]:disabled:bg-slate-200",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white border border-slate-300 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 disabled:bg-slate-50 disabled:border-slate-400"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
