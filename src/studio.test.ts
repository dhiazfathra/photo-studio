import { THEMES, promptFor, restyle, extFor } from './studio'

test('extFor falls back to png when the mime type has no matching extension', () => {
  expect(extFor('image/')).toBe('png')
})

test('has the 8 kangfoto themes with unique ids', () => {
  expect(THEMES).toHaveLength(8)
  expect(THEMES.map(t => t.name)).toContain('Studio White')
  expect(new Set(THEMES.map(t => t.id)).size).toBe(8)
})

test('prompt keeps the product and applies the theme scene', () => {
  const p = promptFor(THEMES[0])
  expect(p).toContain(THEMES[0].scene)
  expect(p.toLowerCase()).toContain('do not change the product')
})

const png = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
const ok = (data = 'AAA') => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }, { inlineData: { mimeType: 'image/png', data } }] } }] }) })

test('returns a data url from the api response', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  await expect(restyle(png, THEMES[0], 'k')).resolves.toBe('data:image/png;base64,AAA')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toContain('gemini-2.5-flash-image:generateContent')
  expect(init.headers['x-goog-api-key']).toBe('k')
  expect(JSON.parse(init.body).contents[0].parts[1].inline_data.data).toBeTruthy()
})

test('throws the api error message', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'bad key' } }) }))
  await expect(restyle(png, THEMES[0], 'k')).rejects.toThrow('bad key')
})

test('throws when the response has no image', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'nope' }] } }] }) }))
  await expect(restyle(png, THEMES[0], 'k')).rejects.toThrow(/tidak menghasilkan gambar/)
})

test('falls back to a generic message when the api sends no message', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
  await expect(restyle(png, THEMES[0], 'k')).rejects.toThrow('500')
})

test('defaults mime type to image/png when the blob has none', async () => {
  const fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
  const untyped = new Blob([new Uint8Array([1])])
  await restyle(untyped, THEMES[0], 'k')
  const [, init] = fetchMock.mock.calls[0]
  expect(JSON.parse(init.body).contents[0].parts[1].inline_data.mime_type).toBe('image/png')
})

test('falls back to image/png when the api returns a non-image mime type', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'text/plain', data: 'AAA' } }] } }] }),
  }))
  await expect(restyle(png, THEMES[0], 'k')).resolves.toBe('data:image/png;base64,AAA')
})

test('falls back to a status-code message when the error body is not JSON', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('not json') } }))
  await expect(restyle(png, THEMES[0], 'k')).rejects.toThrow('Gagal (502)')
})

test('rejects with a readable-file error when FileReader fails', async () => {
  const realFileReader = globalThis.FileReader
  class FailingReader {
    onerror: (() => void) | null = null
    onload: (() => void) | null = null
    readAsDataURL() { this.onerror?.() }
  }
  // @ts-expect-error stubbing FileReader for the error branch
  globalThis.FileReader = FailingReader
  try {
    await expect(restyle(png, THEMES[0], 'k')).rejects.toThrow('Gagal membaca file')
  } finally {
    globalThis.FileReader = realFileReader
  }
})
