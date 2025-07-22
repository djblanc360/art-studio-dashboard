import type { CollectorSubmission, FilterOptions } from './types';

/**
 * Detailed filtering result for individual collectors
 */
export interface FilteredCollectorDetail {
  collector: CollectorSubmission;
  reason: string;
  category: 'incomplete' | 'non-us' | 'po-box' | 'apartment' | 'custom';
}

/**
 * Enhanced filtering statistics with detailed breakdown
 */
export interface DetailedFilterStats {
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

/**
 * Check if address is a PO Box
 */
export function isPOBoxAddress(address: string): boolean {
  const poBoxPatterns = [
    /\bpo\s*box\b/i,
    /\bp\.?\s*o\.?\s*box\b/i,
    /\bpost\s*office\s*box\b/i,
    /\bpostal\s*box\b/i,
    /\bmailbox\b/i,
    /\bpmb\b/i, // Private Mail Box
  ];
  
  return poBoxPatterns.some(pattern => pattern.test(address));
}

/**
 * Check if address is in the United States
 */
export function isUSAddress(collector: CollectorSubmission): boolean {
  return collector.country === 'US' || collector.country === 'USA';
}

/**
 * Check if address appears to be a rental property
 */
export function isRentalAddress(address: string): boolean {
  const rentalIndicators = [
    'apt', 'apartment', 'unit', 'suite', '#',
    'ste', 'floor', 'fl', 'bldg', 'building',
    'room', 'rm', 'level', 'lvl'
  ];
  
  const normalizedAddress = address.toLowerCase();
  return rentalIndicators.some(indicator => 
    normalizedAddress.includes(indicator)
  );
}

/**
 * Check if address has sufficient information for API calls
 */
export function hasValidAddressInfo(collector: CollectorSubmission): boolean {
  return !!(
    collector.deliveryAddress?.trim() &&
    collector.city?.trim() &&
    collector.state?.trim()
  );
}

/**
 * Apply filters to collector list
 */
export function filterCollectors(
  collectors: CollectorSubmission[],
  options: FilterOptions = {}
): CollectorSubmission[] {
  const {
    excludeNonUS,
    excludePOBoxes,
    excludeApartments,
    customFilters = []
  } = options;

  let totalApartmentsFiltered = 0;
  let totalPOBoxesFiltered = 0;
  let totalNonUSFiltered = 0;
  let totalValid = 0;

  const filteredCollectors = collectors.filter(collector => {
    // Check address completeness first (always required)
    if (!hasValidAddressInfo(collector)) {
      console.log(`Filtered out incomplete address: ${collector.email}`);
      return false;
    }

    // Apply US filter (only if explicitly enabled)
    if (excludeNonUS && !isUSAddress(collector)) {
      totalNonUSFiltered++;
      console.log(`Filtered out non-US address: ${collector.email} - ${collector.country}`);
      return false;
    }

    // Apply PO Box filter (only if explicitly enabled)
    if (excludePOBoxes && isPOBoxAddress(collector.deliveryAddress)) {
      totalPOBoxesFiltered++;
      console.log(`Filtered out PO Box address: ${collector.email} - ${collector.deliveryAddress}`);
      return false;
    }

    // Apply apartment/rental filter (only if explicitly enabled)
    if (excludeApartments && isRentalAddress(collector.deliveryAddress)) {
      totalApartmentsFiltered++;
      console.log(`Filtered out apartment/rental address: ${collector.email} - ${collector.deliveryAddress}`);
      return false;
    }

    // Apply custom filters
    for (const filter of customFilters) {
      if (!filter(collector)) {
        console.log(`Filtered out by custom filter: ${collector.email}`);
        return false;
      }
    }

    return true;
  });

  // Log filtering statistics
  const totalFiltered = collectors.length - filteredCollectors.length;
  const filteringPercentage = ((totalFiltered / collectors.length) * 100).toFixed(1);

  console.log(`📊 Filtering Statistics:`);
  console.log(`📍 Total addresses processed: ${collectors.length}`);
  console.log(`❌ Total addresses filtered: ${totalFiltered} (${filteringPercentage}%)`);
  console.log(`📋 Breakdown of filtered addresses:`);
  
  if (excludeNonUS) {
    console.log(`🌍 Non-US addresses: ${totalNonUSFiltered}`);
  }
  
  if (excludePOBoxes) {
    console.log(`📮 PO Box addresses: ${totalPOBoxesFiltered}`);
  }
  
  if (excludeApartments) {
    console.log(`🏢 Apartment/rental addresses: ${totalApartmentsFiltered}`);
  }
  
  console.groupEnd();

  return filteredCollectors;
}

/**
 * Apply filters with detailed tracking for snapshot view
 */
export function filterCollectorsWithDetails(
  collectors: CollectorSubmission[],
  options: FilterOptions = {}
): {
  validCollectors: CollectorSubmission[];
  detailedStats: DetailedFilterStats;
} {
  const {
    excludeNonUS,
    excludePOBoxes,
    excludeApartments,
    customFilters = []
  } = options;

  const filteredDetails: {
    incomplete: FilteredCollectorDetail[];
    nonUS: FilteredCollectorDetail[];
    poBox: FilteredCollectorDetail[];
    apartment: FilteredCollectorDetail[];
    custom: FilteredCollectorDetail[];
  } = {
    incomplete: [],
    nonUS: [],
    poBox: [],
    apartment: [],
    custom: [],
  };

  const validCollectors = collectors.filter(collector => {
    // Check address completeness first (always required)
    if (!hasValidAddressInfo(collector)) {
      filteredDetails.incomplete.push({
        collector,
        reason: 'Missing required address information (address, city, or state)',
        category: 'incomplete'
      });
      return false;
    }

    // Apply US filter (only if explicitly enabled)
    if (excludeNonUS && !isUSAddress(collector)) {
      filteredDetails.nonUS.push({
        collector,
        reason: `Non-US address: ${collector.country}`,
        category: 'non-us'
      });
      return false;
    }

    // Apply PO Box filter (only if explicitly enabled)
    if (excludePOBoxes && isPOBoxAddress(collector.deliveryAddress)) {
      filteredDetails.poBox.push({
        collector,
        reason: `PO Box address: ${collector.deliveryAddress}`,
        category: 'po-box'
      });
      return false;
    }

    // Apply apartment/rental filter (only if explicitly enabled)
    if (excludeApartments && isRentalAddress(collector.deliveryAddress)) {
      filteredDetails.apartment.push({
        collector,
        reason: `Apartment/rental address: ${collector.deliveryAddress}`,
        category: 'apartment'
      });
      return false;
    }

    // Apply custom filters
    for (const filter of customFilters) {
      if (!filter(collector)) {
        filteredDetails.custom.push({
          collector,
          reason: 'Failed custom filter',
          category: 'custom'
        });
        return false;
      }
    }

    return true;
  });

  const removedCount = collectors.length - validCollectors.length;
  const detailedStats: DetailedFilterStats = {
    originalCount: collectors.length,
    validCount: validCollectors.length,
    removedCount,
    removalPercentage: ((removedCount / collectors.length) * 100).toFixed(1),
    breakdown: filteredDetails,
    summary: {
      incompleteCount: filteredDetails.incomplete.length,
      nonUSCount: filteredDetails.nonUS.length,
      poBoxCount: filteredDetails.poBox.length,
      apartmentCount: filteredDetails.apartment.length,
      customCount: filteredDetails.custom.length,
    }
  };

  return {
    validCollectors,
    detailedStats
  };
}

/**
 * Get filtering statistics
 */
export function getFilteringStats(
  originalCollectors: CollectorSubmission[],
  filteredCollectors: CollectorSubmission[]
) {
  const originalCount = originalCollectors.length;
  const filteredCount = filteredCollectors.length;
  const removedCount = originalCount - filteredCount;

  // Analyze what was filtered out
  const invalidAddresses = originalCollectors.filter(c => !hasValidAddressInfo(c)).length;
  const nonUSAddresses = originalCollectors.filter(c => hasValidAddressInfo(c) && !isUSAddress(c)).length;
  const poBoxAddresses = originalCollectors.filter(c => 
    hasValidAddressInfo(c) && isUSAddress(c) && isPOBoxAddress(c.deliveryAddress)
  ).length;

  return {
    originalCount,
    filteredCount,
    removedCount,
    removalPercentage: ((removedCount / originalCount) * 100).toFixed(1),
    breakdown: {
      invalidAddresses,
      nonUSAddresses,
      poBoxAddresses,
      otherFiltered: removedCount - invalidAddresses - nonUSAddresses - poBoxAddresses
    }
  };
}

/**
 * Validate and prepare address for API call
 */
export function formatAddressForAPI(collector: CollectorSubmission): string {
  const parts = [
    collector.deliveryAddress?.trim(),
    collector.city?.trim(),
    collector.state?.trim()
  ].filter(Boolean);

  if (parts.length < 3) {
    throw new Error(`Incomplete address for ${collector.email}`);
  }

  return parts.join(', ');
}