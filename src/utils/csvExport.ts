export interface CsvHeader {
  label: string
  key: string
}

export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  headers: CsvHeader[],
  filename: string = 'data.csv'
): void {
  // Create CSV header row
  const headerRow = headers.map(header => header.label).join(',')
  
  // Create CSV data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key]
      // Handle values that might contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  })
  
  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n')
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}