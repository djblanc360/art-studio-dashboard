// CSV data type consistent with existing app
export type CsvData = Record<string, any>[];

/**
 * Detailed filtering result for individual collectors
 */
export type FilteredCollectorDetail = {
  collector: CollectorSubmission;
  reason: string;
  category: 'incomplete' | 'non-us' | 'po-box' | 'apartment' | 'custom';
}

/**
 * Enhanced filtering statistics with detailed breakdown
 */
export type DetailedFilterStats = {
  originalCount: number;
  validCount: number;
  removedCount: number;
  removalPercentage: string;
  breakdown: {
    incomplete: FilteredCollectorDetail[];
    nonUS: FilteredCollectorDetail[];
    poBox: FilteredCollectorDetail[];
    apartment: FilteredCollectorDetail[];
    custom: FilteredCollectorDetail[];
  };
  summary: {
    incompleteCount: number;
    nonUSCount: number;
    poBoxCount: number;
    apartmentCount: number;
    customCount: number;
  };
}

// Core collector submission data from CSV
export type CollectorSubmission = {
  email: string;
  firstName?: string;
  lastName?: string;
  deliveryAddress: string;
  city: string;
  state: string;
  country: string;
  launch?: string;
  postcode: string;
  product?: string;
  cohort?: string;
  userType?: string;
  marketingConsent?: string;
  winner?: string;
};

// Enhanced collector with wealth assessment
export type CollectorWithWealth = CollectorSubmission & {
  wealthScore: number;
  propertyType: PropertyType;
  rawValue: number;
  estimationMethod: EstimationMethod;
};

// Removed WealthCategory - simplified to just use wealth scores

// Property ownership type
export type PropertyType = 'Owner' | 'Renter';

// How wealth was estimated
export type EstimationMethod = 'PropertyValue' | 'RentBasedIncome' | 'Unknown';

// RentCast API response types
export type RentCastValueResponse = {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  latitude: number;
  longitude: number;
  comparables?: RentCastComparable[];
};

export type RentCastRentResponse = {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  latitude: number;
  longitude: number;
  comparables?: RentCastComparable[];
};

export type RentCastComparable = {
  id: string;
  formattedAddress: string;
  price: number;
  distance: number;
  correlation: number;
};

// Processing results
export type ProcessingResults = {
  allCollectors: CollectorWithWealth[];
  priorityCollectors: CollectorWithWealth[];
  report: WealthReport;
  enrichedCSV: string;
  validCollectorCount: number;
  filteredOutCount: number;
  isSnapshot?: boolean;
  detailedFilterStats?: DetailedFilterStats;
};

// Wealth distribution report
export type WealthReport = {
  totalCollectors: number;
  // rich: number;
  // high: number;
  // mid: number;
  // poor: number;
  avgWealthScore: number;
  topTierPercentage: string;
};

// Progress callback type
export type ProgressCallback = (completed: number, total: number, current: string) => void;

// API configuration
export type RentCastConfig = {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: number; // milliseconds between requests
};

// Filter options
export type FilterOptions = {
  excludeNonUS?: boolean;
  excludePOBoxes?: boolean;
  excludeApartments?: boolean;
  customFilters?: ((collector: CollectorSubmission) => boolean)[];
};

// Removed WealthThresholds - simplified to just use wealth scores

// CSV export options
export type CSVExportOptions = {
  includeInternalFields?: boolean;
  customHeaders?: Record<string, string>;
  sortBy?: keyof CollectorWithWealth;
  sortOrder?: 'asc' | 'desc';
};