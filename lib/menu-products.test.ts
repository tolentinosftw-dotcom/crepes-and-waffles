import { describe, expect, it } from 'vitest'
import enProducts from './menu-products/en.json'
import esProducts from './menu-products/es.json'
import frProducts from './menu-products/fr.json'
import hiProducts from './menu-products/hi.json'
import itProducts from './menu-products/it.json'
import jaProducts from './menu-products/ja.json'
import zhProducts from './menu-products/zh.json'
import { menuDataByLanguage } from './types'

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

const catalogs = {
  es: esProducts as Product[],
  en: enProducts as Product[],
  fr: frProducts as Product[],
  it: itProducts as Product[],
  zh: zhProducts as Product[],
  ja: jaProducts as Product[],
  hi: hiProducts as Product[]
}

const expectedFirstProduct = {
  es: { name: 'Crepe de Nutella', description: 'Crepe de Nutella con chantilly.', category: 'CREPES DE DULCE' },
  en: { name: 'Nutella Crepe', description: 'Nutella crepe with chantilly.', category: 'SWEET CREPES' },
  fr: { name: 'Cr\u00eape Nutella', description: 'Cr\u00eape Nutella \u00e0 la chantilly.', category: 'CR\u00caPES SUCR\u00c9ES' },
  it: { name: 'Cr\u00eape alla Nutella', description: 'Cr\u00eape alla nutella con chantilly.', category: 'CREPE DOLCI' },
  zh: { name: 'Nutella\u53ef\u4e3d\u997c', description: 'Nutella\u53ef\u4e3d\u997c\u4e0e\u9999\u7f07\u5976\u6cb9\u3002', category: '\u751c\u8584\u997c' },
  ja: { name: '\u30cc\u30c6\u30e9\u30af\u30ec\u30fc\u30d7', description: '\u30b7\u30e3\u30f3\u30c6\u30a3\u5165\u308a\u30cc\u30c6\u30e9\u30af\u30ec\u30fc\u30d7\u3002', category: '\u30b9\u30a4\u30fc\u30c8\u30af\u30ec\u30fc\u30d7' },
  hi: { name: '\u0928\u0941\u091f\u0947\u0932\u093e \u0915\u094d\u0930\u0947\u092a', description: '\u091a\u0948\u0902\u091f\u093f\u0932\u0940 \u0915\u0947 \u0938\u093e\u0925 \u0928\u0941\u091f\u0947\u0932\u093e \u0915\u094d\u0930\u0947\u092a\u0964', category: '\u092e\u0940\u0920\u0947 \u0915\u094d\u0930\u0947\u092a\u094d\u0938' }
}

const expectedLastProduct = {
  es: { name: 'Sopa Soy Oto\u00f1o 1lt', category: 'CREPES EN CASA' },
  en: { name: 'Soy Autumn Soup 1lt', category: 'CREPES AT HOME' },
  fr: { name: "Soupe d'Automne au Soja 1lt", category: 'CR\u00caPES \u00c0 LA MAISON' },
  it: { name: 'Zuppa Autunnale alla Soia 1lt', category: 'CREPES A CASA' },
  zh: { name: '\u9ec4\u8c46\u79cb\u6c64 1lt', category: '\u5728\u5bb6\u505a\u8584\u997c' },
  ja: { name: '\u79cb\u306e\u5927\u8c46\u30b9\u30fc\u30d7 1lt', category: '\u81ea\u5b85\u3067\u30af\u30ec\u30fc\u30d7' },
  hi: { name: '\u0938\u094b\u092f\u093e \u0936\u0930\u0926 \u090b\u0924\u0941 \u0938\u0942\u092a 1lt', category: '\u0918\u0930 \u092a\u0930 \u0915\u094d\u0930\u0947\u092a\u094d\u0938' }
}

const languageScripts = {
  zh: /\p{Script=Han}/u,
  ja: /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
  hi: /\p{Script=Devanagari}/u
}

const nonLatinScripts = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Devanagari}]/u
const mojibakePattern = /\u00c3|\u00c2|\ufffd|\u00e2\u20ac|\u00e2\u20ac\u2122|\u00e2\u20ac\u0153|\u00e2\u20ac\u009d/

function catalogText(products: Product[]) {
  return products.map((product) => `${product.name}\n${product.description}\n${product.category}`).join('\n')
}

describe('localized product catalogs', () => {
  it('keeps the same product IDs, prices and images in every language', () => {
    const source = catalogs.es

    for (const [language, products] of Object.entries(catalogs)) {
      expect(products, language).toHaveLength(253)

      products.forEach((product, index) => {
        expect(product.id, `${language} product ${index + 1} id`).toBe(source[index].id)
        expect(product.price, `${language} product ${index + 1} price`).toBe(source[index].price)
        expect(product.image, `${language} product ${index + 1} image`).toBe(source[index].image)
        expect(product.image, `${language} product ${index + 1} image format`).toMatch(/^data\/images\/.+\.webp$/)
      })
    }
  })

  it('builds the same number of visible categories for every language', () => {
    const sourceCategoryCount = menuDataByLanguage.es.length

    expect(sourceCategoryCount).toBe(22)

    for (const [language, categories] of Object.entries(menuDataByLanguage)) {
      expect(categories, `${language} category count`).toHaveLength(sourceCategoryCount)
      expect(new Set(categories.map((category) => category.id)).size, `${language} unique category ids`).toBe(sourceCategoryCount)
      expect(categories.every((category) => category.items.length > 0), `${language} categories have products`).toBe(true)
    }
  })

  it('has complete text fields without encoding corruption', () => {
    for (const [language, products] of Object.entries(catalogs)) {
      products.forEach((product, index) => {
        expect(product.name.trim(), `${language} product ${index + 1} name`).not.toBe('')
        expect(product.description.trim(), `${language} product ${index + 1} description`).not.toBe('')
        expect(product.category.trim(), `${language} product ${index + 1} category`).not.toBe('')
        expect(`${product.name} ${product.description} ${product.category}`, `${language} product ${index + 1} mojibake`).not.toMatch(mojibakePattern)
      })
    }
  })

  it('uses the expected writing system for Chinese, Japanese and Hindi', () => {
    expect(catalogText(catalogs.zh)).toMatch(languageScripts.zh)
    expect(catalogText(catalogs.ja)).toMatch(languageScripts.ja)
    expect(catalogText(catalogs.hi)).toMatch(languageScripts.hi)
  })

  it('does not leak Chinese, Japanese or Hindi characters into Latin-language catalogs', () => {
    for (const language of ['es', 'en', 'fr', 'it'] as const) {
      expect(catalogText(catalogs[language]), language).not.toMatch(nonLatinScripts)
    }
  })

  it('matches known reference translations letter for letter', () => {
    for (const [language, expected] of Object.entries(expectedFirstProduct)) {
      expect(catalogs[language as keyof typeof catalogs][0]).toMatchObject(expected)
    }

    for (const [language, expected] of Object.entries(expectedLastProduct)) {
      expect(catalogs[language as keyof typeof catalogs][252]).toMatchObject(expected)
    }
  })
})
