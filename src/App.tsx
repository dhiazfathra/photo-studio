import { useEffect, useMemo, useState } from 'react'
import { THEMES, restyle, type Theme } from './studio'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [theme, setTheme] = useState<Theme>(THEMES[0])
  const [key, setKey] = useState(localStorage.getItem('gemini-key') ?? '')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const go = async () => {
    // invariant: the button is disabled while file is null, so it is non-null here
    const selected = file as File
    setBusy(true); setErr(''); setOut('')
    try {
      localStorage.setItem('gemini-key', key)
      setOut(await restyle(selected, theme, key))
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <main>
      <section id="hero">
        <h1>Bikin Foto Produk Pakai AI, 2 Menit Selesai</h1>
        <p className="sub">Tanpa Studio, Tanpa Fotografer</p>
      </section>

      <section id="cara-kerja">
        <h2>Cara Kerja</h2>
        <ol className="steps">
          <li><strong>Upload Foto</strong><span>Unggah foto produk apa adanya.</span></li>
          <li><strong>Pilih Tema</strong><span>Pilih salah satu dari 8 tema studio.</span></li>
          <li><strong>Generate</strong><span>AI mengganti background dan pencahayaan.</span></li>
          <li><strong>Download</strong><span>Unduh hasil foto studio siap pakai.</span></li>
        </ol>
      </section>

      <section id="galeri-tema">
        <h2>Galeri Tema</h2>
        <ul className="theme-gallery">
          {THEMES.map(t => (
            <li key={t.id}>
              <strong>{t.name}</strong>
              <span>{t.desc}</span>
            </li>
          ))}
        </ul>
      </section>

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
        {preview && <img alt="Sebelum" src={preview} />}
        {out && <><img alt="Sesudah" src={out} /><a href={out} download="foto-studio.png">Download</a></>}
      </section>

      <section id="harga">
        <h2>Harga</h2>
        <p className="demo-note">Demo tanpa backend — pembayaran tidak aktif</p>
        <ul className="pricing">
          <li>
            <h3>Starter</h3>
            <p className="price">Rp 50.000</p>
            <p>10 foto studio, 8 tema, download resolusi tinggi.</p>
          </li>
          <li>
            <h3>Standard</h3>
            <p className="price">Rp 300.000</p>
            <p>75 foto studio, 8 tema, download resolusi tinggi.</p>
          </li>
          <li>
            <h3>Pro</h3>
            <p className="price">Rp 600.000</p>
            <p>200 foto studio, 8 tema, download resolusi tinggi.</p>
          </li>
        </ul>
      </section>

      <section id="faq">
        <h2>FAQ</h2>
        <details>
          <summary>Apakah foto asli saya aman?</summary>
          <p>Foto dikirim langsung dari browser ke Google Gemini menggunakan API key Anda sendiri. Tidak ada server perantara.</p>
        </details>
        <details>
          <summary>Apakah API key saya disimpan?</summary>
          <p>API key hanya disimpan di localStorage browser Anda, tidak pernah dikirim ke server kami.</p>
        </details>
        <details>
          <summary>Format foto apa yang didukung?</summary>
          <p>Semua format gambar umum seperti JPG dan PNG.</p>
        </details>
        <details>
          <summary>Apakah ada biaya tambahan?</summary>
          <p>Ini adalah demo tanpa backend, pembayaran tidak aktif. Anda hanya perlu API key Gemini gratis dari Google AI Studio.</p>
        </details>
      </section>

      <footer>
        <p>KangFoto Clone — demo statis, tanpa backend.</p>
      </footer>
    </main>
  )
}
