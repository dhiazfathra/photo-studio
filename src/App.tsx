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
            <button key={t.id} type="button" role="radio" aria-checked={t.id === theme.id} onClick={() => setTheme(t)}>
              {t.name}<span>{t.desc}</span>
            </button>
          ))}
        </div>

        <label htmlFor="key">API Key Google AI Studio</label>
        <input id="key" type="password" value={key} onChange={e => setKey(e.target.value)} />

        <button type="button" disabled={!file || !key || busy} onClick={go}>
          {busy ? 'Memproses…' : 'Buat Foto Studio'}
        </button>

        {err && <p role="alert">{err}</p>}
        {file && <img alt="Sebelum" src={URL.createObjectURL(file)} />}
        {out && <><img alt="Sesudah" src={out} /><a href={out} download="foto-studio.png">Download</a></>}
      </section>
    </main>
  )
}
