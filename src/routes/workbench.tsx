import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
