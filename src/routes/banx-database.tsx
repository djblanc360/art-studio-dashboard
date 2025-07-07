import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/banx-database')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/banx-database"!</div>
}
