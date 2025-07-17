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
    launch: z.string().optional(),
    postcode: z.string(),
    product: z.string().optional(),
    cohort: z.string().optional(),
    userType: z.string().optional(),
    marketingConsent: z.string().optional(),
    winner: z.string().optional(),
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
    launch: z.string().optional(),
    postcode: z.string(),
    product: z.string().optional(),
    cohort: z.string().optional(),
    userType: z.string().optional(),
    marketingConsent: z.string().optional(),
    winner: z.string().optional(),
  })),
})).handler(async ({ data }) => {
  const { collectors } = data;
  if (!RENTCAST_API_KEY) {
    throw new Error('RentCast API key not configured');
  }
  // Validate input
  if (!collectors || !Array.isArray(collectors)) {
    throw new Error('Invalid request: collectors array is required');
  }

  console.group(`🎨 Art Collector Evaluation Request`);
  console.log(`Received ${collectors.length} collector submissions`);

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

  console.log(`✅ Starting wealth assessment for ${collectors.length} collectors`);
  console.groupEnd();

  // Process collectors directly
  const service = createRentCastService(RENTCAST_API_KEY);
  
  // Filter collectors
  const { validCollectors, filterStats } = prepareCollectorsForProcessing(collectors, {
    excludeNonUS: true,
    excludePOBoxes: true,
    excludeApartments: true,
  });

  console.log(`📋 Processing ${validCollectors.length} valid collectors (filtered out ${filterStats.removedCount})`);

  // Process each collector through RentCast API
  const enrichedCollectors: CollectorWithWealth[] = [];
  
  for (let i = 0; i < validCollectors.length; i++) {
    const collector = validCollectors[i];
    console.log(`🏠 Evaluating ${i + 1}/${validCollectors.length}: ${collector.firstName} ${collector.lastName}`);
    
    // try {
    //   const enrichedCollector = await service.assessCollectorWealth(collector);
    //   enrichedCollectors.push(enrichedCollector);
    // } catch (error) {
    //   console.error(`❌ Failed to assess ${collector.email}:`, error);
    //   // Add collector with zero wealth score if assessment fails
    //   enrichedCollectors.push({
    //     ...collector,
    //     wealthScore: 0,
    //     propertyType: 'Owner',
    //     rawValue: 0,
    //     estimationMethod: 'Unknown',
    //   });
    // }
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