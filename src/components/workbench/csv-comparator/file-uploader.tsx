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
      
      // Read file content first to check for single-column
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        
        // Check if it's likely a single-column CSV
        const lines = content.split('\n').filter(line => line.trim())
        const sampleLines = lines.slice(0, 5)
        
        // Check if any delimiter is present in the first few lines
        const commonDelimiters = [',', '\t', '|', ';']
        const hasDelimiter = sampleLines.some(line => 
          commonDelimiters.some(delimiter => line.includes(delimiter))
        )
        
        console.group(`🔍 CSV File Analysis: ${file.name}`)
        console.log(`File size: ${file.size} bytes`)
        console.log(`Sample lines:`, sampleLines)
        console.log(`Has common delimiters: ${hasDelimiter}`)
        console.log(`Likely single-column: ${!hasDelimiter}`)
        console.groupEnd()
        
        // Papa Parse configuration with single-column workaround
        const parseConfig = {
          header: true,
          skipEmptyLines: true,
          // For single-column files, explicitly set delimiter to avoid detection issues
          delimiter: hasDelimiter ? "" : ",", // Use comma as default for single-column
          complete: (results: ParseResult<Record<string, any>>) => {
            console.group(`🎯 Parse Results: ${file.name}`)
            console.log(`Total rows: ${results.data.length}`)
            console.log(`Total errors: ${results.errors.length}`)
            console.log(`Headers detected:`, results.meta?.fields || 'None')
            console.log(`Delimiter used: "${results.meta?.delimiter || 'unknown'}"`)
            
            // Check if this is a single-column file
            const headers = results.meta?.fields || []
            const isSingleColumn = headers.length === 1
            
            if (isSingleColumn) {
              console.log(`📊 Single-column CSV confirmed with header: "${headers[0]}"`)
              console.log(`📊 Sample data:`, results.data.slice(0, 3))
            }
            
            if (results.errors.length > 0) {
              console.group(`🚨 Parsing Errors`)
              console.log(`Total errors: ${results.errors.length}`)
              
              // Special handling for single-column delimiter detection errors
              const delimiterErrors = results.errors.filter(e => 
                e.code === 'UndetectableDelimiter' || e.type === 'Delimiter'
              )
              
              if (delimiterErrors.length > 0 && !hasDelimiter) {
                console.log(`🔧 Delimiter detection failed for single-column file - this is expected`)
                console.log(`🔧 Retrying with explicit comma delimiter...`)
                
                // Retry with explicit comma delimiter for single-column files
                Papa.parse(file, {
                  header: true,
                  skipEmptyLines: true,
                  delimiter: ",",
                  complete: (retryResults: ParseResult<Record<string, any>>) => {
                    console.log(`🔄 Retry results: ${retryResults.data.length} rows, ${retryResults.errors.length} errors`)
                    if (retryResults.data.length > 0) {
                      onFileProcessed(retryResults.data, file.name)
                    } else {
                      setError("Unable to parse single-column CSV file. Please check the file format.")
                    }
                  }
                })
                console.groupEnd()
                console.groupEnd()
                return
              }
              
              // Log detailed error information
              results.errors.forEach((error, index) => {
                console.group(`Error ${index + 1}:`)
                console.log(`Type: ${error.type || 'Unknown'}`)
                console.log(`Code: ${error.code || 'N/A'}`)
                console.log(`Message: ${error.message || 'No message'}`)
                console.log(`Row: ${error.row !== undefined ? error.row + 1 : 'N/A'} (1-indexed)`)
                console.log(`Column: ${error.index !== undefined ? error.index : 'N/A'}`)
                
                if (error.row !== undefined && results.data[error.row]) {
                  console.log(`Row data:`, results.data[error.row])
                }
                console.groupEnd()
              })
              
              // Create user-friendly error message
              const criticalErrors = results.errors.filter(e => 
                e.type === 'Quotes' || e.type === 'Delimiter' || e.type === 'FieldMismatch'
              )
              
              if (criticalErrors.length > 0) {
                const firstError = criticalErrors[0]
                const lineNumber = firstError.row !== undefined ? firstError.row + 1 : 'unknown'
                setError(`CSV parsing error on line ${lineNumber}: ${firstError.message}. ${isSingleColumn ? 'Single-column file detected. ' : ''}Check console for detailed debugging.`)
              } else {
                setError(`CSV parsing completed with ${results.errors.length} warning(s). ${isSingleColumn ? 'Single-column file processed. ' : ''}Check console for details.`)
              }
              
              console.groupEnd()
            }
            
            // Process data if available
            if (results.data.length > 0) {
              console.log(`✅ Successfully processed ${results.data.length} rows`)
              onFileProcessed(results.data, file.name)
            } else if (results.errors.length === 0) {
              setError("No data found in CSV file.")
            }
            
            console.groupEnd()
          },
                     error: (error: Error) => {
             console.error('🚨 File reading error:', error)
             setError(`Failed to read file: ${error.message}`)
           }
        }
        
        // Parse the file
        Papa.parse(file, parseConfig)
      }
      
      reader.onerror = () => {
        setError("Failed to read file")
      }
      
      reader.readAsText(file)
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
