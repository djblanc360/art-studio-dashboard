"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Slider } from "~/components/ui/slider"
import { Switch } from "~/components/ui/switch"
import { Progress } from "~/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { UploadCloud, Palette, Type, Sun, Download, Scaling, Shapes, Droplet, Repeat } from "lucide-react"
import { quantize } from "~/lib/quantize"
import type { Rgb } from "~/lib/quantize"

type AsciiChar = {
  char: string
  color: string
  brightness: number
}

const DEFAULT_CHARS = "@%#*+=-:. "
const FULL_CHAR_SET = ` .'"\^,:;Il!i><~+_-?][}{1)(|/\\tfjrxnuvczYXCJUQL0OZmwqpdbkhao*#MW&8%B@$`
  .split("")
  .reverse()
  .join("")

export default function AsciiConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [options, setOptions] = useState({
    mode: "color" as "color" | "mono",
    charMode: "text" as "text" | "svg",
    customChars: DEFAULT_CHARS,
    background: "black" as "black" | "transparent",
    brightnessThreshold: 5,
    maxColors: 64,
    useFullChars: false,
    scale: 1,
    forceCharSequence: false,
  })
  const [svgChar, setSvgChar] = useState<string | null>(null)
  const [svgCharPreview, setSvgCharPreview] = useState<string | null>(null)
  const [processedSvgChar, setProcessedSvgChar] = useState<string | null>(null)

  const [asciiArt, setAsciiArt] = useState<AsciiChar[][] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string)
        setAsciiArt(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    } else {
      setError("Please upload a valid image file.")
    }
  }, [])

  const onSvgDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const svgContent = e.target?.result as string
        setSvgChar(svgContent)

        const processed = svgContent
          .replace(/fill="[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
        setProcessedSvgChar(processed)

        const blob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        setSvgCharPreview(url)
        setError(null)
      }
      reader.readAsText(file)
    } else {
      setError("Please upload a valid SVG file.")
    }
  }, [])

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({ onDrop: onImageDrop, accept: { "image/*": [] }, multiple: false })
  const {
    getRootProps: getSvgRootProps,
    getInputProps: getSvgInputProps,
    isDragActive: isSvgDragActive,
  } = useDropzone({ onDrop: onSvgDrop, accept: { "image/svg+xml": [".svg"] }, multiple: false })

  const handleOptionChange = (key: keyof typeof options, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const generateAscii = async () => {
    if (!imageSrc) {
      setError("Please upload an image first.")
      return
    }
    if (options.charMode === "svg" && !svgChar) {
      setError("Please upload an SVG to use as a character.")
      return
    }
    setIsLoading(true)
    setProgress(0)
    setError(null)

    setTimeout(() => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageSrc
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) return

          const aspectRatio = img.height / img.width
          const baseWidth = options.charMode === "svg" ? 48 : 120
          const maxWidth = Math.round(baseWidth * Math.pow(1.5, options.scale - 1))
          const width = Math.min(maxWidth, img.width)
          const height = Math.round(width * aspectRatio * (options.charMode === "svg" ? 1 : 0.5))

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          const imageData = ctx.getImageData(0, 0, width, height)
          const data = imageData.data
          const art: AsciiChar[][] = []
          const charSet = options.useFullChars
            ? FULL_CHAR_SET
            : options.customChars.length > 0
              ? options.customChars
              : DEFAULT_CHARS

          let colorPalette: Rgb[] = []
          if (options.mode === "color") {
            const pixels: Rgb[] = []
            for (let i = 0; i < data.length; i += 4) {
              pixels.push([data[i], data[i + 1], data[i + 2]])
            }
            const colorMap = quantize(pixels, options.maxColors)
            colorPalette = colorMap.palette()
          }

          const findClosestColor = (r: number, g: number, b: number): string => {
            if (options.mode === "mono") return "#FFFFFF"
            let minDistance = Number.POSITIVE_INFINITY
            let closestColor = ""
            for (const color of colorPalette) {
              const dist = Math.sqrt(Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2))
              if (dist < minDistance) {
                minDistance = dist
                closestColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
              }
            }
            return closestColor
          }

          let sequenceCounter = 0

          for (let y = 0; y < height; y++) {
            const row: AsciiChar[] = []
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4
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
            setProgress(((y + 1) / height) * 100)
          }
          setAsciiArt(art)
        }
        img.onerror = () => {
          setError("Could not load the image.")
          setIsLoading(false)
        }
      } catch (e) {
        console.error(e)
        setError("An unexpected error occurred during conversion.")
      } finally {
        setTimeout(() => setIsLoading(false), 200)
      }
    }, 100)
  }

  const handleDownload = () => {
    if (!asciiArt) return

    const htmlParts: string[] = []
    const backgroundColor = options.background === "black" ? "#000" : "transparent"
    let styles = ""
    let bodyOpeningTag = "<body>"
    let bodyClosingTag = "</body>"

    if (options.charMode === "svg" && processedSvgChar) {
      const cellSize = 20
      const gridWidth = asciiArt[0].length * cellSize

      styles = `
        body { background-color: ${backgroundColor}; margin: 0; font-family: sans-serif; }
        .grid-container { display: flex; flex-wrap: wrap; width: ${gridWidth}px; }
        .grid-cell { width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center; }
        .svg-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .svg-wrapper svg { width: 100%; height: 100%; }
      `
      bodyOpeningTag = `<body><div class="grid-container">`
      bodyClosingTag = `</div></body>`

      asciiArt.flat().forEach((item) => {
        if (item.char !== " ") {
          htmlParts.push(
            `<div class="grid-cell"><div class="svg-wrapper" style="color: ${item.color}; transform: scale(${item.brightness});">${processedSvgChar}</div></div>`,
          )
        } else {
          htmlParts.push('<div class="grid-cell"></div>')
        }
      })
    } else {
      styles = `
        body { background-color: ${backgroundColor}; margin: 0; }
        pre { font-family: 'Courier New', Courier, monospace; font-size: 10px; line-height: 0.9; letter-spacing: 0; white-space: pre; }
        div { display: block; }
      `
      bodyOpeningTag = `<body><pre>`
      bodyClosingTag = `</pre></body>`

      asciiArt.forEach((row) => {
        htmlParts.push("<div>")
        row.forEach((item) => {
          const escapedChar = { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[item.char] || item.char
          const charToRender = escapedChar === " " ? "&nbsp;" : escapedChar
          htmlParts.push(`<span style="color: ${item.color};">${charToRender}</span>`)
        })
        htmlParts.push("</div>")
      })
    }

    const fullHtml = [
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ASCII Art</title><style>${styles.trim()}</style></head>`,
      bodyOpeningTag,
      ...htmlParts,
      bodyClosingTag,
      `</html>`,
    ]

    const blob = new Blob(fullHtml, { type: "text/html" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "ascii-art.html"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const asciiOutput = useMemo(() => {
    if (!asciiArt) return null

    const bgStyle = {
      backgroundColor: options.background === "black" ? "#000" : "transparent",
    }

    if (options.charMode === "svg" && processedSvgChar) {
      const cellSize = 12
      return (
        <div style={{ ...bgStyle, width: "100%", overflow: "auto" }}>
          <div style={{ width: `${asciiArt[0].length * cellSize}px` }}>
            {asciiArt.map((row, i) => (
              <div key={i} style={{ display: "flex", height: `${cellSize}px` }}>
                {row.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.char !== " " && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          color: item.color,
                          transform: `scale(${item.brightness})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        dangerouslySetInnerHTML={{ __html: processedSvgChar }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <pre className="font-mono text-[10px] leading-tight tracking-tighter w-full overflow-x-auto" style={bgStyle}>
        <code>
          {asciiArt.map((row, i) => (
            <div key={i}>
              {row.map((item, j) => (
                <span key={j} style={{ color: item.color }}>
                  {item.char}
                </span>
              ))}
            </div>
          ))}
        </code>
      </pre>
    )
  }, [asciiArt, options.background, options.charMode, processedSvgChar])

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
          <Card>
            <CardHeader>
              <CardTitle>1. Upload Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getImageRootProps()}
                className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  isImageDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getImageInputProps()} />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {isImageDragActive ? "Drop the image here..." : "Drag 'n' drop an image, or click to select"}
                </p>
              </div>
              {imageSrc && (
                <div className="mt-4 p-2 border rounded-lg">
                  <img src={imageSrc || "/placeholder.svg"} alt="Preview" className="max-h-48 w-auto mx-auto rounded" />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Configure Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type size={16} /> Character Mode
                </Label>
                <RadioGroup
                  value={options.charMode}
                  onValueChange={(v) => handleOptionChange("charMode", v)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="r-text" />
                    <Label htmlFor="r-text">Text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="svg" id="r-svg" />
                    <Label htmlFor="r-svg">SVG</Label>
                  </div>
                </RadioGroup>
              </div>

              {options.charMode === "text" ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="full-chars-switch" className="flex items-center gap-2">
                      <Type size={16} /> Use High Detail Characters
                    </Label>
                    <Switch
                      id="full-chars-switch"
                      checked={options.useFullChars}
                      onCheckedChange={(c) => handleOptionChange("useFullChars", c)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-chars" className="flex items-center gap-2">
                      <Type size={16} /> Custom Character Set
                    </Label>
                    <Input
                      id="custom-chars"
                      value={options.customChars}
                      onChange={(e) => handleOptionChange("customChars", e.target.value)}
                      placeholder="e.g., @#S%?*+;:,."
                      disabled={options.useFullChars}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="force-sequence-switch" className="flex items-center gap-2">
                      <Repeat size={16} /> Force Character Sequence
                    </Label>
                    <Switch
                      id="force-sequence-switch"
                      checked={options.forceCharSequence}
                      onCheckedChange={(c) => handleOptionChange("forceCharSequence", c)}
                      disabled={options.useFullChars || options.customChars.length === 0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Uses custom characters in sequence, ignoring brightness for character shape.
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shapes size={16} /> Upload SVG Character
                  </Label>
                  <div
                    {...getSvgRootProps()}
                    className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      isSvgDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...getSvgInputProps()} />
                    <p className="text-sm text-muted-foreground">
                      {isSvgDragActive ? "Drop SVG here" : "Click or drag to upload SVG"}
                    </p>
                  </div>
                  {svgCharPreview && (
                    <div className="mt-2 p-2 border rounded-lg flex justify-center items-center bg-white">
                      <img src={svgCharPreview || "/placeholder.svg"} alt="SVG Preview" className="h-16 w-16" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette size={16} /> Color Mode
                </Label>
                <RadioGroup
                  value={options.mode}
                  onValueChange={(v) => handleOptionChange("mode", v)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="color" id="r-color" />
                    <Label htmlFor="r-color">Color</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mono" id="r-mono" />
                    <Label htmlFor="r-mono">Monochrome</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="max-colors-slider"
                  className={`flex items-center gap-2 ${options.mode === "mono" ? "text-muted-foreground" : ""}`}
                >
                  <Palette size={16} /> Palette Size: {options.maxColors}
                </Label>
                <Slider
                  id="max-colors-slider"
                  className="cursor-pointer"
                  min={8}
                  max={256}
                  step={8}
                  value={[options.maxColors]}
                  onValueChange={([v]) => handleOptionChange("maxColors", v)}
                  disabled={options.mode === "mono"}
                />
                <p className="text-xs text-muted-foreground">
                  Controls the number of colors in the palette. More colors improve accuracy but can slow down
                  generation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-slider" className="flex items-center gap-2">
                  <Scaling size={16} /> Detail Scale: {options.scale}x
                </Label>
                <Slider
                  id="scale-slider"
                  className="cursor-pointer"
                  min={1}
                  max={6}
                  step={1}
                  value={[options.scale]}
                  onValueChange={([v]) => handleOptionChange("scale", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Increases output resolution. Higher values take longer to process and may be memory intensive.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brightness-threshold" className="flex items-center gap-2">
                  <Sun size={16} /> Background Threshold: {options.brightnessThreshold}%
                </Label>
                <Slider
                  id="brightness-threshold"
                  className="cursor-pointer"
                  min={0}
                  max={50}
                  step={1}
                  value={[options.brightnessThreshold]}
                  onValueChange={([v]) => handleOptionChange("brightnessThreshold", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="background-switch" className="flex items-center gap-2">
                  <Droplet size={16} /> Transparent Background
                </Label>
                <Switch
                  id="background-switch"
                  checked={options.background === "transparent"}
                  onCheckedChange={(c) => handleOptionChange("background", c ? "transparent" : "black")}
                />
              </div>
            </CardContent>
          </Card>
          <Button onClick={generateAscii} disabled={isLoading || !imageSrc} className="w-full">
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!asciiArt || isLoading}
                  aria-label="Download art"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full p-4 bg-muted/50 rounded-lg min-h-[400px] flex items-center justify-center">
                {asciiArt ? (
                  asciiOutput
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
