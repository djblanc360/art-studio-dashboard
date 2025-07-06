import { createFileRoute, Outlet, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Workbench Tools</h1>
      <nav>
        <Link to="/workbench/ascii-art">ASCII Art Tool</Link>
        <Link to="/workbench/csv-comparator">CSV Comparator</Link>
        <Link to="/workbench/pinterest-organizer">Pinterest Organizer</Link>
      </nav>
      <Outlet />
    </div>
  )
}
