import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import type { 
  CollectorSubmission, 
  CollectorWithWealth, 
  ProcessingResults,
  WealthReport,
  CSVExportOptions,
  FilterOptions,
  CsvData,
  DetailedFilterStats
} from './types';
import { filterCollectors, getFilteringStats, filterCollectorsWithDetails } from './filter';

/**
 * Generate wealth distribution report
 */
export function generateWealthReport(collectors: CollectorWithWealth[]): WealthReport {
  const total = collectors.length;
//   const rich = collectors.filter(c => c.wealthCategory === 'Rich').length;
//   const high = collectors.filter(c => c.wealthCategory === 'High').length;
//   const mid = collectors.filter(c => c.wealthCategory === 'Mid').length;
//   const poor = collectors.filter(c => c.wealthCategory === 'Poor').length;
  
  const avgWealthScore = total > 0 
    ? collectors.reduce((sum, c) => sum + c.wealthScore, 0) / total 
    : 0;
  
  const topTierCount = collectors.filter(c => c.wealthScore >= 1500000).length; // 1.5M threshold
  const topTierPercentage = total > 0 
    ? ((topTierCount / total) * 100).toFixed(1) 
    : '0.0';

  return {
    totalCollectors: total,
    // rich,
    // high,
    // mid,
    // poor,
    avgWealthScore,
    topTierPercentage,
  };
}

/**
 * Get collectors by wealth categories
 */
// export function getCollectorsByCategories(
//   collectors: CollectorWithWealth[],
//   categories: WealthCategory[],
//   limit?: number
// ): CollectorWithWealth[] {
//   const filtered = collectors.filter(collector => 
//     categories.includes(collector.wealthCategory)
//   );
  
//   return limit ? filtered.slice(0, limit) : filtered;
// }

/**
 * Convert enriched collector data to CSV format using Papaparse
 */
export function convertToCSV(
  collectors: CollectorWithWealth[],
  options: CSVExportOptions = {}
): string {
  const {
    includeInternalFields = false,
    customHeaders = {},
    sortBy = 'wealthScore',
    sortOrder = 'desc'
  } = options;

  // Sort collectors
  const sortedCollectors = [...collectors].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortOrder === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
  });

  // Prepare data for Papaparse
  const csvData = sortedCollectors.map(collector => {
    const baseData = {
      'Email': collector.email,
      'First Name': collector.firstName,
      'Last Name': collector.lastName,
      'Delivery Address': collector.deliveryAddress,
      'City': collector.city,
      'State': collector.state,
      'Country': collector.country,
      'Launch': collector.launch,
      'Postcode': collector.postcode,
      'Product': collector.product,
      'Cohort': collector.cohort,
      'User Type': collector.userType,
      'Marketing Consent': collector.marketingConsent,
      'Winner': collector.winner,
      'Property Value': collector.wealthScore
    };

    if (includeInternalFields) {
      return {
        ...baseData,
        'Property Type': collector.propertyType,
        'Raw Value': collector.rawValue,
        'Estimation Method': collector.estimationMethod,
      };
    }

    return baseData;
  });

  // Apply custom header names if provided
  if (Object.keys(customHeaders).length > 0) {
    csvData.forEach(row => {
      Object.keys(customHeaders).forEach(oldHeader => {
        if ((row as any)[oldHeader] !== undefined) {
          (row as any)[customHeaders[oldHeader]] = (row as any)[oldHeader];
          delete (row as any)[oldHeader];
        }
      });
    });
  }

  // Use Papa.unparse to generate CSV
  const csv = Papa.unparse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  return csv;
}

/**
 * Parse CSV text into collector submissions using Papaparse
 */
