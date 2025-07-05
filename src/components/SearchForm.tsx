import { FiSearch, FiMapPin, FiEdit3, FiSettings, FiStopCircle } from 'react-icons/fi'
import { SearchParams } from '../types'

interface SearchFormProps {
  searchParams: SearchParams
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>
  onSearch: () => void
  onStop?: () => void
  isSearching: boolean
}

const SearchForm: React.FC<SearchFormProps> = ({
  searchParams,
  setSearchParams,
  onSearch,
  onStop,
  isSearching
}) => {
  const limitOptions = [10, 20, 50, 100]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <FiSearch className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">
          ค้นหาข้อมูลลูกค้า
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำค้นหา (ประเภทธุรกิจ)
          </label>
          <input
            type="text"
            value={searchParams.keywords}
            onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
            placeholder="เช่น ร้านอาหาร,โรงแรม,คลินิก"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isSearching}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <FiEdit3 className="text-blue-600" />
              ตำแหน่งที่ต้องการ
            </div>
          </label>
          <textarea
            value={searchParams.targetTitles}
            onChange={(e) => setSearchParams(prev => ({ ...prev, targetTitles: e.target.value }))}
            placeholder="เช่น ผู้จัดการ,เจ้าของ,ผู้อำนวยการ"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            disabled={isSearching}
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 ค่าเริ่มต้นเป็นตำแหน่งที่นิยม คุณสามารถเพิ่มเติมหรือแก้ไขได้ตามต้องการ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รัศมีการค้นหา (กิโลเมตร)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={searchParams.radius}
                onChange={(e) => setSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isSearching}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                กม.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FiSettings className="text-blue-600" />
                จำนวนบริษัทที่ค้นหา
              </div>
            </label>
            <select
              value={searchParams.limit}
              onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isSearching}
            >
              {limitOptions.map(limit => (
                <option key={limit} value={limit}>
                  {limit} บริษัท
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ⚡ จำนวนมากขึ้น=ใช้เวลานานขึ้น แต่ได้ผลลัพธ์มากขึ้น
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiMapPin className="inline mr-2" />
            ตำแหน่งที่เลือก
          </label>
          {searchParams.selectedLocation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">ตำแหน่งถูกเลือกแล้ว</span>
              </div>
              <p className="text-sm text-green-600">
                📍 {searchParams.selectedLocation.lat.toFixed(6)}, {searchParams.selectedLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-green-500 mt-1">
                คลิกบนแผนที่อีกครั้งเพื่อเปลี่ยนตำแหน่ง
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-yellow-700">กรุณาเลือกตำแหน่ง</span>
              </div>
              <p className="text-sm text-yellow-600">
                📍 คลิกบนแผนที่เพื่อเลือกตำแหน่งที่ต้องการค้นหา
              </p>
            </div>
          )}
        </div>

        {/* Search and Stop Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSearch}
            disabled={isSearching}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-102"
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                กำลังค้นหา...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FiSearch className="text-xl" />
                เริ่มค้นหา ({searchParams.limit} บริษัท)
              </div>
            )}
          </button>

          {isSearching && onStop && (
            <button
              onClick={onStop}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg transform hover:scale-102"
            >
              <div className="flex items-center justify-center gap-2">
                <FiStopCircle className="text-xl" />
                หยุดการค้นหา
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchForm