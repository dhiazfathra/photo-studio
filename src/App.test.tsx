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
  expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute('download')
  expect(localStorage.getItem('gemini-key')).toBe('k')
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

test('renders the kangfoto landing copy', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/bikin foto produk/i)
  expect(screen.getByText(/tanpa studio, tanpa fotografer/i)).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(4)
})
