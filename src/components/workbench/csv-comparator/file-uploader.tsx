"use client"

import { useState } from "react"
import type { DragEvent } from "react"
import Papa from "papaparse"
import type { ParseResult } from "papaparse"
import { UploadCloud, FileCheck2 } from "lucide-react"
import { cn } from "~/lib/utils"

type CsvData = Record<string, any>[]

interface FileUploaderProps {
  onFileProcessed: (data: CsvData, fileName: string) => void
  id: string
  title: string
}

export function FileUploader({ onFileProcessed, id, title }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    if (file && file.type === "text/csv") {
      setFileName(file.name)
      setError(null)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<Record<string, any>>) => {
          if (results.errors.length) {
            setError("Error parsing CSV. Please check the file format.")
            console.error("Parsing errors:", results.errors)
          } else {
            onFileProcessed(results.data, file.name)
          }
        },
      })
    } else {
      setError("Please upload a valid .csv file.")
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</h3>
      <label
        htmlFor={id}
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          fileName && "border-green-500 bg-green-50 dark:bg-green-900/20",
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        {fileName ? (
          <div className="text-center text-green-700 dark:text-green-300">
            <FileCheck2 className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">File Uploaded</p>
            <p className="text-sm">{fileName}</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">Drag & drop or click to upload</p>
            <p className="text-sm">CSV files only</p>
          </div>
        )}
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
