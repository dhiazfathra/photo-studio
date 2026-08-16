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
