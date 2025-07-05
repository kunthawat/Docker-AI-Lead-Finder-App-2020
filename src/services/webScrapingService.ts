export interface ScrapingResult {
  companyName: string
  directors: string[]
  contactInfo: {
    emails: string[]
    phones: string[]
    websites: string[]
  }
  socialMedia: {
    facebook?: string
    line?: string
    instagram?: string
  }
  rawText: string
}

export class WebScrapingService {
  private readonly searchEngineUrl = 'https://www.google.com/search'
  private readonly bingSearchUrl = 'https://www.bing.com/search'

  /**
   * Scrape company directors from DBD (Department of Business Development)
   * Used specifically for companies (บริษัท) in Phase 1
   */
  async scrapeCompanyDirectors(companyName: string): Promise<string[]> {
    try {
      console.log(`🏛️ Searching for company directors from DBD: ${companyName}`)
      
      // DBD-specific search queries
      const dbdSearchQueries = [
        `site:dbd.go.th "${companyName}"`,
        `site:dbd.go.th "${companyName}" กรรมการ`,
        `"${companyName}" กรรมการ ผู้บริหาร site:dbd.go.th`,
        `"${companyName}" ผู้จัดการ เจ้าของ`,
        `"${companyName}" CEO MD ผู้อำนวยการ`
      ]

      console.log(`📋 DBD director search queries:`, dbdSearchQueries)

      const directors: string[] = []
      
      for (const query of dbdSearchQueries) {
        try {
          console.log(`🏛️ Executing DBD search query: ${query}`)
          const searchResults = await this.performWebSearch(query)
          console.log(`📄 DBD search results length: ${searchResults.length} characters`)
          
          const extractedDirectors = this.extractDirectorNames(searchResults)
          console.log(`👥 Extracted directors from DBD query "${query}":`, extractedDirectors)
          
          directors.push(...extractedDirectors)
          
          // Add delay between searches
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.warn(`⚠️ DBD search failed for query: ${query}`, error)
        }
      }

      // Remove duplicates and filter valid names
      const uniqueDirectors = [...new Set(directors)]
        .filter(name => name.length > 2 && name.length < 50)
        .slice(0, 5) // Limit to 5 directors

      console.log(`✅ Final DBD directors found for ${companyName}:`, uniqueDirectors)
      return uniqueDirectors

    } catch (error) {
      console.error('❌ Error scraping DBD directors:', error)
      return []
    }
  }

  /**
   * Search for key persons in general businesses (non-companies)
   */
  async searchKeyPersons(businessName: string): Promise<string[]> {
    try {
      console.log(`👤 Searching for key persons in business: ${businessName}`)
      
      const keyPersonQueries = [
        `"${businessName}" เจ้าของ ผู้จัดการ`,
        `"${businessName}" owner manager`,
        `"${businessName}" ผู้ประกอบการ`,
        `"${businessName}" staff contact person`,
        `"${businessName}" ติดต่อ คุณ นาย นาง`
      ]

      console.log(`📋 Key person search queries:`, keyPersonQueries)

      const keyPersons: string[] = []
      
      for (const query of keyPersonQueries) {
        try {
          console.log(`👤 Executing key person search query: ${query}`)
          const searchResults = await this.performWebSearch(query)
          console.log(`📄 Key person search results length: ${searchResults.length} characters`)
          
          const extractedPersons = this.extractKeyPersonNames(searchResults)
          console.log(`👤 Extracted key persons from query "${query}":`, extractedPersons)
          
          keyPersons.push(...extractedPersons)
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.warn(`⚠️ Key person search failed for query: ${query}`, error)
        }
      }

      const uniqueKeyPersons = [...new Set(keyPersons)]
        .filter(name => name.length > 2 && name.length < 50)
        .slice(0, 5)

      console.log(`✅ Final key persons found for ${businessName}:`, uniqueKeyPersons)
      return uniqueKeyPersons

    } catch (error) {
      console.error('❌ Error searching key persons:', error)
      return []
    }
  }

  /**
   * Search basic contact information (emails, phones, websites)
   */
  async searchBasicContacts(placeName: string): Promise<ScrapingResult> {
    try {
      console.log(`📞 Searching basic contacts for: ${placeName}`)
      
      const basicContactQueries = [
        `"${placeName}" ติดต่อ email โทรศัพท์`,
        `"${placeName}" contact email phone`,
        `"${placeName}" website official`,
        `"${placeName}" Facebook Line`,
        `"${placeName}" เบอร์โทร อีเมล`,
        `"${placeName}" tel email address`
      ]

      console.log(`📋 Basic contact search queries:`, basicContactQueries)

      return await this.performContactSearch(placeName, basicContactQueries)

    } catch (error) {
      console.error('❌ Error searching basic contacts:', error)
      return this.createEmptyResult(placeName)
    }
  }

