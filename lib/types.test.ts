import { describe, expect, it } from 'vitest'
import { getCategoryColor, sampleMenuData } from './types'

describe('menu data model', () => {
  it('loads the product catalog into stable categories', () => {
    const names = sampleMenuData.map((category) => category.name)

    expect(names).toContain('Crepes de Dulce')
    expect(names).toContain('Helados')
    expect(names).toContain('Jugos Naturales')
    expect(names).toContain('Waffles')
    expect(sampleMenuData.reduce((total, category) => total + category.items.length, 0)).toBe(253)
  })

  it('groups definitive products by their source category', () => {
    const sweetCrepes = sampleMenuData.find((category) => category.name === 'Crepes de Dulce')
    const soups = sampleMenuData.find((category) => category.name === 'Sopas')

    expect(sweetCrepes?.items.map((item) => item.name)).toContain('Crepe de Nutella')
    expect(soups?.items.map((item) => item.name)).not.toContain('Crepe de Nutella')
  })

  it('assigns default colors for category customization', () => {
    expect(getCategoryColor('Jugos Naturales')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(getCategoryColor('Waffles')).not.toBe(getCategoryColor('Bebidas'))
    expect(sampleMenuData.every((category) => Boolean(category.color))).toBe(true)
  })
})
