import { FiLoader, FiCheck } from 'react-icons/fi'

interface StatusDisplayProps {
  status: string
  isSearching: boolean
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, isSearching }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 transition-all duration-300">
      <div className="flex items-center gap-3">
        {isSearching ? (
          <FiLoader className="text-2xl text-blue-600 animate-spin" />
        ) : (
          <FiCheck className="text-2xl text-green-600" />
        )}
        <p className="text-lg font-medium text-gray-800">{status}</p>
      </div>
      {isSearching && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full animate-pulse" 
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusDisplay