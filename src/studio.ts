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

export const extFor = (mime: string) => (/^image\/(\w+)/.exec(mime)?.[1] ?? 'png')

export const promptFor = (t: Theme) =>
  `Retouch this amateur product photo into a professional studio product photograph: ${t.scene}. ` +
  `Do not change the product itself — keep its shape, colour, text and logo identical. ` +
  `Replace only the background, surface and lighting. Clean, sharp, high resolution, commercial catalogue quality.`

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = () => reject(new Error('Gagal membaca file'))
    r.readAsDataURL(blob)
  })

export async function restyle(file: Blob, theme: Theme, apiKey: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptFor(theme) }, { inline_data: { mime_type: file.type || 'image/png', data: await toBase64(file) } }] }],
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message ?? `Gagal (${res.status})`)
  const part = json?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)
  if (!part) throw new Error('AI tidak menghasilkan gambar. Coba foto lain.')
  const mime = /^image\//.test(part.inlineData.mimeType) ? part.inlineData.mimeType : 'image/png'
  return `data:${mime};base64,${part.inlineData.data}`
}
