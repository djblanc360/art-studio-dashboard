import { createFileRoute, Link } from '@tanstack/react-router'
import AsciiConverter from '~/components/workbench/ascii-art/ascii-converter'

export const Route = createFileRoute('/workbench/ascii-art')({
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
      <AsciiConverter />
    </div>
  )
}
