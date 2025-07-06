"use client"

import type React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "~/components/ui/card"
import { cn } from "~/lib/utils"

interface SortableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
}

export function SortableCard({ id, children, className, ...props }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={cn("cursor-grab active:cursor-grabbing", isDragging && "shadow-lg", className)} {...props}>
        {children}
      </Card>
    </div>
  )
}
