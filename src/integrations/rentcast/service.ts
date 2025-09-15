import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { 
  RentCastConfig, 
  RentCastValueResponse, 
  RentCastRentResponse,
  CollectorSubmission,
  CollectorWithWealth,
  ProgressCallback,
  ProcessingResults
} from "./types"
import {
  validateCollectors,
  prepareCollectorsForProcessing,
  buildProcessingResults,
  prepareCollectorsForSnapshot,
  buildSnapshotResults,
} from "./processing"
import { createRentCastService } from "./index";

const RENTCAST_API_KEY = import.meta.env.VITE_RENTCAST_API_KEY;

/**
 * Assess individual collector wealth
 */
export const assessCollectorWealth = createServerFn({ method: 'POST' })
.validator(z.object({
  collector: z.object({
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    deliveryAddress: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postcode: z.string(),
  }),
})).handler(async ({ data }) => {
  const { collector } = data;

    if (!RENTCAST_API_KEY) {
      throw new Error('RentCast API key not configured');
    }

    const service = createRentCastService(RENTCAST_API_KEY);
    return service.assessCollectorWealth(collector);
});

/**
 * Main server function to evaluate all collectors
 */
export const evaluateCollectors = createServerFn({ method: 'POST' })
.validator(z.object({
  collectors: z.array(z.object({
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    deliveryAddress: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postcode: z.string(),
    winner: z.string().optional(),
  })),
  showSnapshot: z.boolean().optional().default(false),
})).handler(async ({ data }) => {
  const { collectors, showSnapshot } = data;
  if (!RENTCAST_API_KEY) {
    throw new Error('RentCast API key not configured');
  }
  // Validate input
  if (!collectors || !Array.isArray(collectors)) {
    throw new Error('Invalid request: collectors array is required');
  }

  console.group(`🎨 Art Collector Evaluation Request`);
  console.log(`Received ${collectors.length} collector submissions`);
  console.log(`Show filtering snapshot: ${showSnapshot}`);

  // Validate collector data
  const validation = validateCollectors(collectors);
  if (!validation.isValid) {
    console.error(`❌ Validation failed:`, validation.errors);
    console.groupEnd();
    throw new Error(`Invalid collector data: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn(`⚠️ Validation warnings:`, validation.warnings);
  }

  console.log(`✅ Starting ${showSnapshot ? 'filtering preview' : 'wealth assessment'} for ${collectors.length} collectors`);
  console.groupEnd();

  // If showSnapshot is enabled, use detailed filtering and skip API calls
  if (showSnapshot) {
    // Use detailed filtering for snapshot view
    const { validCollectors, detailedStats } = prepareCollectorsForSnapshot(collectors, {
      excludeNonUS: true,
      excludePOBoxes: true,
      excludeApartments: true,
    });

    // Create mock enriched collectors for snapshot view with zero wealth scores
    const mockEnrichedCollectors: CollectorWithWealth[] = validCollectors.map(collector => ({
      ...collector,
      wealthScore: 0,
      propertyType: 'Owner' as const,
      rawValue: 0,
      estimationMethod: 'Unknown' as const,
    }));

    // Build results with detailed filtering stats
    const results = buildSnapshotResults(mockEnrichedCollectors, detailedStats);

    console.group(`📊 Filtering Snapshot Complete`);
    console.log(`✅ Filtering analysis complete for ${collectors.length} collectors`);
    console.log(`📋 Valid collectors found: ${validCollectors.length}`);
    console.log(`❌ Filtered out: ${detailedStats.removedCount} (${detailedStats.removalPercentage}%)`);
    console.log(`📊 Breakdown: Incomplete: ${detailedStats.summary.incompleteCount}, Non-US: ${detailedStats.summary.nonUSCount}, PO Box: ${detailedStats.summary.poBoxCount}, Apartments: ${detailedStats.summary.apartmentCount}`);
    console.groupEnd();

    return results;
  }

  // Original processing flow
  // Filter collectors
  const { validCollectors, filterStats } = prepareCollectorsForProcessing(collectors, {
    excludeNonUS: true,
    excludePOBoxes: true,
    excludeApartments: true,
  });

  console.log(`📋 Processing ${validCollectors.length} valid collectors (filtered out ${filterStats.removedCount})`);

  const service = createRentCastService(RENTCAST_API_KEY);

  // Process each collector through RentCast API
  const enrichedCollectors: CollectorWithWealth[] = [];
  
  for (let i = 0; i < validCollectors.length; i++) {
    const collector = validCollectors[i];
    console.log(`🏠 Evaluating ${i + 1}/${validCollectors.length}: ${collector.firstName} ${collector.lastName}`);
    
    try {
      const enrichedCollector = await service.assessCollectorWealth(collector);
      enrichedCollectors.push(enrichedCollector);
    } catch (error) {
      console.error(`❌ Failed to assess ${collector.email}:`, error);
      // Add collector with zero wealth score if assessment fails
      enrichedCollectors.push({
        ...collector,
        wealthScore: 0,
        propertyType: 'Owner',
        rawValue: 0,
        estimationMethod: 'Unknown',
      });
    }
  }

  // Sort by wealth score (highest first)
  enrichedCollectors.sort((a, b) => b.wealthScore - a.wealthScore);

  // Build final results
  const results = buildProcessingResults(enrichedCollectors, filterStats);

  console.group(`🎯 Collector Evaluation Complete`);
  console.log(`✅ Successfully evaluated ${results.allCollectors.length} collectors`);
  console.log(`🎯 Priority collectors: ${results.priorityCollectors.length}`);
  console.log(`💰 Average wealth score: ${Math.round(results.report.avgWealthScore).toLocaleString()}`);
  console.groupEnd();

  return results;
});

/**
 * Get property value for a single address
 */
export const getPropertyValue = createServerFn({ method: 'POST' })
.validator(z.object({
  address: z.string(),
})).handler(async ({ data }) => {
  const { address } = data;

  if (!RENTCAST_API_KEY) {
    throw new Error('RentCast API key not configured');
  }

  const service = createRentCastService(RENTCAST_API_KEY);
  return service.getPropertyValue(address);
});

/**
 * Get monthly rent for a single address
 */
export const getMonthlyRent = createServerFn({ method: 'POST' })
.validator(z.object({
  address: z.string(),
})).handler(async ({ data }) => {
  const { address } = data;

  if (!RENTCAST_API_KEY) {
    throw new Error('RentCast API key not configured');
  }

  const service = createRentCastService(RENTCAST_API_KEY);
  return service.getMonthlyRent(address);
});

export const generateCollectorCSV = createServerFn({ method: 'POST' })
.validator(z.object({
  collectors: z.array(z.object({
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    deliveryAddress: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postcode: z.string(),
    userType: z.string().optional(),
    wealthScore: z.number(),
    propertyType: z.string(),
    rawValue: z.number(), // Add this line
  })),
})).handler(async ({ data }) => {
  const { collectors } = data;
  
  console.log(`🔄 Generating streaming CSV for ${collectors.length} collectors...`);

  
  // Create CSV header
  const headers = [
    'Email', 'First Name', 'Last Name', 'Delivery Address', 'City', 'State', 
    'Country', 'Postcode', 'User Type', 'Property Value', 'Property Type'
  ];
  
  // Build CSV content in batches to avoid memory issues
  const csvLines: string[] = [];
  csvLines.push(headers.join(','));
  
  // Process collectors in batches - data already sorted!
  const batchSize = 50;
  for (let i = 0; i < collectors.length; i += batchSize) {
    const batch = collectors.slice(i, i + batchSize);
    
    for (const collector of batch) {
      const row = [
        `"${(collector.email || '').replace(/"/g, '""')}"`,
        `"${(collector.firstName || '').replace(/"/g, '""')}"`,
        `"${(collector.lastName || '').replace(/"/g, '""')}"`,
        `"${(collector.deliveryAddress || '').replace(/"/g, '""')}"`,
        `"${(collector.city || '').replace(/"/g, '""')}"`,
        `"${(collector.state || '').replace(/"/g, '""')}"`,
        `"${(collector.country || '').replace(/"/g, '""')}"`,
        `"${(collector.postcode || '').replace(/"/g, '""')}"`,
        `"${(collector.userType || '').replace(/"/g, '""')}"`,
        `${collector.wealthScore || 0}`, // Property Value
        `"${(collector.propertyType || '').replace(/"/g, '""')}"`, // Property Type
        `${collector.rawValue || 0}`, // Raw Value
      ];
      csvLines.push(row.join(','));
    }
    
    // Small yield to prevent blocking
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  const csvContent = csvLines.join('\n');
  console.log(`✅ CSV generated: ${csvContent.length} characters for ${collectors.length} collectors`);
  
  // Return just the CSV string
  return csvContent;
});