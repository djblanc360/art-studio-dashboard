import type { 
  RentCastConfig, 
  RentCastValueResponse, 
  RentCastRentResponse,
  CollectorSubmission,
  CollectorWithWealth,
  ProgressCallback,
  PropertyRecord
} from "./types";
import { formatAddressForAPI, isRentalAddress } from "./filter";

export class RentCastService {
  private config: Required<RentCastConfig>;

  constructor(config: RentCastConfig) {
    this.config = {
      baseUrl: 'https://api.rentcast.io/v1',
      rateLimit: 0, // 0ms between requests
      ...config
    };
  }

  /**
   * Get property records by address
   * https://developers.rentcast.io/reference/property-records
   */
  async getPropertyRecords(address: string): Promise<PropertyRecord[]> {
    try {
      // Step 2: Use correct endpoint URL for property records
      const response = await fetch(
        `${this.config.baseUrl}/properties?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'X-Api-Key': this.config.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Property records API error for ${address}: ${response.status}`);
        return [];
      }
      
      // Step 3: Parse and return property records array
      const data: PropertyRecord[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching property records for ${address}:`, error);
      return [];
    }
  }

  /**
   * Get property value for owned properties with enhanced workflow
   * https://developers.rentcast.io/reference/value-estimate
   */
  async getPropertyValue(address: string): Promise<number> {
    try {
      // Step 1: Get property records to fetch property details
      const propertyRecords = await this.getPropertyRecords(address);
      
      if (propertyRecords.length === 0) {
        console.warn(`No property records found for ${address}, falling back to basic value estimate`);
        // Fallback to basic value estimate without property details
        const response = await fetch(
          `${this.config.baseUrl}/avm/value?address=${encodeURIComponent(address)}`,
          {
            headers: {
              'X-Api-Key': this.config.apiKey,
            },
          }
        );

        if (!response.ok) {
          console.warn(`Property value API error for ${address}: ${response.status}`);
          return 0;
        }

        const data: RentCastValueResponse = await response.json();
        return data.price || 0;
      }

      // Step 3: Extract property details from first record (result[0])
      const property = propertyRecords[0];
      const { propertyType, bedrooms, bathrooms, squareFootage } = property;

      // Step 4: Build enhanced query parameters for value estimate
      const params = new URLSearchParams({
        address: address,
        compCount: '20' // Hard-coded per remail thread
      });

      // Add property details if available to improve accuracy
      if (propertyType) params.append('propertyType', propertyType);
      if (bedrooms !== undefined && bedrooms !== null) params.append('bedrooms', bedrooms.toString());
      if (bathrooms !== undefined && bathrooms !== null) params.append('bathrooms', bathrooms.toString());
      if (squareFootage !== undefined && squareFootage !== null) params.append('squareFootage', squareFootage.toString());

      console.log(`🏠 Enhanced value estimate for ${address} with details:`, {
        propertyType,
        bedrooms,
        bathrooms,
        squareFootage
      });

      // Step 4: Get enhanced property value estimate with property details
      const response = await fetch(
        `${this.config.baseUrl}/avm/value?${params.toString()}`,
        {
          headers: {
            'X-Api-Key': this.config.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Enhanced property value API error for ${address}: ${response.status}`);
        return 0;
      }

      // Step 5: Extract price from response body
      const data: RentCastValueResponse = await response.json();
      return data.price || 0;
    } catch (error) {
      console.error(`Error fetching enhanced property value for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Get monthly rent for rental properties
   */
  async getMonthlyRent(address: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/avm/rent/long-term?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'X-Api-Key': this.config.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Rent estimate API error for ${address}: ${response.status}`);
        return 0;
      }

      const data: RentCastRentResponse = await response.json();
      return data.rent || 0;
    } catch (error) {
      console.error(`Error fetching rent for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Convert monthly rent to wealth score using 30% rule
   */
  private convertRentToWealthScore(monthlyRent: number): number {
    if (monthlyRent === 0) return 0;
    
    // Rent typically = 30% of gross income
    const estimatedAnnualIncome = (monthlyRent * 12) / 0.30;
    
    // Convert to property value equivalent for comparison
    // High earners can afford art = 3-4x their annual income in property equivalent
    return estimatedAnnualIncome * 3.5;
  }

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.config.rateLimit));
  }

  /**
   * Assess individual collector wealth
   */
  async assessCollectorWealth(
    collector: CollectorSubmission
  ): Promise<CollectorWithWealth> {
    try {
      const fullAddress = formatAddressForAPI(collector);
      
      // Property owner - use property value
      const propertyValue = await this.getPropertyValue(fullAddress);
      const wealthScore = propertyValue;
      
        return {
            ...collector,
            wealthScore,
            propertyType: 'Owner',
            rawValue: propertyValue,
            estimationMethod: 'PropertyValue',
        };
    } catch (error) {
      console.error(`Error assessing collector ${collector.email}:`, error);
      
      // Return collector with zero wealth score if assessment fails
      return {
        ...collector,
        wealthScore: 0,
        propertyType: 'Owner', // Default assumption
        rawValue: 0,
        estimationMethod: 'Unknown',
      };
    }
  }

  /**
   * Process multiple collectors with rate limiting and progress tracking
   */
  async processCollectors(
    collectors: CollectorSubmission[],
    onProgress?: ProgressCallback
  ): Promise<CollectorWithWealth[]> {
    const results: CollectorWithWealth[] = [];
    
    for (let i = 0; i < collectors.length; i++) {
      const collector = collectors[i];
      
      if (onProgress) {
        onProgress(i + 1, collectors.length, `${collector.firstName} ${collector.lastName}`);
      }
      
      const enrichedCollector = await this.assessCollectorWealth(collector);
      results.push(enrichedCollector);
      
      // Apply rate limiting between requests
      if (i < collectors.length - 1) {
        await this.rateLimit();
      }
    }

    // Sort by wealth score (highest first) for art targeting
    return results.sort((a, b) => b.wealthScore - a.wealthScore);
  }
}

/**
 * Factory function to create RentCast service instance
 */
export function createRentCastService(apiKey: string, config?: Partial<RentCastConfig>): RentCastService {
  return new RentCastService({
    apiKey,
    ...config
  });
}