  /**
   * Search contacts for specific director (used in Phase 2 for companies)
   */
  async searchDirectorContacts(companyName: string, director: string): Promise<ScrapingResult> {
    try {
      console.log(`🔍 Searching contacts for director ${director} of company ${companyName}`)
      
      const directorContactQueries = [
        `"${director}" "${companyName}" email contact`,
        `"${director}" "${companyName}" โทรศัพท์ ติดต่อ`,
        `"${director}" "${companyName}" phone email`,
        `"${director}" กรรมการ "${companyName}" ติดต่อ`,
        `"${director}" ผู้จัดการ "${companyName}" email`
      ]

      console.log(`📋 Director contact search queries:`, directorContactQueries)

      return await this.performContactSearch(`${companyName}-${director}`, directorContactQueries)

    } catch (error) {
      console.error('❌ Error searching director contacts:', error)
      return this.createEmptyResult(`${companyName}-${director}`)
    }
  }

  /**
   * Search contacts for specific person (used in targeted search for general businesses)
   */
  async searchPersonContacts(businessName: string, person: string): Promise<ScrapingResult> {
    try {
      console.log(`👤 Searching contacts for person ${person} of business ${businessName}`)
      
      const personContactQueries = [
        `"${person}" "${businessName}" email contact`,
        `"${person}" "${businessName}" โทรศัพท์ ติดต่อ`,
        `"${person}" "${businessName}" phone email`,
        `"${person}" เจ้าของ "${businessName}" ติดต่อ`,
        `"${person}" ผู้จัดการ "${businessName}" email`
      ]

      console.log(`📋 Person contact search queries:`, personContactQueries)

      return await this.performContactSearch(`${businessName}-${person}`, personContactQueries)

    } catch (error) {
      console.error('❌ Error searching person contacts:', error)
      return this.createEmptyResult(`${businessName}-${person}`)
    }
  }

  /**
   * Perform contact search with given queries
   */
  private async performContactSearch(searchName: string, queries: string[]): Promise<ScrapingResult> {
    let combinedText = ''
    const emails: string[] = []
    const phones: string[] = []
    const websites: string[] = []
    const socialMedia: any = {}

    for (const query of queries) {
      try {
        console.log(`🔍 Executing contact search query: ${query}`)
        const searchResults = await this.performWebSearch(query)
        console.log(`📄 Contact search results length: ${searchResults.length} characters`)
        
        combinedText += ' ' + searchResults
        
        // Extract contact information
        const extractedEmails = this.extractEmails(searchResults)
        const extractedPhones = this.extractPhones(searchResults)
        const extractedWebsites = this.extractWebsites(searchResults)
        
        console.log(`📧 Emails found in query "${query}":`, extractedEmails)
        console.log(`📞 Phones found in query "${query}":`, extractedPhones)
        console.log(`🌐 Websites found in query "${query}":`, extractedWebsites)
        
        emails.push(...extractedEmails)
        phones.push(...extractedPhones)
        websites.push(...extractedWebsites)
        
        // Extract social media
        const facebook = this.extractFacebook(searchResults)
        const line = this.extractLine(searchResults)
        
        if (facebook) {
          console.log(`📘 Facebook found: ${facebook}`)
          socialMedia.facebook = facebook
        }
        if (line) {
          console.log(`💬 Line found: ${line}`)
          socialMedia.line = line
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.warn(`⚠️ Contact search failed for query: ${query}`, error)
      }
    }

    const result: ScrapingResult = {
      companyName: searchName,
      directors: [],
      contactInfo: {
        emails: [...new Set(emails)].slice(0, 5),
        phones: [...new Set(phones)].slice(0, 5),
        websites: [...new Set(websites)].slice(0, 3)
      },
      socialMedia,
      rawText: combinedText
    }

    console.log(`✅ Final contact search results for ${searchName}:`, {
      emails: result.contactInfo.emails,
      phones: result.contactInfo.phones,
      websites: result.contactInfo.websites,
      socialMedia: result.socialMedia,
      rawTextLength: result.rawText.length
    })

    return result
  }

  private async performWebSearch(query: string): Promise<string> {
    try {
      console.log(`🌐 Performing web search for: ${query}`)
      
      const searchUrls = [
        `${this.searchEngineUrl}?q=${encodeURIComponent(query)}`,
        `${this.bingSearchUrl}?q=${encodeURIComponent(query)}`
      ]

      const proxies = [
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?'
      ]

      console.log(`🔄 Trying ${searchUrls.length} search engines with ${proxies.length} proxies`)

      for (const searchUrl of searchUrls) {
        for (const proxy of proxies) {
          try {
            console.log(`🌐 Attempting search with proxy: ${proxy}`)
            const response = await fetch(proxy + encodeURIComponent(searchUrl), {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            })

            if (response.ok) {
              const data = await response.json()
              const content = data.contents || data
              
              if (typeof content === 'string' && content.length > 100) {
                console.log(`✅ Search successful with proxy: ${proxy}`)
                console.log(`📄 Content length: ${content.length} characters`)
                return content
              }
            }
          } catch (error) {
            console.warn(`⚠️ Proxy failed: ${proxy}`, error)
            continue
          }
        }
      }

      throw new Error('All search attempts failed')
    } catch (error) {
      console.error('❌ Web search failed:', error)
      return ''
    }
  }

  /**
   * Extract director names from DBD search results
   */
  private extractDirectorNames(text: string): string[] {
    const directors: string[] = []
    
    // Thai director patterns for DBD results
    const directorPatterns = [
      /(?:นาย|นาง|นางสาว|ดร\.?|ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์)\s*([ก-๏\s]{3,30})/g,
      /กรรมการ[:\s]*([ก-๏\s]{3,30})/g,
      /ผู้จัดการ[:\s]*([ก-๏\s]{3,30})/g,
      /ผู้อำนวยการ[:\s]*([ก-๏\s]{3,30})/g,
      /กรรมการผู้จัดการ[:\s]*([ก-๏\s]{3,30})/g
    ]

    console.log(`🔍 Extracting director names using ${directorPatterns.length} patterns`)

    for (const pattern of directorPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          const directorName = match[1].trim()
          console.log(`👤 Found potential director: ${directorName}`)
          directors.push(directorName)
        }
      }
    }

