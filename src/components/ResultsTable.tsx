import { FiDownload, FiMail, FiPhone, FiUser, FiExternalLink, FiEye } from 'react-icons/fi'
import { LeadData } from '../types'
import { downloadCSV } from '../utils/csvExport'

interface ResultsTableProps {
  results: LeadData[]
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const csvHeaders = [
    { label: 'ชื่อบริษัท', key: 'companyName' },
    { label: 'ชื่อผู้ติดต่อ', key: 'leadName' },
    { label: 'ตำแหน่ง', key: 'leadTitle' },
    { label: 'อีเมล', key: 'email' },
    { label: 'เบอร์โทร', key: 'phone' },
    { label: 'ขั้นตอนการค้นหา', key: 'searchPhase' },
    { label: 'Target URL', key: 'targetUrl' },
    { label: 'Step', key: 'searchStep' }
  ]

  const handleDownloadCSV = () => {
    downloadCSV(results, csvHeaders, 'enhanced-leads.csv')
  }

  const getPhaseColor = (phase: string) => {
    if (phase.includes('Step 1')) return 'bg-blue-100 text-blue-800'
    if (phase.includes('Step 2')) return 'bg-green-100 text-green-800'
    if (phase.includes('Step 3')) return 'bg-purple-100 text-purple-800'
    if (phase.includes('Error')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPhaseIcon = (phase: string) => {
    if (phase.includes('Step 1')) return '🏛️'
    if (phase.includes('Step 2')) return '📞'
    if (phase.includes('Step 3')) return '👤'
    if (phase.includes('Error')) return '❌'
    return '📋'
  }

  const getStepColor = (step: number) => {
    switch (step) {
      case 1: return 'bg-blue-500 text-white'
      case 2: return 'bg-green-500 text-white'
      case 3: return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Group results by company for better visualization
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.companyName]) {
      acc[result.companyName] = []
    }
    acc[result.companyName].push(result)
    return acc
  }, {} as Record<string, LeadData[]>)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            ผลการค้นหาแบบ 3 ขั้นตอน ({results.length} รายการ)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            จากทั้งหมด {Object.keys(groupedResults).length} บริษัท
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md"
        >
          <FiDownload />
          ดาวน์โหลด CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                บริษัท / ผู้ติดต่อ
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ตำแหน่ง
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ข้อมูลติดต่อ
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ขั้นตอน
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                แหล่งข้อมูล
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedResults).map(([companyName, companyResults], companyIndex) => (
              companyResults.map((result, resultIndex) => (
                <tr
                  key={`${companyIndex}-${resultIndex}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {resultIndex === 0 && (
                        <div className="flex items-center mb-2">
                          <FiUser className="text-blue-600 mr-2" />
                          <span className="text-sm font-bold text-gray-900">
                            {companyName}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {companyResults.length} รายการ
                          </span>
                        </div>
                      )}
                      <div className="ml-6">
                        <span className="text-sm font-medium text-gray-900">
                          {result.leadName}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.leadTitle}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {result.email !== 'none' ? (
                        <div className="flex items-center text-sm">
                          <FiMail className="text-green-600 mr-2" />
                          <a
                            href={`mailto:${result.email}`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {result.email}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500">
                          <FiMail className="text-gray-400 mr-2" />
                          ไม่พบอีเมล
                        </div>
                      )}
                      
                      {result.phone !== 'N/A' ? (
                        <div className="flex items-center text-sm">
                          <FiPhone className="text-green-600 mr-2" />
                          <span className="text-gray-900">{result.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500">
                          <FiPhone className="text-gray-400 mr-2" />
                          ไม่พบเบอร์โทร
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStepColor(result.searchStep)}`}>
                        {result.searchStep}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(result.searchPhase)}`}>
                        <span className="mr-1">{getPhaseIcon(result.searchPhase)}</span>
                        {result.searchPhase.replace('Step ', 'ขั้นตอน ').replace(': ', ': ')}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {result.targetUrl !== 'N/A' ? (
                      <a
                        href={result.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        ตรวจสอบแหล่งข้อมูล
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">ไม่มี URL</span>
                    )}
                    
                    {result.targetUrl !== 'N/A' && (
                      <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                        {result.targetUrl}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Search Process Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">🔍 กระบวนการค้นหา 3 ขั้นตอน:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500 text-white font-medium">1</span>
              <span className="font-semibold text-blue-800">🏛️ DBD Directors</span>
            </div>
            <p className="text-gray-600">
              ค้นหากรรมการ/ผู้ถือหุ้นจากกรมพัฒนาธุรกิจการค้า (เฉพาะบริษัท)
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500 text-white font-medium">2</span>
              <span className="font-semibold text-green-800">📞 General Business</span>
            </div>
            <p className="text-gray-600">
              ค้นหาข้อมูลติดต่อทั่วไปของธุรกิจผ่าน Google Search และ Website Scraping
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-500 text-white font-medium">3</span>
              <span className="font-semibold text-purple-800">👤 Person-Specific</span>
            </div>
            <p className="text-gray-600">
              ค้นหาข้อมูลติดต่อเฉพาะบุคคลโดยใช้ชื่อจากขั้นตอนที่ 1 และ 2
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FiEye className="text-yellow-600" />
            <span className="font-semibold text-yellow-800">การตรวจสอบความถูกต้อง:</span>
          </div>
          <p className="text-sm text-yellow-700">
            ใช้ <strong>Target URL</strong> เพื่อตรวจสอบว่าข้อมูลที่ได้มาจริงๆ เกี่ยวข้องกับธุรกิจหรือไม่ โดยคลิกลิงก์ &quot;ตรวจสอบแหล่งข้อมูล&quot; เพื่อดูหน้าเว็บต้นทาง
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResultsTable