"use client"

import { Button } from "~/components/ui/button"
import { Download } from "lucide-react"
import type { AsciiChar, AsciiOptions } from "./types"

interface DownloadManagerProps {
  asciiArt: AsciiChar[][] | null
  options: AsciiOptions
  processedSvgChar?: string | null
  isLoading: boolean
}

export function DownloadManager({ asciiArt, options, processedSvgChar, isLoading }: DownloadManagerProps) {
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
            `<div class="grid-cell"><div class="svg-wrapper" style="color: ${item.color}; transform: scale(${item.brightness});">${processedSvgChar}</div></div>`
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

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleDownload}
      disabled={!asciiArt || isLoading}
      aria-label="Download art"
    >
      <Download className="h-4 w-4" />
    </Button>
  )
} 