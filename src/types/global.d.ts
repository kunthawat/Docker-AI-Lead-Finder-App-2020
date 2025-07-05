// Global type definitions for window object extensions
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
        places: any
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
    [key: string]: any // Allow dynamic properties on window
  }
}

export {}