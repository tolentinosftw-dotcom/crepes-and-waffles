import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientMenu } from './client-menu'

const mocks = vi.hoisted(() => {
  const defaultMenuStyle = {
    backgroundColor: '#fff8ef',
    primaryColor: '#7f271c',
    secondaryColor: '#8a5b3e',
    textColor: '#2f211b',
    priceColor: '#7f271c',
    accentColor: '#d8b56d',
    titleFontSize: 18,
    descriptionFontSize: 14,
    priceFontSize: 16,
    categoryFontSize: 25,
    fontFamily: 'Georgia',
    imageSize: 'medium',
    imagePosition: 'left',
    cardStyle: 'shadow',
    columns: 2,
    spacing: 'normal',
    textAlign: 'left',
    borderRadius: 8,
    showLogo: true,
    logoUrl: '/logo.webp',
    heroImageUrl: '/placeholder.jpg',
    headerText: 'Crepes & Waffles Interior',
    headerSubtitle: '',
    headerStyle: 'centered'
  }

  const esCategories = [
    {
      id: 'crepes-de-dulce',
      name: 'Crepes de Dulce',
      color: '#8f2f23',
      items: [
        {
          id: 'product-1',
          name: 'Crepe de Nutella',
          description: 'Crepe de Nutella con chantilly.',
          price: 16900,
          image: '/data/images/crepe-de-nutella.webp',
          category: 'crepes-de-dulce'
        }
      ]
    }
  ]

  const enCategories = [
    {
      id: 'sweet-crepes',
      name: 'Sweet Crepes',
      color: '#8f2f23',
      items: [
        {
          id: 'product-1',
          name: 'Nutella Crepe',
          description: 'Nutella crepe with chantilly.',
          price: 16900,
          image: '/data/images/crepe-de-nutella.webp',
          category: 'sweet-crepes'
        }
      ]
    }
  ]

  return {
    defaultMenuStyle,
    categories: esCategories,
    menuDataByLanguage: {
      es: esCategories,
      en: enCategories,
      fr: esCategories,
      it: esCategories,
      zh: esCategories,
      ja: esCategories,
      hi: esCategories
    }
  }
})

vi.mock('@/lib/types', () => ({
  defaultMenuStyle: mocks.defaultMenuStyle,
  menuDataByLanguage: mocks.menuDataByLanguage
}))

vi.mock('@/lib/menu-context', () => ({
  useMenu: () => ({
    categories: mocks.categories,
    style: mocks.defaultMenuStyle
  })
}))

describe('ClientMenu', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders products, prices and category controls from menu data', () => {
    render(<ClientMenu />)

    expect(screen.getByRole('button', { name: /Crepes de Dulce/i })).toBeInTheDocument()
    expect(screen.getByText('Crepe de Nutella')).toBeInTheDocument()
    expect(screen.getByText(/\$ 16\.900|\$16\.900/)).toBeInTheDocument()
  })

  it('switches product names, descriptions and category buttons when language changes', async () => {
    render(<ClientMenu />)

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(await screen.findByRole('button', { name: 'Sweet Crepes' })).toBeInTheDocument()
    expect(await screen.findByText('Nutella Crepe')).toBeInTheDocument()
    expect(await screen.findByText(/Nutella crepe with chantilly/i)).toBeInTheDocument()
  })

  it('uses category color on category buttons', () => {
    render(<ClientMenu />)

    const categoryButton = screen.getByRole('button', { name: 'Crepes de Dulce' })
    expect(categoryButton).toHaveStyle({ color: '#8f2f23' })
  })
})
