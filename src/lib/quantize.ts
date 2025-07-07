// This is a TypeScript implementation of the Leptonica Modified Median Cut Quantizer.
// The original JavaScript version can be found at https://github.com/olivierlesnicki/quantize
// This library is used for color palette generation.

const SIGBITS = 5
const RSHIFT = 8 - SIGBITS
const MULT = 1 << RSHIFT
const HISTOSIZE = 1 << (3 * SIGBITS)
const VBOX_LENGTH = 1 << SIGBITS
const FRACT_BY_POPULATION = 0.75

function getColorIndex(r: number, g: number, b: number): number {
  return (r << (2 * SIGBITS)) + (g << SIGBITS) + b
}

export type Rgb = [number, number, number]

class VBox {
  r1: number
  r2: number
  g1: number
  g2: number
  b1: number
  b2: number
  histo: number[]
  _avg: Rgb | null = null
  _volume: number | null = null
  _count: number | null = null

  constructor(r1: number, r2: number, g1: number, g2: number, b1: number, b2: number, histo: number[]) {
    this.r1 = r1
    this.r2 = r2
    this.g1 = g1
    this.g2 = g2
    this.b1 = b1
    this.b2 = b2
    this.histo = histo
  }

  volume(force = false): number {
    if (!this._volume || force) {
      this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1)
    }
    return this._volume
  }

  count(force = false): number {
    if (!this._count || force) {
      let npix = 0
      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const index = getColorIndex(i, j, k)
            npix += this.histo[index] || 0
          }
        }
      }
      this._count = npix
    }
    return this._count
  }

  copy(): VBox {
    return new VBox(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo)
  }

  avg(force = false): Rgb {
    if (!this._avg || force) {
      let ntot = 0
      let rsum = 0
      let gsum = 0
      let bsum = 0
      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const index = getColorIndex(i, j, k)
            const hval = this.histo[index] || 0
            ntot += hval
            rsum += hval * (i + 0.5) * MULT
            gsum += hval * (j + 0.5) * MULT
            bsum += hval * (k + 0.5) * MULT
          }
        }
      }
      if (ntot) {
        this._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)]
      } else {
        this._avg = [
          ~~((MULT * (this.r1 + this.r2 + 1)) / 2),
          ~~((MULT * (this.g1 + this.g2 + 1)) / 2),
          ~~((MULT * (this.b1 + this.b2 + 1)) / 2),
        ]
      }
    }
    return this._avg
  }

  contains(pixel: Rgb): boolean {
    const rval = pixel[0] >> RSHIFT
    const gval = pixel[1] >> RSHIFT
    const bval = pixel[2] >> RSHIFT
    return (
      rval >= this.r1 && rval <= this.r2 && gval >= this.g1 && gval <= this.g2 && bval >= this.b1 && bval <= this.b2
    )
  }
}

class CMap {
  private vboxes: VBox[]

  constructor() {
    this.vboxes = []
  }

  push(vbox: VBox) {
    this.vboxes.push(vbox)
  }

  palette(): Rgb[] {
    return this.vboxes.map((vbox) => vbox.avg())
  }

  size(): number {
    return this.vboxes.length
  }

  map(color: Rgb): Rgb {
    for (let i = 0; i < this.vboxes.length; i++) {
      if (this.vboxes[i].contains(color)) {
        return this.vboxes[i].avg()
      }
    }
    return this.nearest(color)
  }

  nearest(color: Rgb): Rgb {
    let d1 = Number.POSITIVE_INFINITY
    let pColor: Rgb = [0, 0, 0]
    for (let i = 0; i < this.vboxes.length; i++) {
      const vbColor = this.vboxes[i].avg()
      const d2 = Math.sqrt(
        Math.pow(color[0] - vbColor[0], 2) + Math.pow(color[1] - vbColor[1], 2) + Math.pow(color[2] - vbColor[2], 2),
      )
      if (d2 < d1) {
        d1 = d2
        pColor = vbColor
      }
    }
    return pColor
  }
}