export function parseCSV(csvText: string): Promise<CollectorSubmission[]> {
  return new Promise((resolve, reject) => {
    // Check if it's likely a single-column CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    const sampleLines = lines.slice(0, 5);
    
    // Check if any delimiter is present in the first few lines
    const commonDelimiters = [',', '\t', '|', ';'];
    const hasDelimiter = sampleLines.some(line => 
      commonDelimiters.some(delimiter => line.includes(delimiter))
    );
    
    console.group(`🔍 CSV Analysis: Collector Data`);
    console.log(`Total lines: ${lines.length}`);
    console.log(`Sample lines:`, sampleLines);
    console.log(`Has common delimiters: ${hasDelimiter}`);
    console.log(`Likely single-column: ${!hasDelimiter}`);
    console.groupEnd();

    const parseConfig = {
      header: true,
      skipEmptyLines: true,
      delimiter: hasDelimiter ? "" : ",", // Use comma as default for single-column
      complete: (results: ParseResult<Record<string, any>>) => {
        console.group(`🎯 Parse Results: Collector Data`);
        console.log(`Total rows: ${results.data.length}`);
        console.log(`Total errors: ${results.errors.length}`);
        console.log(`Headers detected:`, results.meta?.fields || 'None');
        console.log(`Delimiter used: "${results.meta?.delimiter || 'unknown'}"`);

        // Validate expected columns exist
        const headers = results.meta?.fields || [];
        const requiredColumns = [
          'Email', 'First Name', 'Last Name', 'Delivery Address', 
          'City', 'State', 'Country'
        ];

        const missingColumns = requiredColumns.filter(col => 
          !headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          console.error(`❌ Missing required columns: ${missingColumns.join(', ')}`);
          console.groupEnd();
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        // Handle parsing errors
        if (results.errors.length > 0) {
          console.group(`🚨 Parsing Errors`);
          console.log(`Total errors: ${results.errors.length}`);
          
          // Special handling for single-column delimiter detection errors
          const delimiterErrors = results.errors.filter(e => 
            e.code === 'UndetectableDelimiter' || e.type === 'Delimiter'
          );
          
          if (delimiterErrors.length > 0 && !hasDelimiter) {
            console.log(`🔧 Delimiter detection failed for single-column file - retrying with comma`);
            
            // Retry with explicit comma delimiter
            Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              delimiter: ",",
              complete: (retryResults: ParseResult<Record<string, any>>) => {
                console.log(`🔄 Retry results: ${retryResults.data.length} rows, ${retryResults.errors.length} errors`);
                console.groupEnd();
                console.groupEnd();
                
                if (retryResults.data.length > 0) {
                  const collectors = mapToCollectorSubmissions(retryResults.data);
                  resolve(collectors);
                } else {
                  reject(new Error("Unable to parse CSV file. Please check the file format."));
                }
              },
              error: (error: Error) => {
                console.groupEnd();
                console.groupEnd();
                reject(new Error(`CSV parsing failed: ${error.message}`));
              }
            });
            return;
          }
          
          // Log detailed error information
          results.errors.forEach((error, index) => {
            console.group(`Error ${index + 1}:`);
            console.log(`Type: ${error.type || 'Unknown'}`);
            console.log(`Code: ${error.code || 'N/A'}`);
            console.log(`Message: ${error.message || 'No message'}`);
            console.log(`Row: ${error.row !== undefined ? error.row + 1 : 'N/A'} (1-indexed)`);
            console.groupEnd();
          });
          
          console.groupEnd();
          
          // Check for critical errors
          const criticalErrors = results.errors.filter(e => 
            e.type === 'Quotes' || e.type === 'Delimiter' || e.type === 'FieldMismatch'
          );
          
          if (criticalErrors.length > 0) {
            const firstError = criticalErrors[0];
            const lineNumber = firstError.row !== undefined ? firstError.row + 1 : 'unknown';
            console.groupEnd();
            reject(new Error(`CSV parsing error on line ${lineNumber}: ${firstError.message}`));
            return;
          }
        }

        // Process data if available
        if (results.data.length > 0) {
          console.log(`✅ Successfully processed ${results.data.length} rows`);
          console.groupEnd();
          
          try {
            const collectors = mapToCollectorSubmissions(results.data);
            resolve(collectors);
          } catch (error) {
            reject(new Error(`Data mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        } else {
          console.groupEnd();
          reject(new Error("No data found in CSV file."));
        }
      },
      error: (error: Error) => {
        console.error('🚨 CSV parsing error:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    };

    Papa.parse(csvText, parseConfig);
  });
}

/**
 * Map raw CSV data to CollectorSubmission objects
 */
function mapToCollectorSubmissions(data: CsvData): CollectorSubmission[] {
  return data.map((row, index) => {
    try {
      // Handle different possible column name variations
      const getValue = (possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      return {
        email: getValue(['Email', 'email', 'Email Address']),
        firstName: getValue(['First Name', 'firstName', 'first_name', 'FirstName']),
        lastName: getValue(['Last Name', 'lastName', 'last_name', 'LastName']),
        deliveryAddress: getValue(['Delivery Address', 'deliveryAddress', 'Address', 'address']),
        city: getValue(['City', 'city']),
        state: getValue(['State', 'state', 'Province']),
        country: getValue(['Country', 'country']),
        launch: getValue(['Launch', 'launch']),
        postcode: getValue(['Postcode', 'postcode', 'Postal Code', 'ZIP', 'zip']),
        product: getValue(['Product', 'product']),
        cohort: getValue(['Cohort', 'cohort']),
        userType: getValue(['User Type', 'userType', 'user_type', 'UserType']),
        marketingConsent: getValue(['Marketing Consent', 'marketingConsent', 'marketing_consent']),
        winner: getValue(['Winner', 'winner']),
      };
    } catch (error) {
      throw new Error(`Error mapping row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Parse CSV file using Papaparse
 */
export function parseCSVFile(file: File): Promise<CollectorSubmission[]> {
  return new Promise((resolve, reject) => {
    // Read file content first to check for single-column
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      
      try {
        const collectors = await parseCSV(content);
        resolve(collectors);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Process collectors for filtering and validation (used by server functions)
 */
export function prepareCollectorsForProcessing(
  collectors: CollectorSubmission[],
  filterOptions?: FilterOptions
): {
  validCollectors: CollectorSubmission[];
  filterStats: ReturnType<typeof getFilteringStats>;
} {
  // Filter collectors
  const validCollectors = filterCollectors(collectors, filterOptions);
  const filterStats = getFilteringStats(collectors, validCollectors);

  console.log(`Processing ${validCollectors.length} valid collectors (filtered out ${filterStats.removedCount})`);

  return {
    validCollectors,
    filterStats,
  };
}

/**
 * Process collectors for snapshot view with detailed filtering tracking
 */
export function prepareCollectorsForSnapshot(
  collectors: CollectorSubmission[],
  filterOptions?: FilterOptions
): {
  validCollectors: CollectorSubmission[];
  detailedStats: DetailedFilterStats;
} {
  const { validCollectors, detailedStats } = filterCollectorsWithDetails(collectors, filterOptions);

  console.log(`Snapshot analysis: ${validCollectors.length} valid collectors (filtered out ${detailedStats.removedCount})`);

  return {
    validCollectors,
    detailedStats,
  };
}

/**
 * Build processing results from enriched collectors
 */
export function buildProcessingResults(
  enrichedCollectors: CollectorWithWealth[],
  filterStats: ReturnType<typeof getFilteringStats>
): ProcessingResults {
  // Generate report
  const report = generateWealthReport(enrichedCollectors);

  // Get priority collectors
  const priorityCollectors = enrichedCollectors.filter(c => c.wealthScore >= 1500000);

  // Generate enriched CSV
  const enrichedCSV = convertToCSV(enrichedCollectors);

  return {
    allCollectors: enrichedCollectors,
    priorityCollectors,
    report,
    enrichedCSV,
    validCollectorCount: enrichedCollectors.length,
    filteredOutCount: filterStats.removedCount,
  };
}

/**
 * Build processing results for snapshot mode with detailed filtering stats
 */
export function buildSnapshotResults(
  enrichedCollectors: CollectorWithWealth[],
  detailedStats: DetailedFilterStats
): ProcessingResults {
  // Generate report
  const report = generateWealthReport(enrichedCollectors);

  // Get priority collectors (will be empty for snapshots with 0 wealth scores)
  const priorityCollectors = enrichedCollectors.filter(c => c.wealthScore >= 1500000);

  // Generate enriched CSV
  const enrichedCSV = convertToCSV(enrichedCollectors);

  return {
    allCollectors: enrichedCollectors,
    priorityCollectors,
    report,
    enrichedCSV,
    validCollectorCount: enrichedCollectors.length,
    filteredOutCount: detailedStats.removedCount,
    isSnapshot: true,
    detailedFilterStats: detailedStats,
  };
}

// Removed processCollectorSubmissions - logic moved directly to evaluateCollectors server function

/**
 * Utility to create a downloadable CSV blob
 */
export function createCSVBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Utility to trigger CSV download in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = createCSVBlob(csvContent);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate collector data before processing
 */
export function validateCollectors(collectors: CollectorSubmission[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (collectors.length === 0) {
    errors.push('No collector data provided');
    return { isValid: false, errors, warnings };
  }

  // Check for required fields
  collectors.forEach((collector, index) => {
    if (!collector.email?.trim()) {
      errors.push(`Row ${index + 2}: Missing email`);
    }
    if (!collector.deliveryAddress?.trim()) {
      errors.push(`Row ${index + 2}: Missing delivery address`);
    }
    if (!collector.city?.trim()) {
      warnings.push(`Row ${index + 2}: Missing city for ${collector.email}`);
    }
    if (!collector.state?.trim()) {
      warnings.push(`Row ${index + 2}: Missing state for ${collector.email}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}