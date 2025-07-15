"use client"

import { useState, useRef, useCallback } from "react"
import { quantize } from "~/lib/quantize"
import type { Rgb } from "~/lib/quantize"
import type { AsciiChar, AsciiOptions, AsciiGeneratorState } from "./types"
import { DEFAULT_CHARS, FULL_CHAR_SET, CHUNK_SIZE, MAX_SAMPLING_DIMENSION, MAX_CANVAS_DIMENSION } from "./constants"

export function useAsciiGenerator() {
  const [state, setState] = useState<AsciiGeneratorState>({
    asciiArt: null,
    isLoading: false,
    progress: 0,
    error: null,
    generatedWithOptions: null,
  })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateAscii = useCallback(
    async (imageSrc: string, options: AsciiOptions, processedSvgChar?: string | null) => {
      if (!imageSrc) {
        setState(prev => ({ ...prev, error: "Please upload an image first." }))
        return
      }
      if (options.charMode === "svg" && !processedSvgChar) {
        setState(prev => ({ ...prev, error: "Please upload an SVG to use as a character." }))
        return
      }

      setState(prev => ({ ...prev, isLoading: true, progress: 0, error: null }))

      // Use setTimeout to prevent blocking the UI
      setTimeout(async () => {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = imageSrc
          
          img.onload = async () => {
            try {
              const canvas = canvasRef.current
              if (!canvas) return
              const ctx = canvas.getContext("2d", { willReadFrequently: true })
              if (!ctx) return

              // Validate dimensions
              const targetWidth = Math.min(options.artWidth, MAX_SAMPLING_DIMENSION)
              const targetHeight = Math.min(options.artHeight, MAX_SAMPLING_DIMENSION)
              const safeCanvasWidth = Math.min(options.canvasWidth, MAX_CANVAS_DIMENSION)
              const safeCanvasHeight = Math.min(options.canvasHeight, MAX_CANVAS_DIMENSION)
              
              canvas.width = safeCanvasWidth
              canvas.height = safeCanvasHeight
              
              // Calculate sampling dimensions
              const aspectRatio = img.height / img.width
              let samplingWidth, samplingHeight
              
              if (options.charMode === "svg") {
                samplingWidth = Math.round(targetWidth * Math.pow(1.2, options.scale - 1))
                samplingHeight = Math.round(targetHeight * Math.pow(1.2, options.scale - 1))
              } else {
                samplingWidth = Math.round(targetWidth * Math.pow(1.3, options.scale - 1))
                samplingHeight = Math.round(samplingWidth * aspectRatio * 0.5)
              }

              console.log(`Processing image at ${samplingWidth}x${samplingHeight} for ${targetWidth}x${targetHeight} ASCII art`)

              // Pre-compute color palette by sampling the entire image at lower resolution
              let colorPalette: Rgb[] = []
              if (options.mode === "color") {
                colorPalette = await computeColorPalette(img, options.maxColors)
              }

              // Process image in chunks
              const art = await processImageInChunks(
                img, 
                samplingWidth, 
                samplingHeight, 
                options, 
                colorPalette,
                (progress) => setState(prev => ({ ...prev, progress }))
              )
              
              // Store both the ASCII art and the options used to generate it
              setState(prev => ({ 
                ...prev, 
                asciiArt: art,
                generatedWithOptions: { ...options } // Store a copy of the options
              }))
              
            } catch (error) {
              console.error("Processing error:", error)
              setState(prev => ({ 
                ...prev, 
                error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                isLoading: false 
              }))
            }
          }
          
          img.onerror = () => {
            setState(prev => ({ 
              ...prev, 
              error: "Could not load the image.", 
              isLoading: false 
            }))
          }
        } catch (e) {
          console.error("Generation error:", e)
          setState(prev => ({ 
            ...prev, 
            error: "An unexpected error occurred during conversion.",
            isLoading: false
          }))
        } finally {
          setTimeout(() => setState(prev => ({ ...prev, isLoading: false })), 200)
        }
      }, 100)
    },
    []
  )

  return {
    ...state,
    generateAscii,
    canvasRef,
  }
}

