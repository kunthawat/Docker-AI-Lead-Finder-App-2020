import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiFileText, FiRefreshCw, FiFilter, FiDownload, FiSearch, FiEye, FiLink, FiClock, FiGlobe } from 'react-icons/fi'

interface URLLog {
  url: string
  method: string
  status?: number
  responseTime?: number
  purpose: string
}

interface EnhancedSearchLog {
  id: string
  searchId: string
  companyName: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  urlLogs?: URLLog[]
  details?: any
  timestamp: string
}

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  searchId?: string
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, searchId }) => {
  const [logs, setLogs] = useState<EnhancedSearchLog[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all')
  const [companyFilter, setCompanyFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showUrlDetails, setShowUrlDetails] = useState<{ [key: string]: boolean }>({})

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      // Get real logs from localStorage (for real implementation, this would be from Supabase)
      const storedLogs = localStorage.getItem('searchLogs')
      let allLogs: EnhancedSearchLog[] = []

      if (storedLogs) {
        allLogs = JSON.parse(storedLogs)
      }

      // Add some realistic mock logs if empty
      if (allLogs.length === 0) {
        const mockLogs: EnhancedSearchLog[] = [
          {
            id: '1',
            searchId: searchId || 'search_123',
            companyName: 'ร้านอาหารทดสอบ',
            level: 'info',
            message: '🚀 RocketScrape: Starting Google search for: "ร้านอาหารทดสอบ ติดต่อ email"',
            urlLogs: [
              {
                url: 'https://api.rocketscrape.com/v1/search',
                method: 'POST',
                status: 200,
                responseTime: 1250,
                purpose: 'RocketScrape Google Search API'
              }
            ],
            details: {
              query: 'ร้านอาหารทดสอบ ติดต่อ email',
              numResults: 10,
              country: 'TH',
              language: 'th'
            },
            timestamp: new Date(Date.now() - 5000).toISOString()
          },
          {
            id: '2',
            searchId: searchId || 'search_123',
            companyName: 'ร้านอาหารทดสอบ',
            level: 'info',
            message: '🚀 RocketScrape success: 8 results in 1250ms',
            urlLogs: [
              {
                url: 'https://www.foodpanda.co.th/restaurant/test-restaurant',
                method: 'GET',
                status: 200,
                responseTime: 890,
                purpose: 'Search Result URL #1 - Food Delivery'
              },
              {
                url: 'https://www.facebook.com/testrestaurant',
                method: 'GET',
                status: 200,
                responseTime: 450,
                purpose: 'Search Result URL #2 - Facebook Page'
              },
              {
                url: 'https://www.wongnai.com/restaurants/test-restaurant',
                method: 'GET',
                status: 200,
                responseTime: 670,
                purpose: 'Search Result URL #3 - Wongnai Review'
              }
            ],
            details: {
              resultsFound: 8,
              emailsExtracted: ['order@testrestaurant.com', 'info@testrestaurant.com'],
              phonesExtracted: ['02-123-4567', '081-234-5678'],
              namesExtracted: ['คุณสมชาย เจ้าของร้าน', 'นางสาวสมฤทัย ผู้จัดการ']
            },
            timestamp: new Date(Date.now() - 4000).toISOString()
          },
          {
            id: '3',
            searchId: searchId || 'search_123',
            companyName: 'ร้านอาหารทดสอบ',
            level: 'debug',
            message: 'AI extraction completed with high confidence',
            urlLogs: [
              {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                status: 200,
                responseTime: 2100,
                purpose: 'OpenAI GPT-3.5-turbo extraction'
              }
            ],
            details: {
              extractedLead: {
                name: 'คุณสมชาย เจ้าของร้าน',
                title: 'เจ้าของร้าน',
                email: 'order@testrestaurant.com',
                phone: '02-123-4567',
                confidence: 85
              },
              textAnalyzed: 1250,
              processingTime: '2.1s'
            },
            timestamp: new Date(Date.now() - 3000).toISOString()
          },
          {
            id: '4',
            searchId: searchId || 'search_123',
            companyName: 'ร้านกาแฟ ABC',
            level: 'info',
            message: '🚀 RocketScrape business contact search completed',
            urlLogs: [
              {
                url: 'https://api.rocketscrape.com/v1/search',
                method: 'POST',
                status: 200,
                responseTime: 1800,
                purpose: 'RocketScrape Business Search'
              },
              {
                url: 'https://www.instagram.com/abccoffee',
                method: 'GET',
                status: 200,
                responseTime: 750,
                purpose: 'Search Result URL - Instagram'
              },
              {
                url: 'https://www.grab.com/th/food/abc-coffee',
                method: 'GET',
                status: 200,
                responseTime: 520,
                purpose: 'Search Result URL - Grab Food'
              }
            ],
            details: {
              searchQuery: '"ร้านกาแฟ ABC" ติดต่อ email โทรศัพท์',
              contactsFound: 3,
              extractedData: {
                emails: ['hello@abccoffee.com'],
                phones: ['089-987-6543'],
                websites: ['https://www.abccoffee.com']
              }
            },
            timestamp: new Date(Date.now() - 2000).toISOString()
          },
          {
            id: '5',
            searchId: searchId || 'search_123',
            companyName: 'คลินิกทดสอบ',
            level: 'warning',
            message: 'RocketScrape rate limit reached, switching to fallback mode',
            urlLogs: [
              {
                url: 'https://api.rocketscrape.com/v1/search',
                method: 'POST',
                status: 429,
                responseTime: 500,
                purpose: 'RocketScrape Rate Limited Request'
              },
              {
                url: 'https://www.google.com/search?q=คลินิกทดสอบ+ติดต่อ',
                method: 'GET',
                status: 200,
                responseTime: 1200,
                purpose: 'Fallback Google Search'
              }
            ],
            details: {
              rateLimitInfo: {
                remaining: 0,
                resetTime: '2024-01-20T15:30:00Z'
              },
              fallbackMode: true
            },
            timestamp: new Date(Date.now() - 1000).toISOString()
          }
        ]

        allLogs = mockLogs
        localStorage.setItem('searchLogs', JSON.stringify(mockLogs))
      }

      // Sort by timestamp (LATEST FIRST - FIXED!)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setLogs(allLogs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [searchId])

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen, fetchLogs])

  // Auto-refresh when searching
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh && isOpen) {
      interval = setInterval(fetchLogs, 3000) // Refresh every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, isOpen, fetchLogs])

  const filteredLogs = logs.filter(log => {
    const levelMatch = filter === 'all' || log.level === filter
    const companyMatch = !companyFilter || log.companyName.toLowerCase().includes(companyFilter.toLowerCase())
    const searchMatch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.urlLogs && log.urlLogs.some(url => url.url.toLowerCase().includes(searchTerm.toLowerCase())))
    
    return levelMatch && companyMatch && searchMatch
  })

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return '📋'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'debug': return '🔍'
      default: return '📝'
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Time', 'Company', 'Level', 'Message', 'URLs', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.companyName,
        log.level,
        `"${log.message}"`,
        log.urlLogs ? `"${log.urlLogs.map(u => u.url).join(';')}"` : '',
        log.details ? `"${JSON.stringify(log.details)}"` : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Fix the Set iteration issue
  const getUniqueCompanies = () => {
    const companySet = new Set(logs.map(log => log.companyName))
    return Array.from(companySet).filter(Boolean)
  }

  const uniqueCompanies = getUniqueCompanies()

  const toggleUrlDetails = (logId: string) => {
    setShowUrlDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }))
  }

  const formatDetails = (details: any) => {
    try {
      return JSON.stringify(details, null, 2)
    } catch {
      return String(details)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiFileText className="text-2xl" />
                  <div>
                    <h2 className="text-2xl font-bold">🚀 RocketScrape Search Logs</h2>
                    <p className="text-indigo-100">
                      {searchId ? `Search ID: ${searchId}` : 'Recent Search Logs (Latest First)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="flex items-center gap-2">
                  <FiFilter className="text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="info">📋 Info</option>
                    <option value="debug">🔍 Debug</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="error">❌ Error</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Companies</option>
                    {uniqueCompanies.map(company => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <FiSearch className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search in logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={fetchLogs}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefresh
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiEye className={autoRefresh ? 'animate-pulse' : ''} />
                  {autoRefresh ? 'Live' : 'Manual'}
                </button>

                <button
                  onClick={exportLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload />
                  Export CSV
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {logs.length} logs (sorted: latest first)
                {autoRefresh && <span className="ml-2 text-green-600">• Auto-refreshing every 3s</span>}
              </div>
            </div>

            {/* Logs Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-3">
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border-l-4 ${getLogColor(log.level)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getLogIcon(log.level)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium uppercase tracking-wide">
                              {log.level}
                            </span>
                            <span className="text-xs text-gray-500">
                              <FiClock className="inline w-3 h-3 mr-1" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            {log.companyName && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {log.companyName}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {log.message}
                          </p>

                          {/* URL Logs Section */}
                          {log.urlLogs && log.urlLogs.length > 0 && (
                            <div className="mb-2">
                              <button
                                onClick={() => toggleUrlDetails(log.id)}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <FiGlobe className="w-4 h-4" />
                                {log.urlLogs.length} URL{log.urlLogs.length > 1 ? 's' : ''} tracked
                                <FiLink className="w-3 h-3" />
                              </button>

                              {showUrlDetails[log.id] && (
                                <div className="mt-2 space-y-2">
                                  {log.urlLogs.map((urlLog, urlIndex) => (
                                    <div key={urlIndex} className="bg-white border rounded-lg p-3 text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700">{urlLog.purpose}</span>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            urlLog.method === 'GET'
                                              ? 'bg-green-100 text-green-700'
                                              : urlLog.method === 'POST'
                                              ? 'bg-blue-100 text-blue-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {urlLog.method}
                                          </span>
                                          {urlLog.status && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                              urlLog.status < 300
                                                ? 'bg-green-100 text-green-700'
                                                : urlLog.status < 400
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                              {urlLog.status}
                                            </span>
                                          )}
                                          {urlLog.responseTime && (
                                            <span className="text-gray-500">
                                              {urlLog.responseTime}ms
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="bg-gray-50 p-2 rounded font-mono text-xs break-all">
                                        <a
                                          href={urlLog.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {urlLog.url}
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Details Section */}
                          {log.details && (
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer hover:text-gray-800 font-medium">
                                📋 Show Technical Details
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto border">
                                {formatDetails(log.details)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm || companyFilter || filter !== 'all'
                      ? 'No logs match the current filters'
                      : 'No logs available'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LogModal