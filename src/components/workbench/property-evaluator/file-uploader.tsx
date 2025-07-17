"use client"

import { useState } from "react"
import type { DragEvent } from "react"
import Papa from "papaparse"
import type { ParseResult } from "papaparse"
import { UploadCloud, FileCheck2, Loader2 } from "lucide-react"
import { cn } from "~/lib/utils"

import type { CollectorSubmission} from '~/integrations/rentcast/types';
import { parseCSVFile } from '~/integrations/rentcast/processing';

type FileUploaderProps = {
  onFileProcessed: (data: CollectorSubmission[], fileName: string) => void;
  id: string;
  title: string;
  disabled?: boolean;
};

export function FileUploader({ onFileProcessed, id, title, disabled = false }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (file && file.type === "text/csv") {
      setFileName(file.name);
      setError(null);
      setIsProcessing(true);
      
      try {
        console.group(`💸 Collector CSV Processing: ${file.name}`);
        console.log(`File size: ${file.size} bytes`);
        
        const collectors = await parseCSVFile(file);
        
        console.log(`✅ Successfully parsed ${collectors.length} collector submissions`);
        console.log(`📊 Sample collector:`, collectors[0]);
        console.groupEnd();
        
        onFileProcessed(collectors, file.name);
        setIsProcessing(false);
      } catch (parseError) {
        console.error('🚨 Collector CSV parsing failed:', parseError);
        console.groupEnd();
        setError(parseError instanceof Error ? parseError.message : 'Failed to parse collector CSV');
        setIsProcessing(false);
      }
    } else {
      setError("Please upload a valid .csv file with collector data.");
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</h3>
      <label
        htmlFor={id}
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-lg flex flex-col justify-center items-center transition-colors",
          disabled 
            ? "border-gray-200 bg-gray-50 cursor-not-allowed" 
            : "cursor-pointer",
          !disabled && isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : !disabled && "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          fileName && !disabled && "border-green-500 bg-green-50 dark:bg-green-900/20",
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
          disabled={disabled}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        {isProcessing ? (
          <div className="text-center text-blue-600">
            <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            <p className="mt-2 font-semibold">Processing CSV...</p>
          </div>
        ) : fileName ? (
          <div className="text-center text-green-700 dark:text-green-300">
            <FileCheck2 className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">File Uploaded</p>
            <p className="text-sm">{fileName}</p>
          </div>
        ) : (
          <div className={cn(
            "text-center",
            disabled ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
          )}>
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">
              {disabled ? "Upload disabled during processing" : "Drag & drop or click to upload"}
            </p>
            <p className="text-sm">Collector CSV files only</p>
          </div>
        )}
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}