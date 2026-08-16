import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./studio', async (orig) => ({ ...(await orig<typeof import('./studio')>()), restyle: vi.fn() }))
import { restyle } from './studio'

const file = new File([new Uint8Array([1])], 'p.png', { type: 'image/png' })
const upload = async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.upload(screen.getByLabelText(/upload foto/i), file)
  return u
}

beforeEach(() => { localStorage.clear(); vi.mocked(restyle).mockReset() })

test('generate is disabled until a photo and an api key exist', async () => {
  const u = await upload()
  expect(screen.getByRole('button', { name: /buat foto studio/i })).toBeDisabled()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  expect(screen.getByRole('button', { name: /buat foto studio/i })).toBeEnabled()
})

test('shows the result and a download link', async () => {
  vi.mocked(restyle).mockResolvedValue('data:image/png;base64,ZZZ')
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  expect(await screen.findByAltText(/sesudah/i)).toHaveAttribute('src', 'data:image/png;base64,ZZZ')
  const link = screen.getByRole('link', { name: /download/i })
  expect(link).toHaveAttribute('download', 'foto-studio.png')
  expect(link).toHaveAttribute('href', 'data:image/png;base64,ZZZ')
  expect(localStorage.getItem('gemini-key')).toBe('k')
})

test('derives the download extension from the result mime type', async () => {
  vi.mocked(restyle).mockResolvedValue('data:image/jpeg;base64,ZZZ')
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  await screen.findByAltText(/sesudah/i)
  expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute('download', 'foto-studio.jpeg')
})

test('shows the error message when generation fails', async () => {
  vi.mocked(restyle).mockRejectedValue(new Error('bad key'))
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent('bad key')
})

test('switching theme changes the selected theme', async () => {
  vi.mocked(restyle).mockResolvedValue('data:image/png;base64,ZZZ')
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('radio', { name: /dark premium/i }))
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  expect(vi.mocked(restyle).mock.calls[0][1].id).toBe('dark-premium')
})

test('clearing the selected file clears the preview', async () => {
  const u = await upload()
  expect(screen.getByAltText(/sebelum/i)).toBeInTheDocument()
  await u.upload(screen.getByLabelText(/upload foto/i), [])
  expect(screen.queryByAltText(/sebelum/i)).not.toBeInTheDocument()
})

test('changing the theme after a result clears the stale result', async () => {
  vi.mocked(restyle).mockResolvedValue('data:image/png;base64,ZZZ')
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  await screen.findByAltText(/sesudah/i)
  await u.click(screen.getByRole('radio', { name: /dark premium/i }))
  expect(screen.queryByAltText(/sesudah/i)).not.toBeInTheDocument()
})

test('picking a new file after a result clears the stale result', async () => {
  vi.mocked(restyle).mockResolvedValue('data:image/png;base64,ZZZ')
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  await screen.findByAltText(/sesudah/i)
  const file2 = new File([new Uint8Array([2])], 'q.png', { type: 'image/png' })
  await u.upload(screen.getByLabelText(/upload foto/i), file2)
  expect(screen.queryByAltText(/sesudah/i)).not.toBeInTheDocument()
})

test('hapus api key clears the field and localStorage', async () => {
  const u = userEvent.setup()
  render(<App />)
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /hapus api key/i }))
  expect(screen.getByLabelText(/api key/i)).toHaveValue('')
  expect(localStorage.getItem('gemini-key')).toBeNull()
})

test('api key input has autocomplete off', () => {
  render(<App />)
  expect(screen.getByLabelText(/api key/i)).toHaveAttribute('autoComplete', 'off')
})

test('generate button is aria-busy while processing', async () => {
  let resolve!: (v: string) => void
  vi.mocked(restyle).mockReturnValue(new Promise(r => { resolve = r }))
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))
  expect(screen.getByRole('button', { name: /memproses/i })).toHaveAttribute('aria-busy', 'true')
  resolve('data:image/png;base64,ZZZ')
  await screen.findByAltText(/sesudah/i)
})

test('file and theme controls are disabled while a request is pending, preventing a stale result', async () => {
  let resolve!: (v: string) => void
  vi.mocked(restyle).mockReturnValue(new Promise(r => { resolve = r }))
  const u = await upload()
  await u.type(screen.getByLabelText(/api key/i), 'k')
  await u.click(screen.getByRole('button', { name: /buat foto studio/i }))

  expect(screen.getByLabelText(/upload foto/i)).toBeDisabled()
  const otherTheme = screen.getByRole('radio', { name: /dark premium/i })
  expect(otherTheme).toBeDisabled()

  // Attempting to change the theme while busy must not go through, since the
  // control is disabled — this is what prevents an in-flight restyle() call
  // (still using the original theme) from later overwriting the output with
  // a result that no longer matches the current selection.
  await u.click(otherTheme)
  expect(otherTheme).not.toBeChecked()

  resolve('data:image/png;base64,ZZZ')
  await screen.findByAltText(/sesudah/i)
  expect(vi.mocked(restyle).mock.calls[0][1].id).toBe('studio-white')
})

test('renders the kangfoto landing copy', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/bikin foto produk/i)
  expect(screen.getByText(/tanpa studio, tanpa fotografer/i)).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: /cara kerja/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: /galeri tema/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: /harga/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: /faq/i })).toBeInTheDocument()
})

test('hero and final section both link to the editor CTA', () => {
  render(<App />)
  const ctas = screen.getAllByRole('link', { name: /coba gratis sekarang|upload foto sekarang/i })
  expect(ctas.length).toBe(2)
  ctas.forEach(a => expect(a).toHaveAttribute('href', '#editor'))
  expect(screen.getByRole('heading', { level: 2, name: /siap ubah foto produkmu/i })).toBeInTheDocument()
})