function medianCut(histo: number[], vbox: VBox): [VBox, VBox] | undefined {
  if (!vbox.count()) return

  const rw = vbox.r2 - vbox.r1 + 1
  const gw = vbox.g2 - vbox.g1 + 1
  const bw = vbox.b2 - vbox.b1 + 1
  const maxw = Math.max(rw, gw, bw)

  if (vbox.count() === 1) {
    return [vbox.copy(), undefined as any]
  }

  let total = 0
  const partialsum: number[] = []
  const lookaheadsum: number[] = []
  let d2Var

  if (maxw === rw) {
    for (let i = vbox.r1; i <= vbox.r2; i++) {
      let sum = 0
      for (let j = vbox.g1; j <= vbox.g2; j++) {
        for (let k = vbox.b1; k <= vbox.b2; k++) {
          const index = getColorIndex(i, j, k)
          sum += histo[index] || 0
        }
      }
      total += sum
      partialsum[i] = total
    }
  } else if (maxw === gw) {
    for (let i = vbox.g1; i <= vbox.g2; i++) {
      let sum = 0
      for (let j = vbox.r1; j <= vbox.r2; j++) {
        for (let k = vbox.b1; k <= vbox.b2; k++) {
          const index = getColorIndex(j, i, k)
          sum += histo[index] || 0
        }
      }
      total += sum
      partialsum[i] = total
    }
  } else {
    for (let i = vbox.b1; i <= vbox.b2; i++) {
      let sum = 0
      for (let j = vbox.r1; j <= vbox.r2; j++) {
        for (let k = vbox.g1; k <= vbox.g2; k++) {
          const index = getColorIndex(j, k, i)
          sum += histo[index] || 0
        }
      }
      total += sum
      partialsum[i] = total
    }
  }

  partialsum.forEach((d, i) => {
    lookaheadsum[i] = total - d
  })

  function doCut(color: "r" | "g" | "b"): [VBox, VBox] | undefined {
    const dim1 = color + "1"
    const dim2 = color + "2"
    const d1 = vbox[dim1 as keyof VBox] as number
    const d2 = vbox[dim2 as keyof VBox] as number
    for (let i = d1; i <= d2; i++) {
      if (partialsum[i] > total / 2) {
        const vbox1 = vbox.copy()
        const vbox2 = vbox.copy()
        const left = i - d1
        const right = d2 - i
        if (left <= right) {
          d2Var = Math.min(d2 - 1, ~~(i + right / 2))
        } else {
          d2Var = Math.max(d1, ~~(i - 1 - left / 2))
        }
        while (!partialsum[d2Var]) d2Var++
        let count2 = lookaheadsum[d2Var]
        while (!count2 && partialsum[d2Var - 1]) count2 = lookaheadsum[--d2Var]
        vbox1[dim2 as "r2" | "g2" | "b2"] = d2Var
        vbox2[dim1 as "r1" | "g1" | "b1"] = d2Var + 1
        return [vbox1, vbox2]
      }
    }
  }

  if (maxw === rw) return doCut("r")
  if (maxw === gw) return doCut("g")
  if (maxw === bw) return doCut("b")
}

export function quantize(pixels: Rgb[], maxcolors: number): CMap {
  if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
    throw new Error("Wrong parameters")
  }

  const histo = new Array(HISTOSIZE).fill(0)
  let rmin = 1000000,
    rmax = 0,
    gmin = 1000000,
    gmax = 0,
    bmin = 1000000,
    bmax = 0

  pixels.forEach((pixel) => {
    const rval = pixel[0] >> RSHIFT
    const gval = pixel[1] >> RSHIFT
    const bval = pixel[2] >> RSHIFT
    rmin = Math.min(rmin, rval)
    rmax = Math.max(rmax, rval)
    gmin = Math.min(gmin, gval)
    gmax = Math.max(gmax, gval)
    bmin = Math.min(bmin, bval)
    bmax = Math.max(bmax, bval)
    const index = getColorIndex(rval, gval, bval)
    histo[index]++
  })

  const vbox = new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo)
  const pq = [vbox]

  function splitBoxes(pq: VBox[], target: number) {
    let niters = 0
    while (niters < 1000) {
      const vbox = pq.shift()
      if (!vbox || !vbox.count()) {
        pq.push(vbox!)
        niters++
        continue
      }
      const vboxes = medianCut(histo, vbox)
      if (!vboxes) {
        console.error("vboxes is undefined")
        return
      }
      pq.push(vboxes[0])
      if (vboxes[1]) {
        pq.push(vboxes[1])
        pq.sort((a, b) => a.count() * a.volume() - b.count() * b.volume())
      }
      if (pq.length >= target) return
      niters++
    }
  }

  splitBoxes(pq, FRACT_BY_POPULATION * maxcolors)

  const pq2 = [...pq]
  pq.forEach((vbox) => {
    if (vbox.count()) {
      pq2.push(vbox)
    }
  })
  pq2.sort((a, b) => a.count() - b.count())

  splitBoxes(pq2, maxcolors - pq2.length)

  const cmap = new CMap()
  pq2.forEach((vbox) => cmap.push(vbox))
  return cmap
}
