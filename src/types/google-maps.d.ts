// Google Maps API type definitions
declare global {
  interface Window {
    google?: {
      maps: {
        Map: any
        Marker: any
        Animation: any
        Size: any
        Point: any
        LatLng: any
        event: any
        places: {
          SearchBox: any
          AutocompleteService: any
          PlacesService: any
          PlacesServiceStatus: {
            OK: string
            ZERO_RESULTS: string
            OVER_QUERY_LIMIT: string
            REQUEST_DENIED: string
            INVALID_REQUEST: string
            NOT_FOUND: string
          }
        }
        MapMouseEvent: any
        LatLngLiteral: { lat: number; lng: number }
        SymbolPath: any
        InfoWindow: any
        Geocoder: any
        DirectionsService: any
        DistanceMatrixService: any
      }
    }
    googleMapsInitialized?: boolean
    [key: string]: any
  }
}

// Google Places API types
export interface GooglePlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
  terms: Array<{
    offset: number
    value: string
  }>
  types: string[]
}

export interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry?: {
    location: {
      lat(): number
      lng(): number
    }
    viewport?: any
  }
  types: string[]
  rating?: number
  photos?: any[]
  opening_hours?: any
  website?: string
  formatted_phone_number?: string
}

// Google Geocoder API types
export interface GoogleGeocoderResult {
  formatted_address: string
  geometry: {
    location: {
      lat(): number
      lng(): number
    }
    location_type: string
    viewport: any
    bounds?: any
  }
  place_id: string
  types: string[]
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

export interface GoogleGeocoderStatus {
  OK: string
  ZERO_RESULTS: string
  OVER_QUERY_LIMIT: string
  REQUEST_DENIED: string
  INVALID_REQUEST: string
  UNKNOWN_ERROR: string
}

export interface GooglePlacesServiceStatus {
  OK: string
  ZERO_RESULTS: string
  OVER_QUERY_LIMIT: string
  REQUEST_DENIED: string
  INVALID_REQUEST: string
  NOT_FOUND: string
}

export {}