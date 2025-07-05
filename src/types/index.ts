export interface LeadData {
  companyName: string
  leadName: string
  leadTitle: string
  email: string
  phone: string
  searchPhase: string
  targetUrl: string // New field for source URL verification
  searchStep: number // To track which step found this lead
}

export interface SearchParams {
  keywords: string
  targetTitles: string
  selectedLocation: { lat: number; lng: number } | null
  radius: number // in kilometers
  limit: number // number of companies to search
}

export interface SearchLog {
  id: string
  search_id: string
  company_name: string
  log_level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  details?: any
  created_at: string
}

export interface ContactSource {
  url: string
  source: 'google_search' | 'website_scrape' | 'dbd' | 'social_media'
  method: string
  contactType: 'business_general' | 'person_specific'
}