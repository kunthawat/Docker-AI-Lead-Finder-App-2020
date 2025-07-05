import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FiMapPin, FiMap, FiAlertCircle, FiSettings, FiSearch, FiNavigation, FiLoader, FiTarget, FiCrosshair } from 'react-icons/fi'
import { GooglePlacePrediction, GooglePlaceResult, GoogleGeocoderResult } from '../types/google-maps'

interface MapComponentProps {
  selectedLocation: { lat: number; lng: number } | null
  onMapClick: (lat: number, lng: number) => void
}

const MapComponent: React.FC<MapComponentProps> = ({ selectedLocation, onMapClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const searchBoxRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error' | 'no-api'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<GooglePlacePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Bangkok center coordinates - moved outside useCallback to avoid dependency issues
  const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 }

  // Check if Google Maps is already loaded
  const isGoogleMapsLoaded = useCallback(() => {
    return typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Map
  }, [])

  // Test API key validity
  const testApiKey = useCallback(async (apiKey: string) => {
    try {
      if (!apiKey || apiKey.length < 20) {
        setApiKeyValid(false)
        setErrorMessage('API Key ไม่ถูกต้อง')
        return false
      }
      setApiKeyValid(true)
      return true
    } catch (error) {
      setApiKeyValid(false)
      setErrorMessage('ไม่สามารถตรวจสอบ API Key ได้')
      return false
    }
  }, [])

  // Initialize Google Maps
  const initializeGoogleMap = useCallback(() => {
    console.log('🗺️ Initializing Google Maps...')
    
    if (!mapContainerRef.current) {
      console.log('❌ Map container not ready')
      return false
    }

    if (!isGoogleMapsLoaded()) {
      console.error('❌ Google Maps not loaded')
      setMapState('error')
      setErrorMessage('Google Maps ไม่ได้โหลด')
      return false
    }

    try {
      console.log('✅ Creating Google Maps instance...')
      
      // Create map instance with enhanced options
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      // Add click event listener
      map.addListener('click', (event: any) => {
        if (event.latLng) {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          console.log(`🎯 Map clicked at: ${lat}, ${lng}`)
          onMapClick(lat, lng)
        }
      })

      // Initialize search box with Places API
      if (window.google.maps.places && searchInputRef.current) {
        console.log('🔍 Initializing Places Search Box...')
        const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current)
        searchBoxRef.current = searchBox

        // Bias the SearchBox results towards current map's viewport
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds()!)
        })

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces()
          if (places && places.length > 0) {
            const place = places[0]
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              console.log(`📍 Place selected: ${place.name} at ${lat}, ${lng}`)
              map.setCenter({ lat, lng })
              map.setZoom(16)
              onMapClick(lat, lng)
              setSearchValue(place.name || '')
              setShowSuggestions(false)
            }
          }
        })

        // Initialize Autocomplete service for search suggestions
        const autocompleteService = new window.google.maps.places.AutocompleteService()
        
        // Handle input changes for suggestions with proper typing
        const handleSearchInput = (query: string) => {
          if (query.length > 2) {
            console.log(`🔍 Searching for suggestions: "${query}"`)
            autocompleteService.getPlacePredictions(
              {
                input: query,
                componentRestrictions: { country: 'th' }, // Thailand only
                types: ['establishment', 'geocode'],
                bounds: map.getBounds()
              },
              (predictions: GooglePlacePrediction[] | null, status: string) => {
                console.log(`📋 Autocomplete status: ${status}, results: ${predictions?.length || 0}`)
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                  setSearchSuggestions(predictions.slice(0, 8))
                  setShowSuggestions(true)
                } else {
                  setSearchSuggestions([])
                  setShowSuggestions(false)
                }
              }
            )
          } else {
            setSearchSuggestions([])
            setShowSuggestions(false)
          }
        }

        // Debounced search input handler
        let searchTimeout: NodeJS.Timeout
        const debouncedSearch = (query: string) => {
          clearTimeout(searchTimeout)
          searchTimeout = setTimeout(() => handleSearchInput(query), 300)
        }

        // Store the handler for cleanup
        ;(searchInputRef.current as any)._searchHandler = debouncedSearch
      }

      mapInstanceRef.current = map
      setMapState('ready')
      console.log('✅ Google Maps initialized successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to initialize Google Maps:', error)
      setErrorMessage('ไม่สามารถสร้างแผนที่ได้: ' + (error as Error).message)
      setMapState('error')
      return false
    }
  }, [onMapClick, isGoogleMapsLoaded, DEFAULT_CENTER])

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(async () => {
    const apiKey = localStorage.getItem('googleMapsApiKey')
    
    if (!apiKey) {
      console.log('⚠️ No Google Maps API key found, using fallback mode')
      setMapState('no-api')
      setErrorMessage('กรุณาใส่ Google Maps API Key ในการตั้งค่า')
      return
    }

    // Test API key
    console.log('🔑 Testing Google Maps API key...')
    const isValidKey = await testApiKey(apiKey)
    if (!isValidKey) {
      setMapState('error')
      return
    }

    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      console.log('✅ Google Maps already loaded, initializing...')
      setTimeout(() => initializeGoogleMap(), 100)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      console.log('⏳ Google Maps script already loading...')
      const checkLoaded = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkLoaded)
          setTimeout(() => initializeGoogleMap(), 100)
        }
      }, 500)
      
      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!isGoogleMapsLoaded()) {
          setMapState('error')
          setErrorMessage('Google Maps โหลดไม่สำเร็จ')
        }
      }, 15000)
      return
    }

    try {
      console.log('🌐 Loading Google Maps script...')
      const callbackName = `initMap_${Date.now()}`
      
      const callback = () => {
        console.log('✅ Google Maps script loaded via callback')
        setTimeout(() => initializeGoogleMap(), 100)
        delete (window as any)[callbackName]
      }
      
      ;(window as any)[callbackName] = callback

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&v=weekly`
      script.async = true
      script.defer = true
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script')
        setErrorMessage('ไม่สามารถโหลด Google Maps API ได้')
        setMapState('error')
      }
      
      document.head.appendChild(script)

      setTimeout(() => {
        if (mapState === 'loading') {
          console.log('⏰ Callback timeout, checking if Maps loaded...')
          if (isGoogleMapsLoaded()) {
            initializeGoogleMap()
          } else {
            setMapState('error')
            setErrorMessage('Google Maps โหลดไม่สำเร็จ (timeout)')
          }
        }
      }, 15000)

    } catch (error) {
      console.error('❌ Error loading Google Maps script:', error)
      setErrorMessage('เกิดข้อผิดพลาดในการโหลด Google Maps')
      setMapState('error')
    }
  }, [testApiKey, isGoogleMapsLoaded, initializeGoogleMap, mapState])

  // Handle marker updates
  const updateMarker = useCallback(() => {
    if (!mapInstanceRef.current || !isGoogleMapsLoaded() || !window.google?.maps) {
      return
    }

    try {
      // Remove existing marker
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null)
        markerInstanceRef.current = null
      }

      // Add new marker if location is selected
      if (selectedLocation && window.google.maps.Marker) {
        console.log(`📍 Adding marker at: ${selectedLocation.lat}, ${selectedLocation.lng}`)
        const marker = new window.google.maps.Marker({
          position: selectedLocation,
          map: mapInstanceRef.current,
          title: 'ตำแหน่งที่เลือก',
          animation: window.google.maps.Animation?.DROP,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }
        })

        markerInstanceRef.current = marker
        mapInstanceRef.current.setCenter(selectedLocation)
        mapInstanceRef.current.setZoom(15)
      }
    } catch (error) {
      console.error('❌ Error updating marker:', error)
    }
  }, [selectedLocation, isGoogleMapsLoaded])

  // Get current location with high accuracy
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
      return
    }

    console.log('📍 Getting current location...')
    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        console.log(`✅ Current location found: ${lat}, ${lng} (accuracy: ${position.coords.accuracy}m)`)
        
        onMapClick(lat, lng)
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(16)
        }
        setGettingLocation(false)
      },
      (error) => {
        console.error('❌ Error getting location:', error)
        let errorMessage = 'ไม่สามารถระบุตำแหน่งปัจจุบันได้'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้ในขณะนี้'
            break
          case error.TIMEOUT:
            errorMessage = 'หมดเวลาในการระบุตำแหน่ง กรุณาลองใหม่'
            break
        }
        
        alert(errorMessage)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [onMapClick])

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    
    // Call the debounced search handler if available
    if (searchInputRef.current && (searchInputRef.current as any)._searchHandler) {
      ;(searchInputRef.current as any)._searchHandler(value)
    }
  }

  // Handle suggestion click with proper typing
  const handleSuggestionClick = useCallback((suggestion: GooglePlacePrediction) => {
    if (!mapInstanceRef.current || !window.google?.maps?.places) return

    console.log(`🎯 Suggestion clicked: ${suggestion.description}`)
    setIsSearching(true)
    
    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)
    service.getDetails(
      { 
        placeId: suggestion.place_id,
        fields: ['name', 'geometry', 'formatted_address', 'place_id', 'types']
      },
      (place: GooglePlaceResult | null, status: string) => {
        setIsSearching(false)
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            console.log(`✅ Place details found: ${place.name} at ${lat}, ${lng}`)
            
            mapInstanceRef.current.setCenter({ lat, lng })
            mapInstanceRef.current.setZoom(16)
            onMapClick(lat, lng)
            setSearchValue(place.name || suggestion.description)
            setShowSuggestions(false)
          }
        } else {
          console.error('❌ Failed to get place details:', status)
          alert('ไม่สามารถค้นหาสถานที่ได้')
        }
      }
    )
  }, [onMapClick])

  // Enhanced location search with multiple methods
  const handleLocationSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return

    console.log(`🔍 Searching for location: "${searchValue}"`)
    setIsSearching(true)

    if (mapState === 'ready' && window.google?.maps?.places) {
      // Method 1: Try Places TextSearch first
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)
      
      service.textSearch(
        {
          query: searchValue,
          bounds: mapInstanceRef.current.getBounds(),
          region: 'th'
        },
        (results: GooglePlaceResult[] | null, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0]
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              console.log(`✅ Text search found: ${place.name} at ${lat}, ${lng}`)
              
              mapInstanceRef.current.setCenter({ lat, lng })
              mapInstanceRef.current.setZoom(16)
              onMapClick(lat, lng)
              setSearchValue(place.name || searchValue)
              setShowSuggestions(false)
              setIsSearching(false)
              return
            }
          }
          
          // Method 2: Fallback to Geocoding with proper typing
          console.log('🔄 Text search failed, trying geocoding...')
          const geocoder = new window.google.maps.Geocoder()
          
          geocoder.geocode(
            { 
              address: searchValue,
              region: 'th',
              componentRestrictions: { country: 'TH' }
            },
            (results: GoogleGeocoderResult[] | null, status: string) => {
              setIsSearching(false)
              
              if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location
                const lat = location.lat()
                const lng = location.lng()
                console.log(`✅ Geocoding found: ${results[0].formatted_address} at ${lat}, ${lng}`)
                
                mapInstanceRef.current.setCenter({ lat, lng })
                mapInstanceRef.current.setZoom(15)
                onMapClick(lat, lng)
                setSearchValue(results[0].formatted_address)
              } else {
                console.error('❌ All search methods failed')
                alert('ไม่พบสถานที่ที่ค้นหา กรุณาลองใช้ชื่อที่ชัดเจนขึ้น')
              }
            }
          )
        }
      )
    } else {
      // Fallback for no-api mode - simulate search near Bangkok
      setIsSearching(false)
      const lat = DEFAULT_CENTER.lat + (Math.random() - 0.5) * 0.1
      const lng = DEFAULT_CENTER.lng + (Math.random() - 0.5) * 0.1
      onMapClick(lat, lng)
      alert(`จำลองการค้นหา "${searchValue}" - ใช้ตำแหน่งใกล้เคียงกรุงเทพฯ`)
    }
    setShowSuggestions(false)
  }, [searchValue, mapState, onMapClick, DEFAULT_CENTER])

  // Handle fallback map click
  const handleFallbackClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const lat = DEFAULT_CENTER.lat + (y - rect.height / 2) * 0.0001
    const lng = DEFAULT_CENTER.lng + (x - rect.width / 2) * 0.0001
    console.log(`🎯 Fallback map clicked at: ${lat}, ${lng}`)
    onMapClick(lat, lng)
  }, [DEFAULT_CENTER, onMapClick])

  // Clear search and selection
  const clearSearch = () => {
    setSearchValue('')
    setShowSuggestions(false)
    onMapClick(0, 0) // Clear selection
  }

  // Initialize on component mount
  useEffect(() => {
    console.log('🗺️ MapComponent mounted, initializing...')
    const timer = setTimeout(() => {
      loadGoogleMapsScript()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (markerInstanceRef.current) {
        try {
          markerInstanceRef.current.setMap(null)
        } catch (e) {
          // Ignore cleanup errors
        }
        markerInstanceRef.current = null
      }
      mapInstanceRef.current = null
    }
  }, [loadGoogleMapsScript])

  // Update marker when location changes
  useEffect(() => {
    if (mapState === 'ready') {
      updateMarker()
    }
  }, [selectedLocation, mapState, updateMarker])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Render loading state
  if (mapState === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiMap className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">แผนที่</h2>
        </div>
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดแผนที่...</p>
            <p className="text-sm text-gray-500 mt-2">
              {apiKeyValid === null ? 'กำลังตรวจสอบ API Key...' : 'กำลังโหลด Google Maps...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render error or no-api state
  if (mapState === 'error' || mapState === 'no-api') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiMapPin className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">แผนที่</h2>
        </div>

        {/* Enhanced Search and Location Controls */}
        <div className="mb-4 space-y-3">
          <form onSubmit={handleLocationSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={handleSearchInputChange}
                placeholder="ค้นหาสถานที่, ที่อยู่, ธุรกิจ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSearching ? <FiLoader className="animate-spin" /> : <FiSearch />}
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          </form>
          
          <div className="flex gap-2">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {gettingLocation ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiCrosshair />
              )}
              {gettingLocation ? 'กำลังระบุตำแหน่ง...' : 'ตำแหน่งปัจจุบัน'}
            </button>
            
            <button
              onClick={() => {
                onMapClick(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FiTarget />
              <span className="hidden sm:inline">กรุงเทพฯ</span>
            </button>
          </div>
        </div>

        <div
          className="w-full h-96 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-red-100 transition-all duration-300"
          onClick={handleFallbackClick}
        >
          <div className="text-center p-8">
            <FiAlertCircle className="text-5xl text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              {mapState === 'no-api' ? 'โหมดแผนที่จำลอง' : 'เกิดข้อผิดพลาดกับแผนที่'}
            </h3>
            <p className="text-orange-700 mb-4">{errorMessage}</p>
            
            {mapState === 'no-api' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <FiSettings className="text-blue-600 mx-auto mb-2 text-xl" />
                <p className="text-sm text-blue-800 font-medium">
                  🔑 ต้องการใช้แผนที่จริง?
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ไปที่การตั้งค่า → ใส่ Google Maps API Key
                </p>
              </div>
            )}
            
            <div className="bg-orange-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800 font-medium">
                💡 คลิกที่ตำแหน่งใดๆ เพื่อเลือกพิกัด
              </p>
            </div>
            
            {selectedLocation && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  📍 ตำแหน่งที่เลือก:<br />
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render Google Maps
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiMap className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">แผนที่</h2>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
            Google Maps เชื่อมต่อแล้ว
          </span>
        </div>
      </div>

      {/* Enhanced Search and Location Controls */}
      <div className="mb-4 space-y-3">
        <form onSubmit={handleLocationSearch} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={handleSearchInputChange}
                placeholder="🔍 ค้นหาสถานที่, ที่อยู่, ธุรกิจ, ห้างสรรพสินค้า..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
              
              {/* Enhanced Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-20 mt-1 max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id || index}
                      className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-start gap-3">
                        <FiMapPin className="text-blue-500 text-sm mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.structured_formatting?.main_text || suggestion.description}
                          </div>
                          {suggestion.structured_formatting?.secondary_text && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 min-w-[100px]"
            >
              {isSearching ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span className="hidden sm:inline">ค้นหา...</span>
                </>
              ) : (
                <>
                  <FiSearch />
                  <span className="hidden sm:inline">ค้นหา</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {gettingLocation ? (
              <>
                <FiLoader className="animate-spin" />
                <span className="text-sm">กำลังระบุ...</span>
              </>
            ) : (
              <>
                <FiCrosshair />
                <span className="text-sm">ตำแหน่งปัจจุบัน</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(DEFAULT_CENTER)
                mapInstanceRef.current.setZoom(12)
              }
              onMapClick(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiTarget />
            <span className="text-sm">กรุงเทพฯ</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-inner"
          style={{ minHeight: '400px' }}
        />
        
        {selectedLocation && (
          <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  ✅ ตำแหน่งที่เลือกแล้ว
                </p>
                <p className="text-xs text-green-700">
                  📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                ล้างตำแหน่ง
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapComponent