type CsvData = Record<string, any>[]

export function combineData(data1: CsvData, data2: CsvData, key: string): CsvData {
  const seenKeys = new Set<string>()
  const combined: CsvData = []

  const processRow = (row: Record<string, any>) => {
    const value = row[key]?.toString().toLowerCase().trim()
    if (value && !seenKeys.has(value)) {
      seenKeys.add(value)
      combined.push(row)
    }
  }

  data1.forEach(processRow)
  data2.forEach(processRow)

  return combined
}

export function diffData(data1: CsvData, data2: CsvData, key: string): CsvData {
  const keySet2 = new Set(data2.map((row) => row[key]?.toString().toLowerCase().trim()).filter(Boolean))
  return data1.filter((row) => !keySet2.has(row[key]?.toString().toLowerCase().trim()))
}

export function matchData(data1: CsvData, data2: CsvData, key: string): CsvData {
  const keySet2 = new Set(data2.map((row) => row[key]?.toString().toLowerCase().trim()).filter(Boolean))
  return data1.filter((row) => {
    const value = row[key]?.toString().toLowerCase().trim()
    return value && keySet2.has(value)
  })
}
