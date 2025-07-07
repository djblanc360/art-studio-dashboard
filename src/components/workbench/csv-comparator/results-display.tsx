"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Download, Loader2, Info, ListChecks } from "lucide-react"
import { ClipboardList } from "lucide-react"
import type { Operation, ComparisonSummary } from "./comparator"
import { operationDescriptions, ExampleTable } from "./operation-examples"

type ResultsDisplayProps = {
  result: Record<string, any>[] | null
  loading: boolean
  operation: Operation
  onDownload: () => void
  file1Name?: string
  file2Name?: string
  keyColumn: string
  summary: ComparisonSummary | null
}

const SummaryDisplay = ({ summary, operation }: { summary: ComparisonSummary; operation: Operation }) => {
  const { file1RecordCount, file2RecordCount, resultRecordCount, file1Name, file2Name } = summary

  let resultLabel = ""
  let rate = 0
  let rateLabel = ""

  switch (operation) {
    case "match":
      resultLabel = `Records kept (matched)`
      rateLabel = "Retention rate"
      if (file1RecordCount > 0) {
        rate = (resultRecordCount / file1RecordCount) * 100
      }
      break
    case "diff":
      resultLabel = `Records in ${file1Name} but not in ${file2Name}`
      rateLabel = "Retention rate"
      if (file1RecordCount > 0) {
        rate = (resultRecordCount / file1RecordCount) * 100
      }
      break
    case "combo":
      resultLabel = `Total unique records combined`
      rateLabel = "" // No rate for combo
      break
  }

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
      <h4 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">
        <ClipboardList className="h-5 w-5 mr-2" /> Comparison Summary
      </h4>
      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
        <li className="flex justify-between items-center">
          <span>
            <span className="font-mono mr-2">├──</span>Source file ({file1Name}):
          </span>
          <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{file1RecordCount} records</span>
        </li>
        <li className="flex justify-between items-center">
          <span>
            <span className="font-mono mr-2">├──</span>Reference file ({file2Name}):
          </span>
          <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{file2RecordCount} records</span>
        </li>
        <li className="flex justify-between items-center">
          <span>
            <span className="font-mono mr-2">├──</span>
            {resultLabel}:
          </span>
          <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
            {resultRecordCount} records
          </span>
        </li>
        {rateLabel && (
          <li className="flex justify-between items-center">
            <span>
              <span className="font-mono mr-2">└──</span>
              {rateLabel}:
            </span>
            <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{rate.toFixed(2)}%</span>
          </li>
        )}
      </ul>
    </div>
  )
}

export function ResultsDisplay({
  result,
  loading,
  operation,
  onDownload,
  file1Name,
  file2Name,
  keyColumn,
  summary,
}: ResultsDisplayProps) {
  const headers = result && result.length > 0 ? Object.keys(result[0]) : []
  const opInfo = operationDescriptions[operation]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p className="text-lg font-medium">Processing files...</p>
        </div>
      )
    }

    if (result && summary) {
      return (
        <>
          <SummaryDisplay summary={summary} operation={operation} />
          {result.length > 0 ? (
            <div className="w-full overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header) => (
                        <TableCell key={header}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Info className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No matching records found.</p>
              <p>Your operation resulted in an empty set.</p>
            </div>
          )}
        </>
      )
    }

    // Show example
    return (
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{opInfo.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ExampleTable title={opInfo.example.file1.name} data={opInfo.example.file1.data} />
          <ExampleTable title={opInfo.example.file2.name} data={opInfo.example.file2.data} />
          <ExampleTable title={opInfo.example.output.name} data={opInfo.example.output.data} />
        </div>
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <ListChecks className="h-5 w-5 mr-2" />
            Practical Use Cases
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
            {opInfo.useCases.map((useCase, i) => (
              <li key={i}>{useCase}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>3. Results</CardTitle>
            <CardDescription>
              {result
                ? `Showing results for '${opInfo.title}' on '${file1Name}' and '${file2Name}' using key '${keyColumn}'.`
                : `Example for '${opInfo.title}'`}
            </CardDescription>
          </div>
          {result && result.length > 0 && (
            <Button onClick={onDownload} className="mt-4 sm:mt-0">
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}
