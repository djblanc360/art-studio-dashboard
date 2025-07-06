import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/the-lab')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/the-lab"!</div>
}
