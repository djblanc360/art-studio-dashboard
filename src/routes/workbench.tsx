import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workbench"!</div>
}
