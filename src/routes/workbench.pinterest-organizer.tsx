import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench/pinterest-organizer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workbench/pinterest-organizer"!</div>
}
