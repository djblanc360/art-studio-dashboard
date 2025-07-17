import { createFileRoute, Link } from '@tanstack/react-router'
import PropertyEvaluator from '~/components/workbench/property-evaluator/evaluator'


export const Route = createFileRoute('/workbench/property-evaluator')({
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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Property Evaluator</h1>
        <p className="text-muted-foreground mt-2">
          Upload your collector submissions CSV to assess wealth scores and prioritize high-value collectors for product drops.
          </p>
        </header>
        <PropertyEvaluator />
      </div>
    </div>
  )
}