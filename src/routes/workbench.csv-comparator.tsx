import { createFileRoute, Link } from '@tanstack/react-router'
import CsvComparator from '~/components/workbench/csv-comparator/comparator'

export const Route = createFileRoute('/workbench/csv-comparator')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div className="mb-4">
        <Link to="/workbench" className="text-blue-600 hover:text-blue-800">
          ← Back to Workbench
        </Link>
      </div>
      <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">CSV Comparator</h1>
        <p className="text-muted-foreground mt-2">
          Compare two CSV files and perform operations on them.
          </p>
        </header>
        <CsvComparator />
      </div>
    </div>
  )
}
