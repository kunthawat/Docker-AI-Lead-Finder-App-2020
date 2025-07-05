export interface AIExtractionResult {
  leadName: string
  leadTitle: string
  email: string
  phone: string
  confidence: number
}

export class AIService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async extractLeadInfo(
    text: string,
    targetTitles: string,
    companyName: string
  ): Promise<AIExtractionResult> {
    try {
      console.log(`🤖 AI extracting lead info for: ${companyName}`)
      console.log(`📝 Text length: ${text.length} characters`)
      console.log(`🎯 Target titles: ${targetTitles}`)

      const systemPrompt = `
You are a professional data extraction AI specializing in Thai business contacts. Your task is to analyze text and extract contact information for decision-makers.

STRICT RULES:
1. Only extract information that is explicitly stated in the text
2. Match person titles to one of the target titles: ${targetTitles}
3. NEVER generate or guess email addresses - only use emails that are clearly visible in the text
4. If no email is found, return "none"
5. Extract phone numbers in Thai format (02-xxx-xxxx or 08x-xxx-xxxx)
6. Return confidence score (0-100) based on information quality
7. Prioritize information that appears to be from official sources
8. If multiple contacts are found, choose the highest-ranking person

Response format: JSON object with leadName, leadTitle, email, phone, confidence

Example:
{"leadName": "นายสมชาย ใจดี", "leadTitle": "ผู้จัดการ", "email": "manager@company.com", "phone": "02-123-4567", "confidence": 85}
`

      const userPrompt = `
Company: ${companyName}
Target Titles: ${targetTitles}

Text to analyze:
${text.substring(0, 4000)} // Limit text length

Extract the best matching decision-maker's contact information.
`

      console.log(`🔄 Sending request to OpenAI API...`)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`)
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        console.error('❌ No content in OpenAI response')
        throw new Error('No content in OpenAI response')
      }

      console.log(`📤 OpenAI raw response: ${content}`)

      const result = JSON.parse(content)

      const extractedResult: AIExtractionResult = {
        leadName: result.leadName || 'N/A',
        leadTitle: result.leadTitle || 'N/A',
        email: result.email || 'none',
        phone: result.phone || 'N/A',
        confidence: Math.min(Math.max(result.confidence || 0, 0), 100)
      }

      console.log(`✅ AI extraction completed for ${companyName}:`, {
        leadName: extractedResult.leadName,
        leadTitle: extractedResult.leadTitle,
        email: extractedResult.email,
        phone: extractedResult.phone,
        confidence: extractedResult.confidence
      })

      return extractedResult

    } catch (error) {
      console.error('❌ Error with AI extraction:', error)
      throw error
    }
  }
}