import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/operations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/operatons"!</div>
}
