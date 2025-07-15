"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Label } from "~/components/ui/label"
import { Shapes } from "lucide-react"
import type { SvgCharState } from "./types"

interface SvgUploaderProps {
  svgState: SvgCharState
  onSvgUpload: (svgState: Partial<SvgCharState>) => void
  onError: (error: string) => void
}

export function SvgUploader({ svgState, onSvgUpload, onError }: SvgUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file && file.type === "image/svg+xml") {
        const reader = new FileReader()
        reader.onload = (e) => {
          const svgContent = e.target?.result as string
          const processed = svgContent
            .replace(/fill="[^"]*"/g, 'fill="currentColor"')
            .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
          
          const blob = new Blob([svgContent], { type: "image/svg+xml" })
          const url = URL.createObjectURL(blob)
          
          onSvgUpload({
            svgChar: svgContent,
            processedSvgChar: processed,
            svgCharPreview: url,
          })
        }
        reader.readAsText(file)
      } else {
        onError("Please upload a valid SVG file.")
      }
    },
    [onSvgUpload, onError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/svg+xml": [".svg"] },
    multiple: false,
  })

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Shapes size={16} /> Upload SVG Character
      </Label>
      <div
        {...getRootProps()}
        className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? "Drop SVG here" : "Click or drag to upload SVG"}
        </p>
      </div>
      {svgState.svgCharPreview && (
        <div className="mt-2 p-2 border rounded-lg flex justify-center items-center bg-white">
          <img src={svgState.svgCharPreview} alt="SVG Preview" className="h-16 w-16" />
        </div>
      )}
    </div>
  )
} 