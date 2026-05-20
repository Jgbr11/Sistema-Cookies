"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Checkbox simples sem dependência de @radix-ui/react-checkbox.
 * Compatível com a mesma API do shadcn Checkbox.
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "h-4 w-4 rounded border border-[#0a0a50]/40 text-[#0a0a50] accent-[#0a0a50] cursor-pointer",
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
