import supabase from '../lib/supabase'
import { SearchLog } from '../types'

interface URLLog {
  url: string
  method: string
  status?: number
  responseTime?: number
  purpose: string
}

export class LogService {
  private searchId: string
  private companyName: string = ''

  constructor(searchId: string) {
    this.searchId = searchId
  }

  setCompanyName(companyName: string) {
    this.companyName = companyName
  }

  async info(message: string, details?: any, urlLogs?: URLLog[]) {
    await this.log('info', message, details, urlLogs)
    console.log(`ℹ️ [${this.companyName}] ${message}`, details)
  }

  async warning(message: string, details?: any, urlLogs?: URLLog[]) {
    await this.log('warning', message, details, urlLogs)
    console.warn(`⚠️ [${this.companyName}] ${message}`, details)
  }

  async error(message: string, details?: any, urlLogs?: URLLog[]) {
    await this.log('error', message, details, urlLogs)
    console.error(`❌ [${this.companyName}] ${message}`, details)
  }

  async debug(message: string, details?: any, urlLogs?: URLLog[]) {
    await this.log('debug', message, details, urlLogs)
    console.debug(`🔍 [${this.companyName}] ${message}`, details)
  }

  private async log(
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    details?: any,
    urlLogs?: URLLog[]
  ) {
    try {
      await supabase.from('search_logs_enhanced_2024').insert({
        search_id: this.searchId,
        company_name: this.companyName,
        log_level: level,
        message,
        url_logs: urlLogs ? JSON.stringify(urlLogs) : null,
        details: details ? JSON.stringify(details) : null
      })
    } catch (error) {
      console.error('Failed to save enhanced log:', error)
    }
  }

  static async getSearchLogs(searchId: string): Promise<SearchLog[]> {
    try {
      const { data, error } = await supabase
        .from('search_logs_enhanced_2024')
        .select('*')
        .eq('search_id', searchId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching search logs:', error)
      return []
    }
  }

  static async getAllRecentLogs(limit: number = 100): Promise<SearchLog[]> {
    try {
      const { data, error } = await supabase
        .from('search_logs_enhanced_2024')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching recent logs:', error)
      return []
    }
  }
}