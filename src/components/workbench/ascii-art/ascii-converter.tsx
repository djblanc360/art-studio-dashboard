"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ImageUploader } from "./image-uploader"
import { ConfigurationPanel } from "./configuration-panel"
import { AsciiDisplay } from "./ascii-display"
import { DownloadManager } from "./download-manager"
import { useAsciiGenerator } from "./use-ascii-generator"
import type { AsciiOptions, SvgCharState } from "./types"
import { DEFAULT_OPTIONS } from "./constants"

export default function AsciiConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [options, setOptions] = useState<AsciiOptions>(DEFAULT_OPTIONS)
  const [svgState, setSvgState] = useState<SvgCharState>({
    svgChar: null,
    svgCharPreview: null,
    processedSvgChar: null,
  })

  const { asciiArt, isLoading, progress, error, generateAscii, canvasRef, generatedWithOptions } = useAsciiGenerator()

  const handleOptionChange = (key: keyof AsciiOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = (newImageSrc: string) => {
    setImageSrc(newImageSrc)
    // Reset previous results when new image is uploaded
    // The hook handles clearing error internally
  }

  const handleSvgUpload = (newSvgState: Partial<SvgCharState>) => {
    setSvgState((prev) => ({ ...prev, ...newSvgState }))
  }

  const handleError = (errorMessage: string) => {
    // Error is handled by the generator hook, but we could add additional error handling here
    console.error(errorMessage)
  }

  const handleGenerate = () => {
    generateAscii(imageSrc!, options, svgState.processedSvgChar)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">ASCII Shawnify</h1>
        <p className="text-muted-foreground mt-2">
          Transform images into ASCII art with advanced color and character controls.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ImageUploader
            imageSrc={imageSrc}
            onImageUpload={handleImageUpload}
            onError={handleError}
          />
          
          <ConfigurationPanel
            options={options}
            svgState={svgState}
            onOptionChange={handleOptionChange}
            onSvgUpload={handleSvgUpload}
            onError={handleError}
          />
          
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !imageSrc}
            className="w-full"
          >
            {isLoading ? "Generating..." : "3. Generate Art"}
          </Button>
          
          {isLoading && <Progress value={progress} className="w-full mt-2" />}
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Result</CardTitle>
                </div>
                <DownloadManager
                  asciiArt={asciiArt}
                  options={generatedWithOptions || options}
                  processedSvgChar={svgState.processedSvgChar}
                  isLoading={isLoading}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full p-4 bg-muted/50 rounded-lg min-h-[400px] flex items-center justify-center">
                {asciiArt && generatedWithOptions ? (
                  <AsciiDisplay
                    asciiArt={asciiArt}
                    options={generatedWithOptions}
                    processedSvgChar={svgState.processedSvgChar}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Generated art will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
