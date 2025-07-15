"use client"

import { useState } from "react"
import type { ChangeEvent } from "react"
import Papa from "papaparse"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Label } from "~/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { FileUploader } from "./file-uploader"
import { ResultsDisplay } from "./results-display"
import { matchData, diffData, combineData, filterData } from "./operations"
import { AlertCircle, ArrowRight } from "lucide-react"

type CsvData = Record<string, any>[]
export type Operation = "match" | "diff" | "combo" | "filter"

export type ComparisonSummary = {
  file1RecordCount: number
  file2RecordCount: number
  resultRecordCount: number
  file1Name: string
  file2Name: string
}

export default function CsvComparator() {
  const [file1, setFile1] = useState<{ name: string; data: CsvData } | null>(null)
  const [file2, setFile2] = useState<{ name: string; data: CsvData } | null>(null)
  const [operation, setOperation] = useState<Operation>("match")
  const [result, setResult] = useState<CsvData | null>(null)
  const [summary, setSummary] = useState<ComparisonSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyColumn, setKeyColumn] = useState("Email")
  const [filterValue, setFilterValue] = useState("")

  const handleFile1Upload = (data: CsvData, name: string) => {
    setFile1({ data, name })
    setResult(null)
    setError(null)
    setSummary(null)
  }

  const handleFile2Upload = (data: CsvData, name: string) => {
    setFile2({ data, name })
    setResult(null)
    setError(null)
    setSummary(null)
  }

  const handleCompare = () => {
    if (!file1 || !file2) {
      setError("Please upload both CSV files.")
      return
    }
    if (!keyColumn) {
      setError("Please enter a column name to use as the key for comparison.")
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    setSummary(null)

    setTimeout(() => {
      try {
        let output: CsvData = []
        if (operation === "match") {
          output = matchData(file1.data, file2.data, keyColumn)
        } else if (operation === "diff") {
          output = diffData(file1.data, file2.data, keyColumn)
        } else if (operation === "combo") {
          output = combineData(file1.data, file2.data, keyColumn)
        }
        setResult(output)

        const newSummary: ComparisonSummary = {
          file1RecordCount: file1.data.length,
          file2RecordCount: file2.data.length,
          resultRecordCount: output.length,
          file1Name: file1.name,
          file2Name: file2.name,
        }
        setSummary(newSummary)
      } catch (e) {
        setError("An error occurred during comparison. Please check the file format and content.")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  const handleFilter = () => {
    if (!file1) {
      setError("Please upload a file.")
      return
    }
    if (!keyColumn) {
      setError("Please enter a column name to use as the key for filtering.")
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    setSummary(null)

    setTimeout(() => {
      try {
        let output: CsvData = []
        output = filterData(file1.data, keyColumn, filterValue)
        setResult(output)

        const newSummary: ComparisonSummary = {
          file1RecordCount: file1.data.length,
          file2RecordCount: 0,
          resultRecordCount: output.length,
          file1Name: file1.name,
          file2Name: "",
        }
        setSummary(newSummary)
      } catch (e) {
        setError("An error occurred during filtering. Please check the file format and content.")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  
  const handleDownload = () => {
    if (!result) return
    const csv = Papa.unparse(result)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    const file1Name = file1?.name.replace(".csv", "") || "file1"
    const file2Name = file2?.name.replace(".csv", "") || "file2"
    let downloadFilename = "result.csv"

    if (operation === "match") {
      downloadFilename = `matched_${file1Name}_by_${file2Name}.csv`
    } else if (operation === "diff") {
      downloadFilename = `diff_${file1Name}_and_${file2Name}.csv`
    } else if (operation === "combo") {
      downloadFilename = `combined_${file1Name}_and_${file2Name}.csv`
    } else if (operation === "filter") {
      downloadFilename = `filtered_${file1Name}.csv`
    }

    link.setAttribute("download", downloadFilename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploader onFileProcessed={handleFile1Upload} id="file1" title="Source File (File 1)" />
            {operation !== "filter" && (
              <FileUploader onFileProcessed={handleFile2Upload} id="file2" title="Reference File (File 2)" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Configure Operation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="key-column" className="text-base font-medium">
              Comparison Key
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Enter the column name to use for matching records (e.g., 'Email', 'ID').
            </p>
            <input
              id="key-column"
              type="text"
              value={keyColumn}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyColumn(e.target.value)}
              className="w-full max-w-xs p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g., Email"
            />
          </div>
          <div>
            <Label className="text-base font-medium">Operation</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Choose how you want to compare the files.</p>
            <RadioGroup
              value={operation}
              onValueChange={(value: string) => {
                setOperation(value as Operation)
                setResult(null)
                setSummary(null)
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="match" id="match" />
                <Label htmlFor="match">Match</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diff" id="diff" />
                <Label htmlFor="diff">Difference</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="combo" id="combo" />
                <Label htmlFor="combo">Combine</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="filter" id="filter" />
                <Label htmlFor="filter">Filter</Label>
              </div>
            </RadioGroup>
          </div>
          {operation === "filter" ? (
            <>
            <div>
              <input
                id="filter-value"
                type="text"
                placeholder="Enter the value to filter out"
                value={filterValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterValue(e.target.value)}
                className="text-gray-500 w-full max-w-xs p-2 border border-slate-800 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={handleFilter} disabled={!file1 || loading || !keyColumn} size="lg">
                {loading ? "Filtering..." : "Run Filter"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </div>
            </>
          ) : (
          <div className="flex justify-center pt-4">
            <Button onClick={handleCompare} disabled={!file1 || !file2 || loading || !keyColumn} size="lg">
              {loading ? "Comparing..." : "Run Comparison"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ResultsDisplay
        result={result}
        loading={loading}
        operation={operation}
        onDownload={handleDownload}
        file1Name={file1?.name}
        file2Name={file2?.name}
        keyColumn={keyColumn}
        summary={summary}
      />
    </div>
  )
}
