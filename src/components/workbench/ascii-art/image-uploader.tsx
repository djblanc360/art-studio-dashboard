"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { UploadCloud } from "lucide-react"

interface ImageUploaderProps {
  imageSrc: string | null
  onImageUpload: (imageSrc: string) => void
  onError: (error: string) => void
}

export function ImageUploader({ imageSrc, onImageUpload, onError }: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          onImageUpload(result)
        }
        reader.readAsDataURL(file)
      } else {
        onError("Please upload a valid image file.")
      }
    },
    [onImageUpload, onError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Upload Image</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {isDragActive ? "Drop the image here..." : "Drag 'n' drop an image, or click to select"}
          </p>
        </div>
        {imageSrc && (
          <div className="mt-4 p-2 border rounded-lg">
            <img src={imageSrc} alt="Preview" className="max-h-48 w-auto mx-auto rounded" />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 