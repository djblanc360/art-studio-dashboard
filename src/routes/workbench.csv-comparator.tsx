import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench/csv-comparator')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workbench/csv-comparator"!</div>
}
