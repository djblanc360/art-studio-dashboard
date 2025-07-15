export const DEFAULT_CHARS = "@%#*+=-:. "

export const FULL_CHAR_SET = ` .'"\^,:;Il!i><~+_-?][}{1)(|/\\tfjrxnuvczYXCJUQL0OZmwqpdbkhao*#MW&8%B@$`
  .split("")
  .reverse()
  .join("")

// Processing constants for large images
export const CHUNK_SIZE = 1000 // Process in chunks of 1000x1000 pixels max
export const MAX_SAMPLING_DIMENSION = 10000 // Allow up to 10K in each dimension
export const MAX_CANVAS_DIMENSION = 5000 // Allow up to 5K canvas size

export const DEFAULT_OPTIONS = {
  mode: "color" as const,
  charMode: "text" as const,
  customChars: DEFAULT_CHARS,
  background: "black" as const,
  brightnessThreshold: 5,
  maxColors: 64,
  useFullChars: false,
  scale: 1,
  forceCharSequence: false,
  // Support larger default values
  artWidth: 120,
  artHeight: 60,
  canvasWidth: 800,
  canvasHeight: 600,
  dynamicCanvasSize: false,
  fontSize: 12,
  fontFamily: "monospace",
  lineHeight: 14,
  fontWeight: 400,
  characterSpacing: 0,
} 