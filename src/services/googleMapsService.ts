import axios from 'axios'

interface Location {
  lat: number
  lng: number
}

interface Company {
  name: string
  place_id: string
  formatted_address: string
  rating?: number
  types?: string[]
  vicinity?: string
  business_status?: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

export interface SearchParams {
  keywords: string
  location: Location
  radius: number // in meters
  limit?: number // number of results to return
}

export class GoogleMapsService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchNearbyPlaces(params: SearchParams): Promise<Company[]> {
    try {
      console.log('🔍 Starting Google Maps search with real API:', {
        location: `${params.location.lat},${params.location.lng}`,
        radius: params.radius,
        keywords: params.keywords,
        limit: params.limit || 20
      })

      const allResults: Company[] = []
      let nextPageToken: string | null = null
      const maxResults = params.limit || 20

      // Google Places API returns maximum 20 results per request
      // We need to make multiple requests for more results
      do {
        const queryParams = new URLSearchParams({
          location: `${params.location.lat},${params.location.lng}`,
          radius: params.radius.toString(),
          keyword: params.keywords,
          key: this.apiKey,
          type: 'establishment'
        })

        if (nextPageToken) {
          queryParams.append('pagetoken', nextPageToken)
        }

        const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${queryParams}`
        
        // Use multiple CORS proxies as fallback
        const proxies = [
          'https://api.allorigins.win/raw?url=',
          'https://corsproxy.io/?',
          'https://cors-anywhere.herokuapp.com/'
        ]

        let response: Response | null = null
        let data: any = null

        // Try different CORS proxies
        for (const proxy of proxies) {
          try {
            console.log(`🌐 Trying proxy: ${proxy}`)
            const proxyUrl = proxy + encodeURIComponent(apiUrl)
            response = await fetch(proxyUrl, {
              headers: {
                'X-Requested-With': 'XMLHttpRequest'
              }
            })

            if (response.ok) {
              data = await response.json()
              if (data.status === 'OK' || data.results) {
                console.log(`✅ Success with proxy: ${proxy}`)
                break
              }
            }
          } catch (error) {
            console.warn(`❌ Proxy ${proxy} failed:`, error)
            continue
          }
        }

        if (!data || !response?.ok) {
          throw new Error('All CORS proxies failed')
        }

        console.log('📊 Google Maps API response:', {
          status: data.status,
          results: data.results?.length || 0,
          nextPageToken: data.next_page_token
        })

        if (data.status === 'OK' && data.results) {
          const validResults = data.results
            .filter((place: any) => 
              place.name && 
              place.place_id && 
              place.business_status !== 'CLOSED_PERMANENTLY'
            )
            .map((place: any) => ({
              name: place.name,
              place_id: place.place_id,
              formatted_address: place.formatted_address || place.vicinity || '',
              rating: place.rating,
              types: place.types || [],
              vicinity: place.vicinity,
              business_status: place.business_status,
              geometry: place.geometry
            }))

          allResults.push(...validResults)
          nextPageToken = data.next_page_token

          // Check if we have enough results
          if (allResults.length >= maxResults) {
            break
          }

          // Google requires a short delay before using next_page_token
          if (nextPageToken) {
            console.log('⏳ Waiting for next page token...')
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } else {
          console.error('❌ Google Maps API Error:', data.status, data.error_message)
          if (data.status === 'REQUEST_DENIED') {
            throw new Error('Google Maps API Key is invalid or restricted')
          } else if (data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Google Maps API quota exceeded')
          } else {
            throw new Error(`Google Maps API Error: ${data.status}`)
          }
        }
      } while (nextPageToken && allResults.length < maxResults)

      // Limit results to requested amount
      const limitedResults = allResults.slice(0, maxResults)
      
      console.log(`🎯 Final results: ${limitedResults.length} companies found`)
      return limitedResults

    } catch (error) {
      console.error('❌ Error in Google Maps search:', error)
      throw error
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const fields = [
        'name',
        'formatted_address',
        'formatted_phone_number',
        'international_phone_number',
        'website',
        'rating',
        'reviews',
        'opening_hours',
        'types',
        'url'
      ].join(',')

      const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`
      
      const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?'
      ]

      for (const proxy of proxies) {
        try {
          const response = await fetch(proxy + encodeURIComponent(apiUrl))
          
          if (response.ok) {
            const data = await response.json()
            if (data.status === 'OK') {
              return data.result
            }
          }
        } catch (error) {
          continue
        }
      }

      throw new Error('Could not fetch place details')
    } catch (error) {
      console.error('Error fetching place details:', error)
      return null
    }
  }
}

// Remove MockGoogleMapsService - we only want real data
export class MockGoogleMapsService {
  async searchNearbyPlaces(params: SearchParams): Promise<Company[]> {
    throw new Error('Mock service disabled. Please provide a valid Google Maps API key.')
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    throw new Error('Mock service disabled. Please provide a valid Google Maps API key.')
  }
}