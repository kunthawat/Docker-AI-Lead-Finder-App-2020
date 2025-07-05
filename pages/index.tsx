import { useState, useCallback, useEffect } from 'react'
import { FiSettings, FiClock, FiAlertTriangle, FiFileText } from 'react-icons/fi'
import MapComponent from '../src/components/MapComponent'
import ResultsTable from '../src/components/ResultsTable'
import StatusDisplay from '../src/components/StatusDisplay'
import SearchForm from '../src/components/SearchForm'
import LeadHistoryModal from '../src/components/LeadHistoryModal'
import SettingsModal from '../src/components/SettingsModal'
import LogModal from '../src/components/LogModal'
import { LeadData, SearchParams } from '../src/types'

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keywords: '',
    targetTitles: 'ผู้จัดการ,เจ้าของ,ผู้อำนวยการ,กรรมการผู้จัดการ,ผู้บริหาร',
    selectedLocation: null,
    radius: 5, // in kilometers
    limit: 20 // default limit
  })

  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<LeadData[]>([])
  const [status, setStatus] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [currentSearchId, setCurrentSearchId] = useState<string | undefined>()
  const [apiStatus, setApiStatus] = useState({
    googleMaps: false,
    openAi: false,
    rocketScrape: false
  })

  // Check API keys on component mount and when settings change
  useEffect(() => {
    const checkApiKeys = () => {
      setApiStatus({
        googleMaps: !!localStorage.getItem('googleMapsApiKey'),
        openAi: !!localStorage.getItem('openAiApiKey'),
        rocketScrape: !!localStorage.getItem('rocketScrapeApiKey')
      })
    }

    checkApiKeys()
    // Check again when settings modal closes
    const interval = setInterval(checkApiKeys, 2000)
    return () => clearInterval(interval)
  }, [showSettings])

  const handleSearch = async () => {
    if (!searchParams.keywords || !searchParams.targetTitles || !searchParams.selectedLocation) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน และเลือกตำแหน่งบนแผนที่')
      return
    }

    // Check if required API keys are present
    const googleMapsApiKey = localStorage.getItem('googleMapsApiKey')
    const openAiApiKey = localStorage.getItem('openAiApiKey')
    const rocketScrapeApiKey = localStorage.getItem('rocketScrapeApiKey')

    if (!googleMapsApiKey || !openAiApiKey) {
      alert('กรุณาตั้งค่า Google Maps API Key และ OpenAI API Key ก่อนใช้งาน')
      setShowSettings(true)
      return
    }

    setIsSearching(true)
    setStatus('กำลังเตรียมการค้นหา...')
    setResults([])

    try {
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setCurrentSearchId(searchId)

      // Prepare headers with API keys for server-side access
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add API keys to headers so server can access them
      if (googleMapsApiKey) headers['x-google-maps-key'] = googleMapsApiKey
      if (openAiApiKey) headers['x-openai-key'] = openAiApiKey
      if (rocketScrapeApiKey) headers['x-rocketscrape-key'] = rocketScrapeApiKey

      console.log('🚀 Starting search with API keys:', {
        googleMaps: !!googleMapsApiKey,
        openAi: !!openAiApiKey,
        rocketScrape: !!rocketScrapeApiKey
      })

      const response = await fetch('/api/find-leads', {
        method: 'POST',
        headers,
        body: JSON.stringify(searchParams),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setStatus('ค้นหาเสร็จสิ้น')
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.type === 'status') {
                  setStatus(parsed.message)
                } else if (parsed.type === 'result') {
                  setResults(prev => [...prev, parsed.data])
                } else if (parsed.type === 'error') {
                  setStatus(`เกิดข้อผิดพลาด: ${parsed.message}`)
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSearching(false)
    }
  }

  const onMapClick = useCallback((lat: number, lng: number) => {
    // Handle clearing selection (when lat and lng are 0)
    if (lat === 0 && lng === 0) {
      setSearchParams(prev => ({ ...prev, selectedLocation: null }))
    } else {
      setSearchParams(prev => ({ ...prev, selectedLocation: { lat, lng } }))
    }
  }, [])

  const hasRequiredApiKeys = apiStatus.googleMaps && apiStatus.openAi

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Smart Lead Finder
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            ระบบค้นหาข้อมูลลูกค้าอัจฉริยะด้วย AI + RocketScrape (Real Data Only)
          </p>

          {/* API Status Bar */}
          <div className={`rounded-lg shadow-md p-4 mb-6 max-w-2xl mx-auto ${hasRequiredApiKeys ? 'bg-white' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
            <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiStatus.googleMaps ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-gray-700">
                  Google Maps: {apiStatus.googleMaps ? 'เชื่อมต่อแล้ว' : 'ไม่ได้ตั้งค่า'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiStatus.openAi ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-gray-700">
                  OpenAI: {apiStatus.openAi ? 'เชื่อมต่อแล้ว' : 'ไม่ได้ตั้งค่า'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiStatus.rocketScrape ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                <span className="text-gray-700">
                  🚀 RocketScrape: {apiStatus.rocketScrape ? 'เชื่อมต่อแล้ว' : 'ใช้โหมด Fallback'}
                </span>
              </div>
            </div>

            {!hasRequiredApiKeys && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span className="font-medium">จำเป็นต้องตั้งค่า Google Maps และ OpenAI API Keys</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1 text-center">
                  🚀 RocketScrape เป็นตัวเลือก - หากไม่มีจะใช้โหมด Basic Scraping
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FiClock />
              ประวัติการค้นหา
            </button>
            <button
              onClick={() => setShowLogs(true)}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FiFileText />
              ดูล็อก
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${
                hasRequiredApiKeys
                  ? 'bg-white text-gray-700'
                  : 'bg-yellow-500 text-white animate-pulse'
              }`}
            >
              <FiSettings />
              การตั้งค่า {!hasRequiredApiKeys && '(จำเป็น)'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="transition-all duration-300">
            <SearchForm
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          </div>

          <div className="transition-all duration-300">
            <MapComponent
              selectedLocation={searchParams.selectedLocation}
              onMapClick={onMapClick}
            />
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className="mb-8 transition-all duration-300">
            <StatusDisplay status={status} isSearching={isSearching} />
            {currentSearchId && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowLogs(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  ดูล็อกรายละเอียด (Search ID: {currentSearchId.substring(0, 8)}...)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="transition-all duration-300">
            <ResultsTable results={results} />
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <LogModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        searchId={currentSearchId}
      />
    </div>
  )
}