// Compute color palette from a downsampled version of the image
async function computeColorPalette(img: HTMLImageElement, maxColors: number): Promise<Rgb[]> {
  return new Promise((resolve) => {
    // Create a smaller version for color sampling
    const sampleSize = 500
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) {
      resolve([])
      return
    }
    
    const aspectRatio = img.height / img.width
    const sampleWidth = sampleSize
    const sampleHeight = Math.round(sampleSize * aspectRatio)
    
    tempCanvas.width = sampleWidth
    tempCanvas.height = sampleHeight
    tempCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight)
    
    const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight)
    const data = imageData.data
    const pixels: Rgb[] = []
    
    for (let i = 0; i < data.length; i += 4) {
      pixels.push([data[i], data[i + 1], data[i + 2]])
    }
    
    try {
      const colorMap = quantize(pixels, maxColors)
      resolve(colorMap.palette())
    } catch (error) {
      console.warn("Color quantization failed:", error)
      resolve([])
    }
    
    // Cleanup
    tempCanvas.width = 0
    tempCanvas.height = 0
  })
}

// Process image in manageable chunks to avoid memory issues
async function processImageInChunks(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  options: AsciiOptions,
  colorPalette: Rgb[],
  onProgress: (progress: number) => void
): Promise<AsciiChar[][]> {
  
  const charSet = options.useFullChars
    ? FULL_CHAR_SET
    : options.customChars.length > 0
    ? options.customChars
    : DEFAULT_CHARS

  const findClosestColor = (r: number, g: number, b: number): string => {
    if (options.mode === "mono" || colorPalette.length === 0) return "#FFFFFF"
    let minDistance = Number.POSITIVE_INFINITY
    let closestColor = ""
    for (const color of colorPalette) {
      const dist = Math.sqrt(
        Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2)
      )
      if (dist < minDistance) {
        minDistance = dist
        closestColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      }
    }
    return closestColor
  }

  const art: AsciiChar[][] = []
  const chunkHeight = Math.min(CHUNK_SIZE, targetHeight)
  let sequenceCounter = 0
  
  // Process the image row by row in chunks
  for (let startY = 0; startY < targetHeight; startY += chunkHeight) {
    const endY = Math.min(startY + chunkHeight, targetHeight)
    const currentChunkHeight = endY - startY
    
    // Create a temporary canvas for this chunk
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) continue
    
    tempCanvas.width = targetWidth
    tempCanvas.height = currentChunkHeight
    
    // Draw the portion of the image corresponding to this chunk
    const sourceY = (startY / targetHeight) * img.height
    const sourceHeight = (currentChunkHeight / targetHeight) * img.height
    
    tempCtx.drawImage(
      img,
      0, sourceY, img.width, sourceHeight,  // Source
      0, 0, targetWidth, currentChunkHeight // Destination
    )
    
    const imageData = tempCtx.getImageData(0, 0, targetWidth, currentChunkHeight)
    const data = imageData.data
    
    // Process this chunk
    for (let y = 0; y < currentChunkHeight; y++) {
      const row: AsciiChar[] = []
      for (let x = 0; x < targetWidth; x++) {
        const i = (y * targetWidth + x) * 4
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

        if (brightness * 100 < options.brightnessThreshold) {
          row.push({ char: " ", color: "transparent", brightness: 0 })
        } else {
          let char: string
          if (options.forceCharSequence && !options.useFullChars && options.charMode === "text") {
            char = charSet[sequenceCounter % charSet.length]
            sequenceCounter++
          } else {
            const charIndex = Math.floor(brightness * (charSet.length - 1))
            char = charSet[charSet.length - 1 - charIndex]
          }
          const color = findClosestColor(r, g, b)
          row.push({ char, color, brightness })
        }
      }
      art.push(row)
    }
    
    // Update progress
    const progress = ((startY + currentChunkHeight) / targetHeight) * 100
    onProgress(progress)
    
    // Cleanup chunk canvas
    tempCanvas.width = 0
    tempCanvas.height = 0
    
    // Allow UI to update between chunks
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  
  return art
}