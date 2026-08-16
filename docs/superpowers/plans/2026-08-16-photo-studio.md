# Photo Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A backend-free static site that turns an amateur product photo into a professional studio photo (KangFoto clone).

**Architecture:** Vite + React + TS single page. All logic lives in `src/studio.ts` (themes + `restyle()`), UI in `src/App.tsx`. The AI call goes straight from the browser to Google's Gemini image model using a user-supplied API key kept in `localStorage`. No server, no router, no state library.

**Tech Stack:** Vite 7, React 19, TypeScript, Vitest + @testing-library/react + jsdom, ESLint 9 (flat config), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-16-photo-studio-design.md`

## Global Constraints

- No backend, no server code, no payment integration. Pricing is static copy.
- Model id constant: `gemini-2.5-flash-image`; endpoint `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, auth header `x-goog-api-key`.
- UI copy in Indonesian, matching kangfoto.id wording where quoted in the spec.
- Palette: `--bg:#faf7f2; --ink:#1c1917; --pink:#e0629a; --amber:#e8a33d`.
- Exactly 8 themes: Studio White, Soft Shadow, Modern Interior, Natural Wood, Elegant Marble, Concrete Minimalist, Tropical Bright, Dark Premium.
- 100% coverage enforced (`v8`, thresholds 100 for lines/branches/functions/statements). `npm test` and `npx eslint .` must pass before every commit.
- No new runtime dependencies beyond react/react-dom.

---

### Task 1: Project scaffold + themes

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `eslint.config.js`, `.github/workflows/ci.yml`, `src/main.tsx`, `src/studio.ts`, `src/index.css`
- Test: `src/studio.test.ts`

**Interfaces:**
- Produces: `export type Theme = { id: string; name: string; desc: string; scene: string }`, `export const THEMES: Theme[]`, `export const MODEL = 'gemini-2.5-flash-image'`, `export const promptFor(t: Theme): string`

- [ ] **Step 1: Scaffold**

```bash
npm create vite@latest . -- --template react-ts   # keep existing files
npm i
npm i -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/setup.ts', 'src/vite-env.d.ts'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
})
```

`src/setup.ts`: `import '@testing-library/jest-dom/vitest'`

`package.json` scripts: `"dev"`, `"build": "tsc -b && vite build"`, `"test": "vitest run --coverage"`, `"lint": "eslint ."`

- [ ] **Step 2: Write the failing test** — `src/studio.test.ts`

```ts
import { THEMES, promptFor } from './studio'

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
```

- [ ] **Step 3: Run — expect FAIL** (`npx vitest run src/studio.test.ts`, "Cannot find module './studio'")

- [ ] **Step 4: Implement `src/studio.ts`**

```ts
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
```

- [ ] **Step 5: Run — expect PASS**, then `npx eslint .`

- [ ] **Step 6: CI** — `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: scaffold vite app and studio themes"`

---

### Task 2: `restyle()` — the actual transformation

**Files:**
- Modify: `src/studio.ts`
- Test: `src/studio.test.ts`

**Interfaces:**
- Consumes: `THEMES`, `promptFor`, `MODEL`
- Produces: `export async function restyle(file: Blob, theme: Theme, apiKey: string): Promise<string>` returning a `data:` URL; throws `Error` on API error or when the response has no image part.

- [ ] **Step 1: Write the failing tests** (append)

```ts
import { restyle, THEMES } from './studio'

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
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement** (append to `src/studio.ts`)

```ts
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
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? `Gagal (${res.status})`)
  const part = json?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)
  if (!part) throw new Error('AI tidak menghasilkan gambar. Coba foto lain.')
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
}
```

Note: jsdom provides `FileReader`; no polyfill needed. If a branch of `toBase64`'s
`onerror` is uncovered, add a test passing an object that throws on read, or make the
reject path unreachable by removing it — coverage must stay 100%.

- [ ] **Step 4: Run — expect PASS + coverage 100% on `studio.ts`**; `npx eslint .`

- [ ] **Step 5: Commit** — `git commit -am "feat: restyle photo via gemini image api"`

---

### Task 3: App UI — upload, theme, generate, download

**Files:**
- Create: `src/App.tsx`, `src/App.test.tsx`
- Modify: `src/main.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `THEMES`, `restyle`
- Produces: default-exported `App` component.

