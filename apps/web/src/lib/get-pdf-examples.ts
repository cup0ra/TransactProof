import fs from 'fs'
import path from 'path'

export function getPdfExamples(): string[] {
  const pdfDir = path.join(process.cwd(), 'public', 'pdf')
  
  try {
    const files = fs.readdirSync(pdfDir)
    
    // Filter only PNG files and sort them
    const pngFiles = files
      .filter(file => file.toLowerCase().endsWith('.png'))
      .sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const numA = parseInt(a.match(/\d+/)?.[0] || '0')
        const numB = parseInt(b.match(/\d+/)?.[0] || '0')
        return numA - numB
      })
      .map(file => `/pdf/${file}`)
    
    return pngFiles
  } catch (error) {
    console.error('Error reading PDF directory:', error)
    return []
  }
}
