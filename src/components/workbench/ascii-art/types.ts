export type AsciiChar = {
  char: string
  color: string
  brightness: number
}

export type AsciiOptions = {
  mode: "color" | "mono"
  charMode: "text" | "svg"
  customChars: string
  background: "black" | "transparent"
  brightnessThreshold: number
  maxColors: number
  useFullChars: boolean
  scale: number
  forceCharSequence: boolean
  // New properties
  artWidth: number
  artHeight: number
  canvasWidth: number
  canvasHeight: number
  dynamicCanvasSize: boolean
  fontSize: number
  fontFamily: string
  lineHeight: number
  fontWeight: number
  characterSpacing: number
}

export type AsciiGeneratorState = {
  asciiArt: AsciiChar[][] | null
  isLoading: boolean
  progress: number
  error: string | null
  // Store the options that were used to generate the current ASCII art
  generatedWithOptions: AsciiOptions | null
}

export type SvgCharState = {
  svgChar: string | null
  svgCharPreview: string | null
  processedSvgChar: string | null
} 