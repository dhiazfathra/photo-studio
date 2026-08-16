# Photo Studio (KangFoto Clone)

A backend-free static web app that turns an amateur product photo into a professional
studio-style product photo using Google's Gemini image model. Upload a photo, pick one
of 8 studio themes (Studio White, Soft Shadow, Modern Interior, Natural Wood, Elegant
Marble, Concrete Minimalist, Tropical Bright, Dark Premium), and generate + download the
result — all in the browser.

## How it works (BYOK)

This app has no server. You bring your own Gemini API key ("BYOK") from
[Google AI Studio](https://aistudio.google.com/apikey):

- Your API key is stored **only in your browser's `localStorage`** — it is never sent
  anywhere except directly to Google's Gemini API.
- Your uploaded photo is sent directly from the browser to Google's Gemini API
  (`generativelanguage.googleapis.com`) to be transformed. It is not sent to, or stored
  on, any server we operate.
- Because there is no backend, there are **no accounts, no credits, and no real
  payments** — the pricing section on the landing page is static copy only, clearly
  marked "Demo tanpa backend — pembayaran tidak aktif" (demo without a backend —
  payment is not active).

## Running locally

```bash
npm install
npm run dev
```

Open the shown local URL, paste a Gemini API key, upload a photo, pick a theme, and
generate.

## Testing

```bash
npm test        # vitest with 100% coverage thresholds
npx eslint .     # lint
npm run build    # type-check + production build
```

## Deploying

The app builds to static files with no server dependency:

```bash
npm run build
```

Deploy the contents of `dist/` to any static host (GitHub Pages, Netlify, Vercel static,
S3, etc.) — no backend or server-side configuration is required.
