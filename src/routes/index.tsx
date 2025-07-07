"use client"

import { useState } from "react"

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: CommandCenterWidgets,
})


import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable"
import { Activity, CreditCard, DollarSign, Users } from "lucide-react"

import { SortableCard } from "~/components/command-center/sortable-card"
import { CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

const initialWidgets = [
    {
      id: "widget-1",
      title: "Widget 1",
      icon: DollarSign,
      content: "10000",
      subContent: "10000",
    },
    {
      id: "widget-2",
      title: "Widget 2",
      icon: Users,
      content: "10000",
      subContent: "10000",
    },
    {
      id: "widget-3",
      title: "Widget 3",
      icon: CreditCard,
      content: "10000",
      subContent: "10000",
    },
    {
      id: "widget-4",
      title: "Widget 4",
      icon: Activity,
      content: "10000",
      subContent: "10000",
    },
]

function CommandCenterWidgets() {
  const [widgets, setWidgets] = useState(initialWidgets)
  const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      }),
  )

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (over && active.id !== over.id) {
    setWidgets((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }
}
  return (
      <>
      <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">COMMAND CENTER</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
              Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
              Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
              Notifications
          </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {widgets.map((widget) => (
                  <SortableCard key={widget.id} id={widget.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                      <widget.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                      <div className="text-2xl font-bold">{widget.content}</div>
                      <p className="text-xs text-muted-foreground">{widget.subContent}</p>
                      </CardContent>
                  </SortableCard>
                  ))}
              </div>
              </SortableContext>
          </DndContext>
          </TabsContent>
      </Tabs>
      </>
  )
}