import { createFileRoute, Link } from '@tanstack/react-router'

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
      <h1 className="text-2xl font-bold mb-4">ASCII Art Tool</h1>
      <div className="space-y-4">
        <p>Create ASCII art from text or images.</p>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm">
{`  _    _      _ _         _    _            _     _ 
 | |  | |    | | |       | |  | |          | |   | |
 | |__| | ___| | | ___   | |  | | ___  _ __| | __| |
 |  __  |/ _ \\ | |/ _ \\  | |/\\| |/ _ \\| '__| |/ _\` |
 | |  | |  __/ | | (_) | \\  /\\  / (_) | |  | | (_| |
 |_|  |_|\\___|_|_|\\___/   \\/  \\/ \\___/|_|  |_|\\__,_|`}
          </pre>
        </div>
      </div>
    </div>
  )
}
