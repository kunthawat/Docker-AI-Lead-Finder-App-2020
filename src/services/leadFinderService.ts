import { GoogleMapsService } from './googleMapsService'
import { WebScrapingService } from './webScrapingService'
import { AIService } from './aiService'
import { RocketScrapeService } from './rocketScrapeService'
import { LogService } from './logService'
import { LeadData, SearchParams } from '../types'
import supabase from '../lib/supabase'

export interface SearchProgress {
  type: 'status' | 'result' | 'error' | 'stopped'
  message?: string
  data?: LeadData
}

export class LeadFinderService {
  private googleMapsService: GoogleMapsService
  private webScrapingService: WebScrapingService
  private aiService: AIService
  private rocketScrapeService?: RocketScrapeService
  private logService: LogService
  private onProgress?: (progress: SearchProgress) => void
  private shouldStop = false
  private searchId: string

  constructor(
    googleMapsApiKey: string,
    openAiApiKey: string,
    onProgress?: (progress: SearchProgress) => void
  ) {
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key is required')
    }
    if (!openAiApiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.searchId = crypto.randomUUID()
    console.log('🚀 Initializing LeadFinderService with REAL APIs, Search ID:', this.searchId)

    this.googleMapsService = new GoogleMapsService(googleMapsApiKey)
    this.webScrapingService = new WebScrapingService()
    this.aiService = new AIService(openAiApiKey)
    this.logService = new LogService(this.searchId)
    this.onProgress = onProgress

    // Initialize RocketScrape with REAL API key check
    const rocketScrapeApiKey = this.getRocketScrapeApiKey()
    if (rocketScrapeApiKey) {
      console.log('🚀 RocketScrape API key found, initializing service')
      this.rocketScrapeService = new RocketScrapeService(rocketScrapeApiKey)
      this.testRocketScrapeConnection(rocketScrapeApiKey)
    } else {
      console.log('⚠️ RocketScrape API key not found, will use fallback methods')
    }
  }

  private getRocketScrapeApiKey(): string | null {
    // Check both environment variable and localStorage
    const envKey = process.env.ROCKETSCRAPE_API_KEY
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('rocketScrapeApiKey') : null
    const apiKey = envKey || localKey

    console.log('🔍 RocketScrape API Key check:', {
      envKey: !!envKey,
      localKey: !!localKey,
      finalKey: !!apiKey,
      keyPreview: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
    })

    return apiKey
  }

