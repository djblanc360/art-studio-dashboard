import type { 
  RentCastConfig, 
  RentCastValueResponse, 
  RentCastRentResponse,
  CollectorSubmission,
  CollectorWithWealth,
  ProgressCallback
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
   * Get property value for owned properties
   */
  async getPropertyValue(address: string): Promise<number> {
    try {
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
    } catch (error) {
      console.error(`Error fetching property value for ${address}:`, error);
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