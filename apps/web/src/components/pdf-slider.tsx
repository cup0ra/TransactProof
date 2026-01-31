import { getPdfExamples } from '@/lib/get-pdf-examples'
import PdfSliderClient from './pdf-slider-client'

export default function PdfSlider() {
  const pdfExamples = getPdfExamples()
  
  return <PdfSliderClient pdfExamples={pdfExamples} />
}
