export interface RocketScrapeResult {
  title: string
  url: string
  snippet: string
  domain: string
  position: number
}

export interface RocketScrapeResponse {
  results: RocketScrapeResult[]
  total_results: number
  search_query: string
  search_time_ms: number
}

export class RocketScrapeService {
  private apiKey: string
  private baseUrl: string = 'https://api.rocketscrape.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
    console.log('🚀 RocketScrapeService initialized with API key:', apiKey.substring(0, 8) + '...')
  }

  async searchGoogle(query: string, numResults: number = 10): Promise<RocketScrapeResponse> {
    try {
      console.log(`🚀 RocketScrape: Starting REAL Google search for: "${query}"`)
      
      const requestBody = {
        query: query,
        num_results: numResults,
        country: 'TH', // Thailand
        language: 'th', // Thai language
        safe_search: false,
        include_answer_box: true,
        include_knowledge_graph: true,
        device: 'desktop'
      }

      console.log('🚀 RocketScrape REAL request:', requestBody)

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Smart-Lead-Finder/1.0'
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`🚀 RocketScrape REAL API Response Status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`🚀 RocketScrape REAL API Error: ${response.status} - ${errorText}`)
        throw new Error(`RocketScrape API Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`🚀 RocketScrape REAL success: ${data.results?.length || 0} results in ${data.search_time_ms}ms`)

      return {
        results: data.results || [],
        total_results: data.total_results || 0,
        search_query: data.search_query || query,
        search_time_ms: data.search_time_ms || 0
      }

    } catch (error) {
      console.error('🚀 RocketScrape REAL Error:', error)
      throw error
    }
  }

  async searchBusiness(businessName: string, searchType: 'contact' | 'general' | 'directors' = 'general'): Promise<RocketScrapeResponse> {
    let query = ''
    
    switch (searchType) {
      case 'contact':
        query = `"${businessName}" ติดต่อ email โทรศัพท์ เบอร์โทร contact phone`
        break
      case 'directors':
        query = `"${businessName}" กรรมการ ผู้บริหาร ผู้จัดการ directors management`
        break
      case 'general':
      default:
        query = `"${businessName}" website official contact information`
        break
    }

    console.log(`🚀 RocketScrape: REAL Business search for ${businessName} (${searchType})`)
    return await this.searchGoogle(query, 15) // More results for business searches
  }

  async searchPerson(personName: string, businessName: string): Promise<RocketScrapeResponse> {
    const queries = [
      `"${personName}" "${businessName}" contact email phone`,
      `"${personName}" "${businessName}" ติดต่อ อีเมล โทรศัพท์`,
      `"${personName}" "${businessName}" manager director`
    ]

    // Try multiple queries and combine results
    const allResults: RocketScrapeResult[] = []
    let totalTime = 0

    for (const query of queries) {
      try {
        console.log(`🚀 RocketScrape: REAL Person search - ${query}`)
        const result = await this.searchGoogle(query, 8)
        allResults.push(...result.results)
        totalTime += result.search_time_ms

        // Add delay between queries to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.warn(`🚀 RocketScrape: REAL Query failed - ${query}:`, error)
        continue
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url)
    )

    return {
      results: uniqueResults,
      total_results: uniqueResults.length,
      search_query: `Combined person search for ${personName}`,
      search_time_ms: totalTime
    }
  }

  async searchDBDCompany(companyName: string): Promise<RocketScrapeResponse> {
    const dbdQueries = [
      `site:dbd.go.th "${companyName}"`,
      `site:datawarehouse.dbd.go.th "${companyName}"`,
      `"${companyName}" กรรมการ ผู้บริหาร site:dbd.go.th`,
      `"${companyName}" directors management site:dbd.go.th`
    ]

    const allResults: RocketScrapeResult[] = []
    let totalTime = 0

    for (const query of dbdQueries) {
      try {
        console.log(`🚀 RocketScrape: REAL DBD search - ${query}`)
        const result = await this.searchGoogle(query, 5)
        allResults.push(...result.results)
        totalTime += result.search_time_ms
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (error) {
        console.warn(`🚀 RocketScrape: REAL DBD query failed - ${query}:`, error)
        continue
      }
    }

    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url)
    )

    return {
      results: uniqueResults,
      total_results: uniqueResults.length,
      search_query: `DBD search for ${companyName}`,
      search_time_ms: totalTime
    }
  }

  // Extract contact information from RocketScrape results
  extractContacts(results: RocketScrapeResult[], businessName: string): {
    emails: string[]
    phones: string[]
    names: string[]
    websites: string[]
    socialMedia: { facebook?: string, line?: string }
    rawText: string
  } {
    const emails = new Set<string>()
    const phones = new Set<string>()
    const names = new Set<string>()
    const websites = new Set<string>()
    const socialMedia: { facebook?: string, line?: string } = {}
    let rawText = ''

    for (const result of results) {
      const combinedText = `${result.title} ${result.snippet}`
      rawText += ' ' + combinedText

      // Extract emails
      const emailMatches = combinedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
      emailMatches.forEach(email => {
        if (!email.includes('example.com') && !email.includes('test.com')) {
          emails.add(email)
        }
      })

      // Extract Thai phone numbers
      const phonePatterns = [
        /0[2-9]\d{8}/g, // Thai landline
        /0[6-9]\d{8}/g, // Thai mobile
        /\+66[2-9]\d{8}/g, // International format
        /0[2-9][-\s]\d{3}[-\s]\d{4}/g // Formatted numbers
      ]

      phonePatterns.forEach(pattern => {
        const phoneMatches = combinedText.match(pattern) || []
        phoneMatches.forEach(phone => phones.add(phone))
      })

      // Extract Thai names
      const namePatterns = [
        /(?:คุณ|นาย|นาง|นางสาว|ดร\.?)\s*([ก-๏\s]{2,30})/g,
        /(?:ผู้จัดการ|กรรมการ|เจ้าของ)[:\s]*(?:คุณ|นาย|นาง|นางสาว)?\s*([ก-๏\s]{2,30})/g
      ]

      namePatterns.forEach(pattern => {
        const nameMatches = combinedText.matchAll(pattern)
        for (const match of nameMatches) {
          if (match[1] && !match[1].includes(businessName)) {
            names.add(match[1].trim())
          }
        }
      })

      // Extract websites
      if (result.url && !result.url.includes('google.com') && !result.url.includes('facebook.com')) {
        websites.add(result.url)
      }

      // Extract social media
      if (result.url.includes('facebook.com')) {
        socialMedia.facebook = result.url
      }

      const lineMatch = combinedText.match(/@[a-zA-Z0-9._-]+/)
      if (lineMatch) {
        socialMedia.line = lineMatch[0]
      }
    }

    console.log(`🚀 RocketScrape REAL extraction results:`, {
      emails: emails.size,
      phones: phones.size,
      names: names.size,
      websites: websites.size,
      socialMedia: Object.keys(socialMedia).length
    })

    return {
      emails: Array.from(emails).slice(0, 5),
      phones: Array.from(phones).slice(0, 5),
      names: Array.from(names).slice(0, 8),
      websites: Array.from(websites).slice(0, 3),
      socialMedia,
      rawText
    }
  }

  // Check if RocketScrape API key is valid
  async testApiKey(): Promise<{ valid: boolean, error?: string }> {
    try {
      console.log('🚀 RocketScrape: Testing REAL API key...')

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test search api key validation',
          num_results: 1
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🚀 RocketScrape: REAL API key is valid', data)
        return { valid: true }
      } else if (response.status === 401) {
        console.log('🚀 RocketScrape: REAL API key is invalid')
        return { valid: false, error: 'Invalid API key' }
      } else {
        const errorText = await response.text()
        console.log('🚀 RocketScrape: REAL API error:', errorText)
        return { valid: false, error: `API error: ${response.status}` }
      }
    } catch (error) {
      console.error('🚀 RocketScrape: REAL Test failed:', error)
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}