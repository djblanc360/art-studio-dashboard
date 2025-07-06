import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench/ascii-art')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workbench/ascii-art"!</div>
}
