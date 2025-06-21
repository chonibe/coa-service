import ColorThief from "colorthief"

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

function getContrastColor(r: number, g: number, b: number): string {
  const luminance = getLuminance(r, g, b)
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export async function extractColors(imageUrl: string): Promise<ColorPalette> {
  try {
    const colorThief = new ColorThief()
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    const dominantColor = colorThief.getColor(img)
    const palette = colorThief.getPalette(img, 5)

    // Convert RGB arrays to hex colors
    const primary = rgbToHex(...dominantColor)
    const [r, g, b] = dominantColor
    const textColor = getContrastColor(r, g, b)

    // Create a color palette
    return {
      primary,
      secondary: rgbToHex(...palette[1]),
      accent: rgbToHex(...palette[2]),
      background: `linear-gradient(135deg, ${rgbToHex(...palette[3])}80, ${rgbToHex(...palette[4])}80)`,
      text: textColor
    }
  } catch (error) {
    console.error('Error extracting colors:', error)
    // Fallback color palette
    return {
      primary: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: 'linear-gradient(135deg, #1e1b4b80, #18181b80)',
      text: '#ffffff'
    }
  }
} 