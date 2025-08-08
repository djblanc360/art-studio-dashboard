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

// filter data that does not contain the filter value
export function filterData(data: CsvData, key: string, filterValue: string): CsvData {
  const normalizedFilterValue = filterValue.toLowerCase().trim()
  return data.filter((row) => row[key]?.toString().toLowerCase().trim() !== normalizedFilterValue)
}

// concat data - like matchData but also adds specified columns from data2 to matched rows from data1
export function concatData(data1: CsvData, data2: CsvData, key: string, columnsToConcat: string[]): CsvData {
  // Create a map of data2 rows by their key for efficient lookup
  const data2Map = new Map<string, Record<string, any>>()
  
  data2.forEach((row) => {
    const keyValue = row[key]?.toString().toLowerCase().trim()
    if (keyValue) {
      data2Map.set(keyValue, row)
    }
  })
  
  // Filter data1 to only include rows that have matches in data2 (like matchData)
  // AND add the specified columns from data2 to each matched row
  return data1
    .filter((row1) => {
      const keyValue = row1[key]?.toString().toLowerCase().trim()
      return keyValue && data2Map.has(keyValue)
    })
    .map((row1) => {
      const keyValue = row1[key]?.toString().toLowerCase().trim()
      const matchingRow2 = data2Map.get(keyValue)!
      const concatenatedRow = { ...row1 }
      
      // Add specified columns from data2 to the result
      columnsToConcat.forEach((columnName) => {
        const trimmedColumnName = columnName.trim()
        if (trimmedColumnName && matchingRow2[trimmedColumnName] !== undefined) {
          // If column already exists in row1, append with suffix to avoid overwrite
          const finalColumnName = concatenatedRow[trimmedColumnName] !== undefined 
            ? `${trimmedColumnName}_from_file2` 
            : trimmedColumnName
          concatenatedRow[finalColumnName] = matchingRow2[trimmedColumnName]
        }
      })
      
      return concatenatedRow
    })
}