"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Slider } from "~/components/ui/slider"
import { Switch } from "~/components/ui/switch"
import { Type, Palette, Scaling, Sun, Droplet, Repeat, Square, Type as Font } from "lucide-react"
import { SvgUploader } from "./svg-uploader"
import type { AsciiOptions, SvgCharState } from "./types"

interface ConfigurationPanelProps {
  options: AsciiOptions
  svgState: SvgCharState
  onOptionChange: (key: keyof AsciiOptions, value: any) => void
  onSvgUpload: (svgState: Partial<SvgCharState>) => void
  onError: (error: string) => void
}

export function ConfigurationPanel({
  options,
  svgState,
  onOptionChange,
  onSvgUpload,
  onError,
}: ConfigurationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Configure Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Character Mode */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type size={16} /> Character Mode
          </Label>
          <RadioGroup
            value={options.charMode}
            onValueChange={(v) => onOptionChange("charMode", v)}
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

        {/* Character Set Controls */}
        {options.charMode === "text" ? (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="full-chars-switch" className="flex items-center gap-2">
                <Type size={16} /> Use High Detail Characters
              </Label>
              <Switch
                id="full-chars-switch"
                checked={options.useFullChars}
                onCheckedChange={(c) => onOptionChange("useFullChars", c)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-chars" className="flex items-center gap-2">
                <Type size={16} /> Custom Character Set
              </Label>
              <Input
                id="custom-chars"
                value={options.customChars}
                onChange={(e) => onOptionChange("customChars", e.target.value)}
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
                onCheckedChange={(c) => onOptionChange("forceCharSequence", c)}
                disabled={options.useFullChars || options.customChars.length === 0}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Uses custom characters in sequence, ignoring brightness for character shape.
            </p>
          </>
        ) : (
          <SvgUploader svgState={svgState} onSvgUpload={onSvgUpload} onError={onError} />
        )}

        {/* Color Mode */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette size={16} /> Color Mode
          </Label>
          <RadioGroup
            value={options.mode}
            onValueChange={(v) => onOptionChange("mode", v)}
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

        {/* Art Size */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Square size={16} /> Art Size (in characters)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="art-width" className="text-xs">Width (up to 1,000)</Label>
              <Input
                id="art-width"
                type="number"
                placeholder="width"
                min="1"
                max="10000"
                value={options.artWidth}
                onChange={(e) => {
                  const value = Math.min(Math.max(parseInt(e.target.value) || 120, 1), 10000)
                  onOptionChange("artWidth", value)
                }}
              />
            </div>
            <div>
              <Label htmlFor="art-height" className="text-xs">Height (up to 1,000)</Label>
              <Input
                id="art-height"
                type="number"
                placeholder="height"
                min="1"
                max="10000"
                value={options.artHeight}
                onChange={(e) => {
                  const value = Math.min(Math.max(parseInt(e.target.value) || 60, 1), 10000)
                  onOptionChange("artHeight", value)
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Large dimensions (500x700+) will take longer to process but should work.
          </p>
        </div>

        {/* Canvas Size */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Square size={16} /> Canvas Size (in pixels)
          </Label>
          
          {/* Dynamic Canvas Size Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="dynamic-canvas-switch" className="flex items-center gap-2 text-sm">
              <Scaling size={16} /> Dynamic Canvas Scaling
            </Label>
            <Switch
              id="dynamic-canvas-switch"
              checked={options.dynamicCanvasSize}
              onCheckedChange={(c) => {
                onOptionChange("dynamicCanvasSize", c)
                if (c) {
                  // Auto-calculate canvas size when enabling dynamic scaling
                  const scaleFactor = 6 // 6 pixels per character for good quality
                  const calculatedWidth = Math.min(options.artWidth * scaleFactor, 5000)
                  const calculatedHeight = Math.min(options.artHeight * scaleFactor, 5000)
                  onOptionChange("canvasWidth", calculatedWidth)
                  onOptionChange("canvasHeight", calculatedHeight)
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Automatically calculates canvas size based on art dimensions (6px per character).
          </p>

          {/* Manual Canvas Size Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="canvas-width" className={`text-xs ${options.dynamicCanvasSize ? "text-muted-foreground" : ""}`}>
                Width (up to 5,000)
                {options.dynamicCanvasSize && " (auto)"}
              </Label>
              <Input
                id="canvas-width"
                type="number"
                placeholder="width"
                min="100"
                max="5000"
                value={options.canvasWidth}
                onChange={(e) => {
                  const value = Math.min(Math.max(parseInt(e.target.value) || 800, 100), 5000)
                  onOptionChange("canvasWidth", value)
                }}
                disabled={options.dynamicCanvasSize}
              />
            </div>
            <div>
              <Label htmlFor="canvas-height" className={`text-xs ${options.dynamicCanvasSize ? "text-muted-foreground" : ""}`}>
                Height (up to 5,000)
                {options.dynamicCanvasSize && " (auto)"}
              </Label>
              <Input
                id="canvas-height"
                type="number"
                placeholder="height"
                min="100"
                max="5000"
                value={options.canvasHeight}
                onChange={(e) => {
                  const value = Math.min(Math.max(parseInt(e.target.value) || 600, 100), 5000)
                  onOptionChange("canvasHeight", value)
                }}
                disabled={options.dynamicCanvasSize}
              />
            </div>
          </div>
        </div>

        {/* Palette Size */}
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
            onValueChange={([v]) => onOptionChange("maxColors", v)}
            disabled={options.mode === "mono"}
          />
          <p className="text-xs text-muted-foreground">
            Controls the number of colors in the palette. More colors improve accuracy but can slow down
            generation.
          </p>
        </div>

        {/* Detail Scale */}
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
            onValueChange={([v]) => onOptionChange("scale", v)}
          />
          <p className="text-xs text-muted-foreground">
            Increases output resolution. Higher values take longer to process and may be memory intensive.
          </p>
        </div>

        {/* Font Configuration */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 font-medium">
            <Font size={16} /> Font Configuration
          </Label>
          
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size-slider" className="text-sm">
              Font Size: {options.fontSize}px
            </Label>
            <Slider
              id="font-size-slider"
              className="cursor-pointer"
              min={6}
              max={32}
              step={1}
              value={[options.fontSize]}
              onValueChange={([v]) => onOptionChange("fontSize", v)}
            />
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-sm">Font Family</Label>
            <Input
              id="font-family"
              value={options.fontFamily}
              onChange={(e) => onOptionChange("fontFamily", e.target.value)}
              placeholder="e.g., monospace, Courier, Monaco"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label htmlFor="line-height-slider" className="text-sm">
              Line Height: {options.lineHeight}px
            </Label>
            <Slider
              id="line-height-slider"
              className="cursor-pointer"
              min={8}
              max={32}
              step={1}
              value={[options.lineHeight]}
              onValueChange={([v]) => onOptionChange("lineHeight", v)}
            />
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label htmlFor="font-weight-slider" className="text-sm">
              Font Weight: {options.fontWeight}
            </Label>
            <Slider
              id="font-weight-slider"
              className="cursor-pointer"
              min={100}
              max={900}
              step={100}
              value={[options.fontWeight]}
              onValueChange={([v]) => onOptionChange("fontWeight", v)}
            />
          </div>

          {/* Character Spacing */}
          <div className="space-y-2">
            <Label htmlFor="char-spacing-slider" className="text-sm">
              Character Spacing: {options.characterSpacing}px
            </Label>
            <Slider
              id="char-spacing-slider"
              className="cursor-pointer"
              min={-2}
              max={10}
              step={0.5}
              value={[options.characterSpacing]}
              onValueChange={([v]) => onOptionChange("characterSpacing", v)}
            />
          </div>
        </div>

        {/* Background Threshold */}
        <div className="space-y-2">
          <Label htmlFor="brightness-threshold" className="flex items-center gap-2">
            <Sun size={16} /> Background Threshold: {options.brightnessThreshold}%
          </Label>
          <Slider
            id="brightness-threshold"
            className="cursor-pointer"
            min={0}
            max={50}
            step={0.5}
            value={[options.brightnessThreshold]}
            onValueChange={([v]) => onOptionChange("brightnessThreshold", v)}
          />
        </div>

        {/* Transparent Background */}
        <div className="flex items-center justify-between">
          <Label htmlFor="background-switch" className="flex items-center gap-2">
            <Droplet size={16} /> Transparent Background
          </Label>
          <Switch
            id="background-switch"
            checked={options.background === "transparent"}
            onCheckedChange={(c) => onOptionChange("background", c ? "transparent" : "black")}
          />
        </div>
      </CardContent>
    </Card>
  )
} 