    console.log(`👥 Total directors extracted: ${directors.length}`)
    return directors
  }

  /**
   * Extract key person names from general business search results
   */
  private extractKeyPersonNames(text: string): string[] {
    const keyPersons: string[] = []
    
    // Patterns for general business key persons
    const keyPersonPatterns = [
      /(?:คุณ|นาย|นาง|นางสาว)\s*([ก-๏\s]{2,25})/g,
      /เจ้าของ[:\s]*(?:คุณ|นาย|นาง|นางสาว)?\s*([ก-๏\s]{2,25})/g,
      /ผู้จัดการ[:\s]*(?:คุณ|นาย|นาง|นางสาว)?\s*([ก-๏\s]{2,25})/g,
      /ผู้ประกอบการ[:\s]*(?:คุณ|นาย|นาง|นางสาว)?\s*([ก-๏\s]{2,25})/g,
      /ติดต่อ[:\s]*(?:คุณ|นาย|นาง|นางสาว)\s*([ก-๏\s]{2,25})/g
    ]

    console.log(`🔍 Extracting key person names using ${keyPersonPatterns.length} patterns`)

    for (const pattern of keyPersonPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          const personName = match[1].trim()
          console.log(`👤 Found potential key person: ${personName}`)
          keyPersons.push(personName)
        }
      }
    }

    console.log(`👤 Total key persons extracted: ${keyPersons.length}`)
    return keyPersons
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const matches = text.match(emailRegex) || []
    
    const validEmails = matches.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test.com') &&
      !email.includes('google.com') &&
      !email.includes('facebook.com') &&
      !email.includes('w3.org')
    )

    console.log(`📧 Extracted emails: ${validEmails.length} valid out of ${matches.length} total`)
    return validEmails
  }

  private extractPhones(text: string): string[] {
    const phonePatterns = [
      /0[2-9]\d{8}/g, // Thai landline
      /0[6-9]\d{8}/g, // Thai mobile
      /\+66[2-9]\d{8}/g, // International format
      /0[2-9][-\s]\d{3}[-\s]\d{4}/g, // Formatted Thai numbers
      /0[6-9]\d[-\s]\d{3}[-\s]\d{4}/g // Formatted mobile
    ]

    const phones: string[] = []
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern) || []
      phones.push(...matches)
    }

    console.log(`📞 Extracted phones: ${phones.length}`)
    return phones
  }

  private extractWebsites(text: string): string[] {
    const websiteRegex = /https?:\/\/[^\s<>"']+/g
    const matches = text.match(websiteRegex) || []
    
    const validWebsites = matches.filter(url => 
      !url.includes('google.com') && 
      !url.includes('facebook.com') &&
      !url.includes('maps.google') &&
      !url.includes('youtube.com') &&
      url.length < 200
    )

    console.log(`🌐 Extracted websites: ${validWebsites.length} valid out of ${matches.length} total`)
    return validWebsites
  }

  private extractFacebook(text: string): string | undefined {
    const facebookRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+/g
    const matches = text.match(facebookRegex)
    const result = matches?.[0]
    
    if (result) {
      console.log(`📘 Facebook page found: ${result}`)
    }
    
    return result
  }

  private extractLine(text: string): string | undefined {
    const lineRegex = /@[a-zA-Z0-9._-]+/g
    const matches = text.match(lineRegex)
    const result = matches?.[0]
    
    if (result) {
      console.log(`💬 Line ID found: ${result}`)
    }
    
    return result
  }

  private createEmptyResult(name: string): ScrapingResult {
    return {
      companyName: name,
      directors: [],
      contactInfo: { emails: [], phones: [], websites: [] },
      socialMedia: {},
      rawText: ''
    }
  }
}