- [ ] **Step 1: Write the failing test** — `src/App.test.tsx`

```tsx
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
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/App.tsx`** (the editor part; landing copy comes in Task 4)

```tsx
import { useState } from 'react'
import { THEMES, restyle, type Theme } from './studio'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [theme, setTheme] = useState<Theme>(THEMES[0])
  const [key, setKey] = useState(localStorage.getItem('gemini-key') ?? '')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async () => {
    if (!file) return
    setBusy(true); setErr(''); setOut('')
    try {
      localStorage.setItem('gemini-key', key)
      setOut(await restyle(file, theme, key))
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <main>
      <section id="editor">
        <label htmlFor="foto">Upload Foto Produk</label>
        <input id="foto" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />

        <div role="radiogroup" aria-label="Tema">
          {THEMES.map(t => (
            <button key={t.id} role="radio" aria-checked={t.id === theme.id} onClick={() => setTheme(t)}>
              {t.name}<span>{t.desc}</span>
            </button>
          ))}
        </div>

        <label htmlFor="key">API Key Google AI Studio</label>
        <input id="key" type="password" value={key} onChange={e => setKey(e.target.value)} />

        <button disabled={!file || !key || busy} onClick={go}>
          {busy ? 'Memproses…' : 'Buat Foto Studio'}
        </button>

        {err && <p role="alert">{err}</p>}
        {file && <img alt="Sebelum" src={URL.createObjectURL(file)} />}
        {out && <><img alt="Sesudah" src={out} /><a href={out} download="foto-studio.png">Download</a></>}
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Run — expect PASS**; `npx eslint .`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: photo studio editor ui"`

---

### Task 4: Landing page, styling, README

**Files:**
- Modify: `src/App.tsx`, `src/index.css`, `index.html`, `README.md`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test** (append)

```tsx
test('renders the kangfoto landing copy', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/bikin foto produk/i)
  expect(screen.getByText(/tanpa studio, tanpa fotografer/i)).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(4)
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement** — add above/below `#editor`, as plain static JSX (no new state):
  hero (`<h1>Bikin Foto Produk Pakai AI, 2 Menit Selesai</h1>`, sub "Tanpa Studio, Tanpa Fotografer"),
  "Cara Kerja" 4 steps (Upload Foto / Pilih Tema / Generate / Download),
  "Galeri Tema" listing the 8 `THEMES` names+desc,
  "Harga" as three static cards (Starter Rp 50.000, Standard Rp 300.000, Pro Rp 600.000) with a
  visible note "Demo tanpa backend — pembayaran tidak aktif", FAQ (4 `<details>`), footer.
  Style in `src/index.css` with the palette constants from Global Constraints: warm off-white bg,
  near-black headings, pink pill buttons, CSS grid for theme cards, `max-width: 72rem` container,
  responsive at `@media (max-width: 640px)`. Set `<title>` and `lang="id"` in `index.html`.

- [ ] **Step 4: Run — expect PASS with 100% coverage**; `npx eslint .`; `npm run build`

- [ ] **Step 5: README.md** — what it is, the BYOK Gemini key tradeoff (key stays in the browser,
  photos are sent to Google), how to run (`npm i`, `npm run dev`), how to test, how to deploy static,
  and the explicit "no backend, so no accounts/credits/payments" scope note.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: landing page, styling and README"`

---

## Self-Review

- Spec coverage: themes (T1), restyle/API/errors (T2), upload→theme→generate→download flow + localStorage key (T3), landing sections/pricing-as-copy/README/security note (T4). Testing + CI + 100% thresholds (T1/T2/T3/T4).
- No placeholders: every code step carries real code.
- Type consistency: `Theme`, `THEMES`, `promptFor`, `restyle(file, theme, apiKey)`, `MODEL` used identically across tasks.
