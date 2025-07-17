import type { CollectorSubmission, FilterOptions } from './types';

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
  console.log(`  📍 Total addresses processed: ${collectors.length}`);
  console.log(`  ❌ Total addresses filtered: ${totalFiltered} (${filteringPercentage}%)`);
  console.log(`  📋 Breakdown of filtered addresses:`);
  
  if (excludeNonUS) {
    console.log(`    🌍 Non-US addresses: ${totalNonUSFiltered}`);
  }
  
  if (excludePOBoxes) {
    console.log(`    📮 PO Box addresses: ${totalPOBoxesFiltered}`);
  }
  
  if (excludeApartments) {
    console.log(`    🏢 Apartment/rental addresses: ${totalApartmentsFiltered}`);
  }
  
  console.groupEnd();

  return filteredCollectors;
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