import { NextApiRequest, NextApiResponse } from 'next'
import { LeadFinderService } from '../../src/services/leadFinderService'
import { LeadData, SearchParams } from '../../src/types'

interface SearchProgress {
  type: 'status' | 'result' | 'error' | 'stopped'
  message?: string
  data?: LeadData
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const params: SearchParams = req.body
  const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Validate required parameters
  if (!params.keywords || !params.targetTitles || !params.selectedLocation) {
    return res.status(400).json({ message: 'Missing required parameters' })
  }

  // Get API keys from headers (sent from client)
  const googleMapsApiKey = req.headers['x-google-maps-key'] as string
  const openAiApiKey = req.headers['x-openai-key'] as string
  const rocketScrapeApiKey = req.headers['x-rocketscrape-key'] as string

  console.log('🔍 API Keys check:', {
    googleMaps: !!googleMapsApiKey,
    openAi: !!openAiApiKey,
    rocketScrape: !!rocketScrapeApiKey,
    rocketScrapeKey: rocketScrapeApiKey ? rocketScrapeApiKey.substring(0, 8) + '...' : 'not provided'
  })

  if (!googleMapsApiKey || !openAiApiKey) {
    return res.status(500).json({
      message: 'Server configuration error: Missing required API keys (Google Maps and OpenAI are required)'
    })
  }

  // Set RocketScrape API key in environment for the service to use
  if (rocketScrapeApiKey) {
    process.env.ROCKETSCRAPE_API_KEY = rocketScrapeApiKey
    console.log('🚀 RocketScrape API key set for this request')
  } else {
    console.log('⚠️ No RocketScrape API key provided, will use fallback methods')
  }

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const sendStatus = (message: string) => {
    res.write(`data: ${JSON.stringify({ type: 'status', message })}\n\n`)
  }

  const sendResult = (data: LeadData) => {
    res.write(`data: ${JSON.stringify({ type: 'result', data })}\n\n`)
  }

  const sendError = (message: string) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
  }

  console.log('🚀 Starting REAL search with LeadFinderService', {
    searchId,
    searchParams: params,
    hasGoogleMapsKey: !!googleMapsApiKey,
    hasOpenAiKey: !!openAiApiKey,
    hasRocketScrapeKey: !!rocketScrapeApiKey,
    rocketScrapeEnabled: !!rocketScrapeApiKey
  })

  try {
    const rocketScrapeStatus = rocketScrapeApiKey ? 'RocketScrape REAL API' : 'Basic Scraping Fallback'
    sendStatus(`🚀 เริ่มต้นการค้นหาด้วย AI และ ${rocketScrapeStatus}...`)

    // Initialize LeadFinderService with REAL APIs
    const leadFinder = new LeadFinderService(
      googleMapsApiKey,
      openAiApiKey,
      (progress: SearchProgress) => {
        console.log('📝 Search progress:', progress)
        if (progress.type === 'status' && progress.message) {
          sendStatus(progress.message)
        } else if (progress.type === 'result' && progress.data) {
          sendResult(progress.data)
        } else if (progress.type === 'error' && progress.message) {
          sendError(progress.message)
        }
      }
    )

    console.log('🎯 LeadFinderService initialized, starting search...')
    sendStatus('🎯 ระบบ AI เตรียมพร้อม เริ่มการค้นหา...')

    // Execute the REAL search with RocketScrape
    const results = await leadFinder.findLeads(params)

    console.log('✅ Search completed successfully', {
      searchId,
      totalResults: results.length,
      resultsWithEmail: results.filter(r => r.email !== 'none').length,
      resultsWithPhone: results.filter(r => r.phone !== 'N/A').length,
      rocketScrapeResults: results.filter(r => r.searchPhase.includes('RocketScrape')).length,
      basicScrapingResults: results.filter(r => r.searchPhase.includes('Basic')).length,
      rocketScrapeUsed: !!rocketScrapeApiKey
    })

    const finalStatus = rocketScrapeApiKey 
      ? `🎉 ค้นหาเสร็จสิ้นด้วย RocketScrape REAL API พบผลลัพธ์ ${results.length} รายการ`
      : `🎉 ค้นหาเสร็จสิ้นแบบพื้นฐาน พบผลลัพธ์ ${results.length} รายการ`

    sendStatus(finalStatus)
    res.write('data: [DONE]\n\n')
    res.end()

  } catch (error) {
    console.error('❌ Fatal error in search process:', error)
    sendError('เกิดข้อผิดพลาดในการประมวลผล: ' + (error as Error).message)
    res.write('data: [DONE]\n\n')
    res.end()
  }
}