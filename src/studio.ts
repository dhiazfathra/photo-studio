export const MODEL = 'gemini-2.5-flash-image'

export type Theme = { id: string; name: string; desc: string; scene: string }

export const THEMES: Theme[] = [
  { id: 'studio-white', name: 'Studio White', desc: 'Background putih dengan pencahayaan studio profesional', scene: 'seamless pure white studio background with soft three-point lighting' },
  { id: 'soft-shadow', name: 'Soft Shadow', desc: 'Background abu-abu lembut dengan bayangan halus', scene: 'light grey backdrop with a soft diffused shadow under the product' },
  { id: 'modern-interior', name: 'Modern Interior', desc: 'Interior modern dengan sentuhan natural', scene: 'modern minimal interior shelf with warm natural daylight' },
  { id: 'natural-wood', name: 'Natural Wood', desc: 'Permukaan kayu oak hangat dengan pencahayaan sore', scene: 'warm oak wood surface with soft late-afternoon light' },
  { id: 'elegant-marble', name: 'Elegant Marble', desc: 'Marmer putih Carrara dengan corak abu-abu mewah', scene: 'polished white Carrara marble surface with elegant grey veining' },
  { id: 'concrete-minimalist', name: 'Concrete Minimalist', desc: 'Abu-abu industrial yang modern dan minimalis', scene: 'raw industrial concrete surface, minimalist grey studio' },
  { id: 'tropical-bright', name: 'Tropical Bright', desc: 'Nuansa tropis dengan dedaunan monstera segar', scene: 'bright tropical scene with fresh monstera leaves and sunlight' },
  { id: 'dark-premium', name: 'Dark Premium', desc: 'Background hitam dramatis dengan rim lighting mewah', scene: 'dramatic black background with premium rim lighting' },
]

export const promptFor = (t: Theme) =>
  `Retouch this amateur product photo into a professional studio product photograph: ${t.scene}. ` +
  `Do not change the product itself — keep its shape, colour, text and logo identical. ` +
  `Replace only the background, surface and lighting. Clean, sharp, high resolution, commercial catalogue quality.`
