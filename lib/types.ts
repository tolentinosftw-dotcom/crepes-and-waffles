import rawProducts from './definitivosProductos.json'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

interface RawProduct {
  id?: string
  name?: string
  description?: string
  price?: number
  image?: string
  category?: string
  nombre?: string
  precio?: number
  descripcion?: string
  categoria_busqueda?: string
  imagen_fuente?: string
}

export interface MenuCategory {
  id: string
  name: string
  color?: string
  items: MenuItem[]
}

export interface MenuStyle {
  backgroundColor: string
  primaryColor: string
  secondaryColor: string
  textColor: string
  priceColor: string
  accentColor: string

  titleFontSize: number
  descriptionFontSize: number
  priceFontSize: number
  categoryFontSize: number
  fontFamily: string

  imageSize: 'small' | 'medium' | 'large' | 'full'
  imagePosition: 'left' | 'right' | 'top' | 'background'
  cardStyle: 'minimal' | 'bordered' | 'shadow' | 'glass'
  columns: 1 | 2 | 3
  spacing: 'compact' | 'normal' | 'spacious'
  textAlign: 'left' | 'center' | 'right'
  borderRadius: number

  showLogo: boolean
  logoUrl: string
  heroImageUrl: string
  headerText: string
  headerSubtitle: string
  headerStyle: 'centered' | 'left' | 'overlay'
}

export const defaultMenuStyle: MenuStyle = {
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
  heroImageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=1600&q=80',
  headerText: 'Crepes & Waffles Interior',
  headerSubtitle: '',
  headerStyle: 'centered'
}

export const sampleMenuData: MenuCategory[] = buildMenuData(rawProducts as RawProduct[])

function buildMenuData(products: RawProduct[]): MenuCategory[] {
  const categories = new Map<string, MenuCategory>()

  products.forEach((product, index) => {
    const categoryName = getCategoryName(product, index)
    const categoryId = slugify(categoryName)

    if (!categories.has(categoryId)) {
      categories.set(categoryId, { id: categoryId, name: categoryName, color: getCategoryColor(categoryName), items: [] })
    }

    const category = categories.get(categoryId)!
    const name = product.name?.trim() || product.nombre?.trim() || `Producto ${index + 1}`
    const price = typeof product.price === 'number' ? product.price : typeof product.precio === 'number' ? product.precio : 0

    category.items.push({
      id: product.id?.trim() || `product-${index + 1}`,
      name,
      description: product.description?.trim() || product.descripcion?.trim() || '',
      price,
      image: product.image || product.imagen_fuente || '/placeholder.jpg',
      category: categoryId
    })
  })

  return Array.from(categories.values())
}

export function getCategoryColor(categoryName: string) {
  const category = slugify(categoryName)
  if (category.includes('jugos')) return '#2f8f6b'
  if (category.includes('bebidas')) return '#2d6f9f'
  if (category.includes('sopas')) return '#b86b23'
  if (category.includes('ensaladas')) return '#4f8f3a'
  if (category.includes('mar')) return '#237c8f'
  if (category.includes('waffles')) return '#b06b2f'
  if (category.includes('crepes')) return '#8f2f23'
  if (category.includes('postres')) return '#9b4f7a'
  if (category.includes('desayunos')) return '#8a6f2a'
  if (category.includes('infantil')) return '#b24e63'
  return '#7f271c'
}

function getCategoryName(product: RawProduct, index: number) {
  if (product.category) return toTitleCase(product.category)
  if (product.categoria_busqueda) return toTitleCase(product.categoria_busqueda)

  if (index <= 53) return 'Bebidas'
  if (index <= 204) return 'Crepes y Platos Salados'
  if (index <= 250) return 'Ensaladas'
  if (index <= 353) return 'Postres, Waffles y Helados'
  if (index <= 566) return 'Desayunos y Brunch'
  return 'Menú Infantil y Adiciones'
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index > 0 && ['y', 'de', 'del', 'la', 'las', 'los'].includes(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
