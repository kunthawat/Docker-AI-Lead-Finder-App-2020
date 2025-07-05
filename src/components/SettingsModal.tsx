import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSettings, FiKey, FiCheck, FiAlertCircle, FiLoader, FiExternalLink } from 'react-icons/fi'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    googleMapsApiKey: localStorage.getItem('googleMapsApiKey') || '',
    openAiApiKey: localStorage.getItem('openAiApiKey') || '',
    rocketScrapeApiKey: localStorage.getItem('rocketScrapeApiKey') || ''
  })

  const [testStatus, setTestStatus] = useState<{ [key: string]: 'idle' | 'testing' | 'success' | 'error' }>({})
  const [testMessages, setTestMessages] = useState<{ [key: string]: string }>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings when modal opens
    if (isOpen) {
      setSettings({
        googleMapsApiKey: localStorage.getItem('googleMapsApiKey') || '',
        openAiApiKey: localStorage.getItem('openAiApiKey') || '',
        rocketScrapeApiKey: localStorage.getItem('rocketScrapeApiKey') || ''
      })
      setSaved(false)
      setTestStatus({})
      setTestMessages({})
    }
  }, [isOpen])

  const testGoogleMapsKey = async () => {
    if (!settings.googleMapsApiKey) {
      setTestStatus(prev => ({ ...prev, googleMaps: 'error' }))
      setTestMessages(prev => ({ ...prev, googleMaps: 'กรุณาใส่ API Key ก่อน' }))
      return
    }

    setTestStatus(prev => ({ ...prev, googleMaps: 'testing' }))
    setTestMessages(prev => ({ ...prev, googleMaps: 'กำลังทดสอบ...' }))

    try {
      // Use CORS proxy for testing
      const proxyUrl = 'https://api.allorigins.win/raw?url='
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Bangkok&key=${settings.googleMapsApiKey}`
      const response = await fetch(proxyUrl + encodeURIComponent(testUrl))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status === 'OK') {
        setTestStatus(prev => ({ ...prev, googleMaps: 'success' }))
        setTestMessages(prev => ({ ...prev, googleMaps: 'API Key ใช้งานได้' }))
      } else if (data.status === 'REQUEST_DENIED') {
        setTestStatus(prev => ({ ...prev, googleMaps: 'error' }))
        setTestMessages(prev => ({ ...prev, googleMaps: 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์' }))
      } else {
        setTestStatus(prev => ({ ...prev, googleMaps: 'error' }))
        setTestMessages(prev => ({ ...prev, googleMaps: `API Error: ${data.status}` }))
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, googleMaps: 'error' }))
      setTestMessages(prev => ({ ...prev, googleMaps: 'เกิดข้อผิดพลาดในการทดสอบ' }))
    }
  }

  const testOpenAiKey = async () => {
    if (!settings.openAiApiKey) {
      setTestStatus(prev => ({ ...prev, openAi: 'error' }))
      setTestMessages(prev => ({ ...prev, openAi: 'กรุณาใส่ API Key ก่อน' }))
      return
    }

    setTestStatus(prev => ({ ...prev, openAi: 'testing' }))
    setTestMessages(prev => ({ ...prev, openAi: 'กำลังทดสอบ...' }))

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.openAiApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setTestStatus(prev => ({ ...prev, openAi: 'success' }))
        setTestMessages(prev => ({ ...prev, openAi: 'API Key ใช้งานได้' }))
      } else if (response.status === 401) {
        setTestStatus(prev => ({ ...prev, openAi: 'error' }))
        setTestMessages(prev => ({ ...prev, openAi: 'API Key ไม่ถูกต้อง' }))
      } else {
        setTestStatus(prev => ({ ...prev, openAi: 'error' }))
        setTestMessages(prev => ({ ...prev, openAi: 'เกิดข้อผิดพลาดในการทดสอบ' }))
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, openAi: 'error' }))
      setTestMessages(prev => ({ ...prev, openAi: 'เกิดข้อผิดพลาดในการทดสอบ' }))
    }
  }

  const testRocketScrapeKey = async () => {
    if (!settings.rocketScrapeApiKey) {
      setTestStatus(prev => ({ ...prev, rocketScrape: 'error' }))
      setTestMessages(prev => ({ ...prev, rocketScrape: 'กรุณาใส่ API Key ก่อน' }))
      return
    }

    setTestStatus(prev => ({ ...prev, rocketScrape: 'testing' }))
    setTestMessages(prev => ({ ...prev, rocketScrape: 'กำลังทดสอบ...' }))

    try {
      console.log('🚀 Testing RocketScrape API key...')
      
      const response = await fetch('https://api.rocketscrape.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.rocketScrapeApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test search',
          num_results: 1
        })
      })

      console.log('🚀 RocketScrape test response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🚀 RocketScrape test successful:', data)
        setTestStatus(prev => ({ ...prev, rocketScrape: 'success' }))
        setTestMessages(prev => ({ ...prev, rocketScrape: 'API Key ใช้งานได้ ✨' }))
      } else if (response.status === 401) {
        setTestStatus(prev => ({ ...prev, rocketScrape: 'error' }))
        setTestMessages(prev => ({ ...prev, rocketScrape: 'API Key ไม่ถูกต้อง' }))
      } else {
        const errorText = await response.text()
        console.error('🚀 RocketScrape test error:', errorText)
        setTestStatus(prev => ({ ...prev, rocketScrape: 'error' }))
        setTestMessages(prev => ({ ...prev, rocketScrape: `API Error: ${response.status}` }))
      }
    } catch (error) {
      console.error('🚀 RocketScrape test failed:', error)
      setTestStatus(prev => ({ ...prev, rocketScrape: 'error' }))
      setTestMessages(prev => ({ ...prev, rocketScrape: 'เกิดข้อผิดพลาดในการทดสอบ' }))
    }
  }

  const handleSave = () => {
    // Save to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      if (value.trim()) {
        localStorage.setItem(key, value.trim())
      } else {
        localStorage.removeItem(key)
      }
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    
    // Show success message
    alert('การตั้งค่าถูกบันทึกแล้ว! กรุณารีเฟรชหน้าเว็บเพื่อใช้งาน API Key ใหม่')
  }

  const handleReset = () => {
    if (confirm('คุณต้องการลบการตั้งค่าทั้งหมดหรือไม่?')) {
      Object.keys(settings).forEach(key => {
        localStorage.removeItem(key)
      })
      setSettings({
        googleMapsApiKey: '',
        openAiApiKey: '',
        rocketScrapeApiKey: ''
      })
      setTestStatus({})
      setTestMessages({})
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing': return <FiLoader className="text-blue-600 animate-spin" />
      case 'success': return <FiCheck className="text-green-600" />
      case 'error': return <FiAlertCircle className="text-red-600" />
      default: return null
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
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiSettings className="text-2xl" />
                  <h2 className="text-2xl font-bold">การตั้งค่า API</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Google Maps API */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FiKey className="inline mr-2" />
                      Google Maps API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testStatus.googleMaps)}
                      <button
                        onClick={testGoogleMapsKey}
                        disabled={!settings.googleMapsApiKey || testStatus.googleMaps === 'testing'}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        ทดสอบ
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={settings.googleMapsApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, googleMapsApiKey: e.target.value }))}
                    placeholder="AIzaSyC..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {testMessages.googleMaps && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${testStatus.googleMaps === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testMessages.googleMaps}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    สำหรับค้นหาบริษัทจาก Google Maps และแสดงแผนที่
                  </p>
                </div>

                {/* OpenAI API */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FiKey className="inline mr-2" />
                      OpenAI API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testStatus.openAi)}
                      <button
                        onClick={testOpenAiKey}
                        disabled={!settings.openAiApiKey || testStatus.openAi === 'testing'}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        ทดสอบ
                      </button>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={settings.openAiApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, openAiApiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {testMessages.openAi && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${testStatus.openAi === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testMessages.openAi}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    สำหรับแยกข้อมูลผู้ติดต่อด้วย AI (หากไม่มีจะใช้ข้อมูลจำลอง)
                  </p>
                </div>

                {/* RocketScrape API */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FiKey className="inline mr-2" />
                      🚀 RocketScrape API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testStatus.rocketScrape)}
                      <button
                        onClick={testRocketScrapeKey}
                        disabled={!settings.rocketScrapeApiKey || testStatus.rocketScrape === 'testing'}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        ทดสอบ
                      </button>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={settings.rocketScrapeApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, rocketScrapeApiKey: e.target.value }))}
                    placeholder="rs_..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {testMessages.rocketScrape && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${testStatus.rocketScrape === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testMessages.rocketScrape}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    🚀 สำหรับค้นหาข้อมูลจากเว็บไซต์แบบ Advanced (หากไม่มีจะใช้ข้อมูลจำลอง)
                  </p>
                </div>

                {/* Getting API Keys Guide */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">🔑 วิธีการขอ API Key:</h4>
                  <div className="text-sm text-yellow-700 space-y-3">
                    <div>
                      <strong>Google Maps API:</strong>
                      <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                        <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 mx-1">
                          Google Cloud Console <FiExternalLink className="w-3 h-3" />
                        </a></li>
                        <li>สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่</li>
                        <li>เปิดใช้งาน Maps JavaScript API</li>
                        <li>สร้าง API Key ใน Credentials</li>
                        <li>จำกัดการใช้งานเฉพาะ Maps JavaScript API</li>
                      </ol>
                    </div>
                    <div>
                      <strong>OpenAI API:</strong>
                      <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                        <li>ไปที่ <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 mx-1">
                          OpenAI Platform <FiExternalLink className="w-3 h-3" />
                        </a></li>
                        <li>สร้างบัญชีหรือเข้าสู่ระบบ</li>
                        <li>ไปที่ API Keys และสร้าง Key ใหม่</li>
                        <li>เติมเครดิตในบัญชีเพื่อใช้งาน</li>
                      </ol>
                    </div>
                    <div>
                      <strong>🚀 RocketScrape API:</strong>
                      <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                        <li>ไปที่ <a href="https://rocketscrape.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 mx-1">
                          RocketScrape <FiExternalLink className="w-3 h-3" />
                        </a></li>
                        <li>สร้างบัญชีและเลือกแพ็คเกจ</li>
                        <li>รับ API Key จากแดชบอร์ด</li>
                        <li><strong>ข้อดี:</strong> ค้นหาข้อมูลได้แม่นยำและรวดเร็วกว่า</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Enhanced Current Status */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">สถานะปัจจุบัน:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Google Maps:</span>
                      <span className={`flex items-center gap-1 ${settings.googleMapsApiKey ? 'text-green-600' : 'text-orange-600'}`}>
                        {settings.googleMapsApiKey ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            กำหนดค่าแล้ว
                          </>
                        ) : (
                          <>
                            <FiAlertCircle className="w-3 h-3" />
                            ใช้โหมดจำลอง
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>OpenAI:</span>
                      <span className={`flex items-center gap-1 ${settings.openAiApiKey ? 'text-green-600' : 'text-orange-600'}`}>
                        {settings.openAiApiKey ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            กำหนดค่าแล้ว
                          </>
                        ) : (
                          <>
                            <FiAlertCircle className="w-3 h-3" />
                            ใช้โหมดจำลอง
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🚀 RocketScrape:</span>
                      <span className={`flex items-center gap-1 ${settings.rocketScrapeApiKey ? 'text-green-600' : 'text-orange-600'}`}>
                        {settings.rocketScrapeApiKey ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            กำหนดค่าแล้ว (Advanced Mode)
                          </>
                        ) : (
                          <>
                            <FiAlertCircle className="w-3 h-3" />
                            ใช้โหมด Fallback
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🚀 ข้อมูลเพิ่มเติม:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• การตั้งค่าจะถูกเก็บไว้ในเบราว์เซอร์ของคุณ</li>
                    <li>• <strong>RocketScrape</strong> ช่วยเพิ่มความแม่นยำในการค้นหาข้อมูล</li>
                    <li>• หากไม่มี RocketScrape จะใช้โหมด Fallback อัตโนมัติ</li>
                    <li>• ข้อมูล API Key จะไม่ถูกส่งไปยังเซิร์ฟเวอร์</li>
                    <li>• Google Maps API Key จำเป็นสำหรับแผนที่จริง</li>
                    <li>• รีเฟรชหน้าเว็บหลังบันทึกเพื่อใช้งาน API Key ใหม่</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                รีเซ็ตการตั้งค่า
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    saved
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SettingsModal