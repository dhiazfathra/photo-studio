# Photo Studio — Design (KangFoto clone, no backend)

Date: 2026-08-16
Status: Accepted (user pre-authorized decisions; no clarifying questions allowed this session)

## Goal

Recreate https://kangfoto.id/ without a backend, as simply as possible. Bare minimum
function: turn an amateur product photo into one that looks like it came from a
professional studio.

## Research summary (kangfoto.id)

Indonesian AI product-photography SaaS for UMKM (small business).

- Hero: "Bikin Foto Produk Pakai AI, 2 Menit Selesai — Tanpa Studio, Tanpa Fotografer"
- Flow: Upload foto HP → pilih tema → generate → download
- 8 themes: Studio White, Soft Shadow, Modern Interior, Natural Wood, Elegant Marble,
  Concrete Minimalist, Tropical Bright, Dark Premium
- Sections: hero, before/after, features (6), how-it-works (4 steps), theme gallery,
  pricing (3 credit packs), payment logos, FAQ, final CTA
- Visual style: warm off-white background (#FAF7F2-ish), near-black headings, pink accent
  (#E0629A-ish) with amber/orange secondary, rounded pill buttons, large bold sans.

## Scope decision (YAGNI, ponytail ultra)

**In:** upload → pick theme → generate → before/after → download. Landing sections
(hero, how it works, theme gallery, FAQ, CTA) as light static markup.

**Out — deliberately:** accounts, auth, credits, pricing/checkout, QRIS payments,
gallery persistence, i18n toggle, analytics, router. Pricing is marketing copy only;
without a backend it cannot be real, and faking a payment flow is worse than omitting it.

## Architecture

Static single-page site. Vite + React + TypeScript. No server, no database, no router.
Deployed as static files (any static host / GitHub Pages).

The "AI" is Google's Gemini image model called **directly from the browser** with a
**user-supplied API key** (BYOK) kept in `localStorage`. This is the only way to get real
studio-quality output with zero backend.

```
App.tsx (UI shell + landing copy)
  └─ src/studio.ts   THEMES + toBase64() + restyle()  ← all logic, fully unit-tested
```

Two files of substance. `studio.ts` is pure/injectable (`fetch` passed or global),
so it is testable without a network.

### API contract

`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
header `x-goog-api-key: <user key>`, body = `{contents:[{parts:[{text: prompt},{inline_data:{mime_type, data}}]}]}`.
Response: first part containing `inlineData` → `data:<mime>;base64,<data>`.

`restyle(file, themeId, apiKey)` → `Promise<string>` (data URL). Throws `Error` with the
API's message on non-2xx or when no image part is returned.

### Themes

8 theme objects `{id, name, desc, prompt}` mirroring kangfoto's set. The prompt is the
entire product: it instructs the model to keep the product identical and replace only
lighting/背景/surface. One shared prompt prefix + per-theme scene sentence (DRY).

## Data flow

1. User picks a file → `URL.createObjectURL` preview ("Sebelum").
2. User picks theme; clicks Generate. If no key in `localStorage`, an inline field asks
   for one (link to Google AI Studio).
3. `restyle()` → data URL → shown as "Sesudah" with a download link (`<a download>`).
4. Errors render as a red inline message. No retry logic, no queue.

## Error handling

- Missing key / missing file / missing theme: button disabled, no error path needed.
- Non-2xx or blocked response: show the API message verbatim.
- Oversized file: none — the API rejects it and we surface that message. (Skipped a
  client-side size guard; add if users hit it often.)

## Security / privacy

- The key never leaves the user's browser except to Google. Stated plainly in the UI.
- BYOK in a browser means the key is visible to anyone with the device; documented in
  README as the explicit tradeoff of "no backend". A backend proxy is the upgrade path.
- Photos are sent to Google's API; also stated in the UI.

## Testing

Vitest + Testing Library, jsdom. 100% coverage of `studio.ts` (all branches: happy path,
non-2xx, no-image-part, base64 conversion) and of `App.tsx` interaction paths with
`restyle` stubbed. `v8` coverage thresholds set to 100 and enforced in CI.

## Assumptions recorded (no questions permitted)

1. BYOK Gemini over WASM background-removal: real studio quality, ~50 lines, no 5 MB model.
2. Indonesian copy kept (target audience is Indonesian UMKM).
3. Pricing section retained as static marketing copy with a "demo, no payments" note,
   rather than dropped — it is part of recreating the site.
4. `gemini-2.5-flash-image` as the model id; swappable via one constant.
5. Free tier / credit accounting omitted entirely (needs a backend).
