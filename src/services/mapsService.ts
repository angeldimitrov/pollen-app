/**
 * Google Maps API Service for city search and geocoding
 * 
 * Provides city search functionality using Google Places API and
 * coordinate resolution using Geocoding API for pollen data fetching.
 * 
 * Business Context:
 * - Enables manual city selection when geolocation fails or is denied
 * - Uses same API key as Pollen API for cost efficiency
 * - Focuses on cities/localities to ensure pollen data availability
 */

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export interface City {
  name: string;
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId: string;
  country?: string;
  region?: string;
}

export interface PlacesTextSearchResponse {
  results: Array<{
    place_id: string;
    formatted_address: string;
    name: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
  error_message?: string;
}

export interface GeocodingResponse {
  results: Array<{
    place_id: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
  error_message?: string;
}

class MapsServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MapsServiceError';
  }
}

/**
 * Search for cities using Google Places Text Search API
 * 
 * Filters results to focus on cities/localities to ensure
 * compatibility with pollen data availability.
 * 
 * @param query - City name or partial city name
 * @param limit - Maximum number of results (default: 5)
 * @returns Promise<City[]> - Array of matching cities with coordinates
 */
export async function searchCities(query: string, limit: number = 5): Promise<City[]> {
  if (!API_KEY) {
    throw new MapsServiceError('Google Maps API key not configured');
  }

  if (!query.trim()) {
    return [];
  }

  try {
    // Use Text Search API to find cities
    // Focus on locality/administrative_area types for better pollen coverage
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', `${query.trim()} city`);
    url.searchParams.set('type', 'locality');
    url.searchParams.set('key', API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new MapsServiceError(`Maps API HTTP Error: ${response.status}`);
    }

    const data: PlacesTextSearchResponse = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      throw new MapsServiceError('Maps API access denied. Check API key and enabled services.');
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new MapsServiceError('Maps API quota exceeded. Please try again later.');
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new MapsServiceError(data.error_message || `Maps API error: ${data.status}`);
    }

    // Filter and transform results to focus on cities
    const cities: City[] = data.results
      .filter(result => {
        // Prioritize results that are clearly cities/localities
        const isCityType = result.types.some(type => 
          ['locality', 'administrative_area_level_1', 'administrative_area_level_2'].includes(type)
        );
        return isCityType;
      })
      .slice(0, limit)
      .map(result => {
        // Extract country and region from address components
        const addressComponents = result.address_components || [];
        const country = addressComponents.find(c => c.types.includes('country'))?.long_name;
        const region = addressComponents.find(c => 
          c.types.includes('administrative_area_level_1')
        )?.long_name;

        return {
          name: result.name,
          formattedAddress: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          placeId: result.place_id,
          country,
          region
        };
      });

    return cities;
  } catch (error) {
    if (error instanceof MapsServiceError) {
      throw error;
    }

    console.error('City search error:', error);
    throw new MapsServiceError('Unable to search for cities. Please check your internet connection.');
  }
}

/**
 * Get coordinates for a specific city using Geocoding API
 * 
 * Used as fallback or for precise coordinate lookup when
 * we have a specific city name but need exact coordinates.
 * 
 * @param cityName - Full city name (e.g., "San Francisco, CA, USA")
 * @returns Promise<City> - City with precise coordinates
 */
export async function getCityCoordinates(cityName: string): Promise<City> {
  if (!API_KEY) {
    throw new MapsServiceError('Google Maps API key not configured');
  }

  if (!cityName.trim()) {
    throw new MapsServiceError('City name is required');
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', cityName.trim());
    url.searchParams.set('key', API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new MapsServiceError(`Geocoding API HTTP Error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      throw new MapsServiceError('Geocoding API access denied. Check API key and enabled services.');
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new MapsServiceError('Geocoding API quota exceeded. Please try again later.');
    }

    if (data.status === 'ZERO_RESULTS') {
      throw new MapsServiceError(`No coordinates found for city: ${cityName}`);
    }

    if (data.status !== 'OK') {
      throw new MapsServiceError(data.error_message || `Geocoding error: ${data.status}`);
    }

    const result = data.results[0];
    
    // Extract location components
    const country = result.address_components.find(c => 
      c.types.includes('country')
    )?.long_name;
    
    const region = result.address_components.find(c => 
      c.types.includes('administrative_area_level_1')
    )?.long_name;

    const cityComponent = result.address_components.find(c => 
      c.types.includes('locality')
    )?.long_name || cityName;

    return {
      name: cityComponent,
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      placeId: result.place_id,
      country,
      region
    };
  } catch (error) {
    if (error instanceof MapsServiceError) {
      throw error;
    }

    console.error('Geocoding error:', error);
    throw new MapsServiceError('Unable to get city coordinates. Please check your internet connection.');
  }
}

/**
 * Get popular cities for a given country (fallback list)
 * 
 * Provides default city options when search fails or for
 * initial dropdown population in specific regions.
 * 
 * @param countryCode - ISO country code (e.g., 'US', 'DE', 'UK')
 * @returns Promise<City[]> - Array of popular cities
 */
export async function getPopularCities(countryCode: string = 'US'): Promise<City[]> {
  // Define popular cities by country for fallback
  const popularCitiesByCountry: Record<string, string[]> = {
    'US': [
      'New York, NY, USA',
      'Los Angeles, CA, USA', 
      'Chicago, IL, USA',
      'Houston, TX, USA',
      'Phoenix, AZ, USA'
    ],
    'DE': [
      'Berlin, Germany',
      'Munich, Germany',
      'Hamburg, Germany',
      'Cologne, Germany',
      'Frankfurt, Germany'
    ],
    'UK': [
      'London, UK',
      'Manchester, UK',
      'Birmingham, UK',
      'Leeds, UK',
      'Glasgow, UK'
    ]
  };

  const cities = popularCitiesByCountry[countryCode.toUpperCase()] || popularCitiesByCountry['US'];
  
  try {
    // Get coordinates for each popular city
    const citiesWithCoordinates = await Promise.all(
      cities.map(async (cityName) => {
        try {
          return await getCityCoordinates(cityName);
        } catch (error) {
          console.warn(`Failed to get coordinates for ${cityName}:`, error);
          return null;
        }
      })
    );

    // Filter out failed lookups
    return citiesWithCoordinates.filter((city): city is City => city !== null);
  } catch (error) {
    console.error('Failed to load popular cities:', error);
    return [];
  }
}

export { MapsServiceError };