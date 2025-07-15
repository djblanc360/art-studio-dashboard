"use client"

import type { AsciiChar, AsciiOptions } from "./types"

interface AsciiDisplayProps {
  asciiArt: AsciiChar[][] | null
  options: AsciiOptions
  processedSvgChar?: string | null
}

export function AsciiDisplay({ asciiArt, options, processedSvgChar }: AsciiDisplayProps) {
  if (!asciiArt) return null

  const bgStyle = {
    backgroundColor: options.background === "black" ? "#000" : "transparent",
  }

  if (options.charMode === "svg" && processedSvgChar) {
    // Use fontSize as the base cell size for SVG mode
    const cellSize = options.fontSize
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
                    marginRight: `${options.characterSpacing}px`,
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

  // Text mode with configurable font settings
  const textStyle = {
    fontFamily: options.fontFamily,
    fontSize: `${options.fontSize}px`,
    lineHeight: `${options.lineHeight}px`,
    fontWeight: options.fontWeight,
    letterSpacing: `${options.characterSpacing}px`,
    whiteSpace: "pre" as const,
    margin: 0,
    padding: 0,
    overflow: "auto",
    width: "100%",
    ...bgStyle,
  }

  return (
    <div style={textStyle}>
      <code style={{ fontFamily: "inherit" }}>
        {asciiArt.map((row, i) => (
          <div key={i} style={{ margin: 0, padding: 0 }}>
            {row.map((item, j) => (
              <span key={j} style={{ color: item.color }}>
                {item.char}
              </span>
            ))}
          </div>
        ))}
      </code>
    </div>
  )
}