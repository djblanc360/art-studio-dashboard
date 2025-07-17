import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/workbench/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Workbench Tools</h1>
      <nav className="space-y-2">
        <Link to="/workbench/ascii-art" className="block text-blue-600 hover:text-blue-800">
          ASCII Shawnify
        </Link>
        <Link to="/workbench/csv-comparator" className="block text-blue-600 hover:text-blue-800">
          CSV Comparator
        </Link>
        <Link to="/workbench/pinterest-organizer" className="block text-blue-600 hover:text-blue-800">
          Pinterest Organizer
        </Link>
        <Link to="/workbench/property-evaluator" className="block text-blue-600 hover:text-blue-800">
          Property Evaluator
        </Link>
      </nav>
    </div>
  )
} 