  private async testRocketScrapeConnection(apiKey: string): Promise<void> {
    try {
      console.log('🚀 Testing RocketScrape connection...')
      if (this.rocketScrapeService) {
        const testResult = await this.rocketScrapeService.testApiKey()
        if (testResult.valid) {
          console.log('✅ RocketScrape connection successful')
          await this.logService.info('🚀 RocketScrape API connection verified', {
            apiKeyValid: true,
            service: 'RocketScrape Real API'
          })
        } else {
          console.error('❌ RocketScrape API key invalid:', testResult.error)
          await this.logService.warning('🚀 RocketScrape API key invalid, falling back to basic scraping', {
            error: testResult.error
          })
          this.rocketScrapeService = undefined
        }
      }
    } catch (error) {
      console.error('❌ RocketScrape connection test failed:', error)
      await this.logService.error('🚀 RocketScrape connection test failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      this.rocketScrapeService = undefined
    }
  }

  getSearchId(): string {
    return this.searchId
  }

  stop() {
    this.shouldStop = true
    this.logService.info('🛑 Search stopped by user')
    this.emitProgress({
      type: 'stopped',
      message: 'การค้นหาถูกหยุดโดยผู้ใช้'
    })
  }

  /**
   * Determines if the search keyword is for companies (บริษัท) which should use DBD process
   */
  private isCompanySearch(keywords: string): boolean {
    const companyKeywords = [
      'บริษัท', 'company', 'corp', 'corporation', 'จำกัด', 'limited', 'ltd',
      'ห้างหุ้นส่วน', 'partnership', 'องค์กร', 'organization', 'สำนักงาน', 'office'
    ]
    const lowerKeywords = keywords.toLowerCase()
    return companyKeywords.some(keyword => lowerKeywords.includes(keyword))
  }

  async findLeads(params: SearchParams): Promise<LeadData[]> {
    console.log('🎯 Starting REAL lead search with RocketScrape integration')
    const isCompanySearch = this.isCompanySearch(params.keywords)

    await this.logService.info('🚀 Starting REAL lead search with RocketScrape integration', {
      searchId: this.searchId,
      searchParams: {
        keywords: params.keywords,
        targetTitles: params.targetTitles,
        location: params.selectedLocation,
        radius: params.radius,
        limit: params.limit
      },
      searchStrategy: {
        isCompanySearch: isCompanySearch,
        willUseDbd: isCompanySearch,
        phaseStrategy: isCompanySearch ? 'Phase 1 (DBD) → Phase 2 if needed' : 'Direct Phase 2',
        rocketScrapeEnabled: !!this.rocketScrapeService,
        rocketScrapeStatus: this.rocketScrapeService ? 'ACTIVE - REAL API' : 'DISABLED - Using Fallback'
      }
    })

    const results: LeadData[] = []

    try {
      // STEP 1: GOOGLE MAPS SEARCH
      await this.logService.info('📍 STEP 1: Searching places from Google Maps')
      this.emitProgress({
        type: 'status',
        message: 'กำลังค้นหาสถานที่จาก Google Maps...'
      })

      const companies = await this.googleMapsService.searchNearbyPlaces({
        keywords: params.keywords,
        location: params.selectedLocation!,
        radius: params.radius * 1000, // Convert km to meters
        limit: params.limit
      })

      await this.logService.info('📊 Google Maps search completed', {
        placesFound: companies.length,
        searchQuery: params.keywords,
        searchLocation: params.selectedLocation,
        searchRadius: params.radius,
        places: companies.map(c => ({
          name: c.name,
          address: c.formatted_address,
          rating: c.rating,
          types: c.types
        }))
      })

      if (companies.length === 0) {
        await this.logService.warning('⚠️ No places found in the specified area')
        this.emitProgress({
          type: 'status',
          message: 'ไม่พบสถานที่ในพื้นที่ที่กำหนด กรุณาลองเปลี่ยนคำค้นหาหรือขยายรัศมี'
        })
        return []
      }

      const rocketScrapeStatus = this.rocketScrapeService ? 'ด้วย RocketScrape (REAL API)' : 'แบบพื้นฐาน (Fallback)'
      this.emitProgress({
        type: 'status',
        message: `พบสธานที่ ${companies.length} แห่ง กำลังเริ่มค้นหาข้อมูลผู้ติดต่อ ${rocketScrapeStatus}...`
      })

      // STEP 2: PROCESS EACH PLACE WITH REAL ROCKETSCRAPE
      await this.logService.info('🚀 STEP 2: Starting place processing with RocketScrape', {
        totalPlaces: companies.length,
        targetTitles: params.targetTitles,
        searchStrategy: isCompanySearch ? 'Company search with DBD process' : 'General business search',
        rocketScrapeEnabled: !!this.rocketScrapeService,
        rocketScrapeStatus: this.rocketScrapeService ? 'ACTIVE - REAL API CALLS' : 'DISABLED - FALLBACK MODE'
      })

      for (let i = 0; i < companies.length; i++) {
        if (this.shouldStop) {
          await this.logService.info('🛑 Search stopped by user during place processing', {
            processedPlaces: i,
            totalPlaces: companies.length
          })
          break
        }

        const company = companies[i]
        this.logService.setCompanyName(company.name)

        const statusMessage = this.rocketScrapeService 
          ? `🚀 กำลังประมวลผล ${company.name} ด้วย RocketScrape REAL API (${i + 1}/${companies.length})`
          : `📞 กำลังประมวลผล ${company.name} แบบพื้นฐาน (${i + 1}/${companies.length})`

        this.emitProgress({
          type: 'status',
          message: statusMessage
        })

        await this.logService.info(`🏢 Processing place ${i + 1}/${companies.length}: ${company.name}`, {
          placeIndex: i + 1,
          placeDetails: {
            name: company.name,
            address: company.formatted_address,
            rating: company.rating,
            types: company.types,
            placeId: company.place_id
          },
          willUseDbd: isCompanySearch,
          rocketScrapeEnabled: !!this.rocketScrapeService,
          processingMethod: this.rocketScrapeService ? 'RocketScrape REAL API Enhanced' : 'Basic Scraping Fallback'
        })

        try {
          let leadData: any

          if (this.rocketScrapeService) {
            // Use REAL RocketScrape for enhanced search
            console.log(`🚀 Using REAL RocketScrape API for ${company.name}`)
            leadData = await this.processWithRealRocketScrape(company, params.targetTitles, isCompanySearch)
          } else {
            // Fallback to basic web scraping
            console.log(`⚠️ Using fallback basic scraping for ${company.name}`)
            leadData = await this.processWithBasicScraping(company, params.targetTitles, isCompanySearch)
          }

          const result: LeadData = {
            companyName: company.name,
            leadName: leadData.leadName,
            leadTitle: leadData.leadTitle,
            email: leadData.email,
            phone: leadData.phone,
            searchPhase: leadData.searchPhase,
            targetUrl: leadData.targetUrl || 'N/A',
            searchStep: leadData.searchStep || 1
          }

          await this.logService.info(`✅ Processing completed for ${company.name}`, {
            result: {
              leadName: result.leadName,
              leadTitle: result.leadTitle,
              email: result.email,
              phone: result.phone,
              searchPhase: result.searchPhase,
              targetUrl: result.targetUrl
            },
            rocketScrapeUsed: !!this.rocketScrapeService
          })

          results.push(result)
          this.emitProgress({
            type: 'result',
            data: result
          })

          await this.saveToSupabase(result, params)

        } catch (error) {
          await this.logService.error(`❌ Error processing place: ${company.name}`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            placeIndex: i + 1,
            totalPlaces: companies.length
          })

          // Create a basic result even if processing fails
          const result: LeadData = {
            companyName: company.name,
            leadName: 'N/A',
            leadTitle: 'N/A',
            email: 'none',
            phone: 'N/A',
            searchPhase: 'Error',
            targetUrl: 'N/A',
            searchStep: 0
          }

          results.push(result)
          this.emitProgress({
            type: 'result',
            data: result
          })
        }

        // Add delay between companies to avoid rate limits
        if (i < companies.length - 1 && !this.shouldStop) {
          await this.logService.debug('⏳ Waiting 2 seconds before next place')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // FINAL SUMMARY
      if (this.shouldStop) {
        await this.logService.info('🛑 Search completed (stopped by user)', {
          totalResults: results.length,
          processedPlaces: results.length,
          searchId: this.searchId
        })
        console.log(`🛑 Search stopped by user with ${results.length} results`)
      } else {
        await this.logService.info('🎉 Search completed successfully', {
          totalResults: results.length,
          processedPlaces: companies.length,
          searchId: this.searchId,
          summary: {
            rocketScrapeResults: results.filter(r => r.searchPhase.includes('RocketScrape')).length,
            basicScrapingResults: results.filter(r => r.searchPhase.includes('Basic')).length,
            errorResults: results.filter(r => r.searchPhase === 'Error').length,
            emailsFound: results.filter(r => r.email !== 'none').length,
            rocketScrapeUsed: !!this.rocketScrapeService
          }
        })

        const rocketScrapeUsed = this.rocketScrapeService ? 'with RocketScrape REAL API' : 'with Basic Scraping Fallback'
        console.log(`✅ Search completed ${rocketScrapeUsed} - ${results.length} results`)
        
        const finalMessage = this.rocketScrapeService 
          ? `🎉 ค้นหาเสร็จสิ้นด้วย RocketScrape REAL API พบผลลัพธ์ ${results.length} รายการ`
          : `🎉 ค้นหาเสร็จสิ้นแบบพื้นฐาน พบผลลัพธ์ ${results.length} รายการ`
        
        this.emitProgress({
          type: 'status',
          message: finalMessage
        })
      }

      return results

    } catch (error) {
      await this.logService.error('💥 Fatal error in lead finding process', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        searchId: this.searchId
      })

      console.error('❌ Error in lead finding process:', error)
      this.emitProgress({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการประมวลผล: ' + (error as Error).message
      })
      throw error
    }
  }

  /**
   * Process company using REAL RocketScrape
   */
  private async processWithRealRocketScrape(company: any, targetTitles: string, isCompanySearch: boolean): Promise<any> {
    if (!this.rocketScrapeService) {
      throw new Error('RocketScrape service not available')
    }

    await this.logService.info('🚀 Processing with REAL RocketScrape API', {
      companyName: company.name,
      isCompanySearch,
      strategy: isCompanySearch ? 'DBD + Business Search' : 'Business Search Only',
      apiStatus: 'REAL ROCKETSCRAPE API CALLS'
    })

    try {
      // REAL RocketScrape business search
      this.emitProgress({
        type: 'status',
        message: `🚀 ค้นหาข้อมูลติดต่อด้วย RocketScrape REAL API สำหรับ ${company.name}`
      })

      console.log(`🚀 Making REAL RocketScrape API call for business: ${company.name}`)
      const businessResults = await this.rocketScrapeService.searchBusiness(company.name, 'contact')

      await this.logService.info('🚀 REAL RocketScrape business search completed', {
        companyName: company.name,
        resultsFound: businessResults.results.length,
        searchTime: businessResults.search_time_ms,
        totalResults: businessResults.total_results,
        searchQuery: businessResults.search_query,
        apiCallStatus: 'SUCCESS - REAL API RESPONSE'
      })

      console.log(`🚀 REAL RocketScrape API response for ${company.name}:`, {
        resultsCount: businessResults.results.length,
        searchTime: businessResults.search_time_ms,
        query: businessResults.search_query
      })

      // Extract contacts from REAL RocketScrape results
      const extractedData = this.rocketScrapeService.extractContacts(businessResults.results, company.name)

      await this.logService.info('🚀 REAL RocketScrape extraction completed', {
        companyName: company.name,
        extractedData: {
          emails: extractedData.emails.length,
          phones: extractedData.phones.length,
          names: extractedData.names.length,
          websites: extractedData.websites.length,
          rawTextLength: extractedData.rawText.length
        },
        realApiUsed: true
      })

      // Use AI to process the extracted data if substantial content found
      if (extractedData.rawText.length > 50) {
        try {
          const aiResult = await this.aiService.extractLeadInfo(
            extractedData.rawText,
            targetTitles,
            company.name
          )

          return {
            leadName: aiResult.leadName !== 'N/A' ? aiResult.leadName : (extractedData.names[0] || company.name),
            leadTitle: aiResult.leadTitle !== 'N/A' ? aiResult.leadTitle : 'ผู้ติดต่อ',
            email: aiResult.email !== 'none' ? aiResult.email : (extractedData.emails[0] || 'none'),
            phone: aiResult.phone !== 'N/A' ? aiResult.phone : (extractedData.phones[0] || 'N/A'),
            searchPhase: `RocketScrape REAL API + AI (${businessResults.results.length} sources)`,
            targetUrl: extractedData.websites[0] || businessResults.results[0]?.url || 'N/A',
            searchStep: 1
          }
        } catch (aiError) {
          console.error('AI processing failed, using direct extraction:', aiError)
          return {
            leadName: extractedData.names[0] || company.name,
            leadTitle: 'ผู้ติดต่อ',
            email: extractedData.emails[0] || 'none',
            phone: extractedData.phones[0] || 'N/A',
            searchPhase: `RocketScrape REAL API Direct (${businessResults.results.length} sources)`,
            targetUrl: extractedData.websites[0] || businessResults.results[0]?.url || 'N/A',
            searchStep: 1
          }
        }
      } else {
        // Use extracted data directly
        return {
          leadName: extractedData.names[0] || company.name,
          leadTitle: 'ผู้ติดต่อ',
          email: extractedData.emails[0] || 'none',
          phone: extractedData.phones[0] || 'N/A',
          searchPhase: `RocketScrape REAL API Direct (${businessResults.results.length} sources)`,
          targetUrl: extractedData.websites[0] || businessResults.results[0]?.url || 'N/A',
          searchStep: 1
        }
      }

    } catch (error) {
      await this.logService.error('❌ REAL RocketScrape processing failed, falling back to basic scraping', {
        error: error instanceof Error ? error.message : String(error),
        companyName: company.name,
        apiCallFailed: true
      })

      console.error(`❌ REAL RocketScrape API failed for ${company.name}, falling back:`, error)
      
      // Fallback to basic scraping
      return await this.processWithBasicScraping(company, targetTitles, isCompanySearch)
    }
  }

  /**
   * Fallback processing with basic web scraping
   */
  private async processWithBasicScraping(company: any, targetTitles: string, isCompanySearch: boolean): Promise<any> {
    await this.logService.info('📞 Processing with basic web scraping (fallback)', {
      companyName: company.name,
      isCompanySearch,
      reason: 'RocketScrape not available or failed'
    })

    // Use basic web scraping as fallback
    const contactInfo = await this.webScrapingService.searchBasicContacts(company.name)

    return {
      leadName: contactInfo.directors[0] || company.name,
      leadTitle: 'ผู้ติดต่อ',
      email: contactInfo.contactInfo.emails[0] || 'none',
      phone: contactInfo.contactInfo.phones[0] || 'N/A',
      searchPhase: 'Basic Web Scraping (Fallback)',
      targetUrl: contactInfo.contactInfo.websites[0] || 'N/A',
      searchStep: 1
    }
  }

  private emitProgress(progress: SearchProgress) {
    console.log('📝 Progress update:', progress)
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  private async saveToSupabase(lead: LeadData, params: SearchParams): Promise<void> {
    try {
      await supabase.from('search_leads_enhanced_2024').insert({
        search_id: this.searchId,
        company_name: lead.companyName,
        lead_name: lead.leadName,
        lead_title: lead.leadTitle,
        email: lead.email,
        phone: lead.phone,
        search_phase: lead.searchPhase,
        target_url: lead.targetUrl,
        search_step: lead.searchStep,
        search_keywords: params.keywords,
        search_location: params.selectedLocation,
        search_radius: params.radius,
        rocketscrape_used: !!this.rocketScrapeService
      })
    } catch (error) {
      console.error('Error saving to Supabase:', error)
    }
  }

  async getLeadHistory(): Promise<LeadData[]> {
    try {
      const { data, error } = await supabase
        .from('search_leads_enhanced_2024')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return data.map(item => ({
        companyName: item.company_name,
        leadName: item.lead_name,
        leadTitle: item.lead_title,
        email: item.email,
        phone: item.phone,
        searchPhase: item.search_phase,
        targetUrl: item.target_url || 'N/A',
        searchStep: item.search_step || 1
      }))
    } catch (error) {
      console.error('Error fetching lead history:', error)
      return []
    }
  }
}