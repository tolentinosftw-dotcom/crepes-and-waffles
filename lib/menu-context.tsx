'use client'

import { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from 'react'
import { MenuCategory, MenuStyle, MenuItem, defaultMenuStyle, getCategoryColor, sampleMenuData } from './types'

interface MenuContextType {
  categories: MenuCategory[]
  setCategories: Dispatch<SetStateAction<MenuCategory[]>>
  style: MenuStyle
  setStyle: (style: MenuStyle) => void
  updateStyle: (updates: Partial<MenuStyle>) => void
  addCategory: (name: string) => void
  removeCategory: (id: string) => void
  updateCategory: (id: string, name: string) => void
  organizeCategories: () => void
  addItem: (categoryId: string, item: Omit<MenuItem, 'id' | 'category'>) => void
  removeItem: (categoryId: string, itemId: string) => void
  updateItem: (categoryId: string, itemId: string, updates: Partial<MenuItem>) => void
  activeTab: 'products' | 'design' | 'preview'
  setActiveTab: (tab: 'products' | 'design' | 'preview') => void
  selectedCategory: string | null
  setSelectedCategory: (id: string | null) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)
const PRODUCT_DATA_COUNT = sampleMenuData.reduce((total, category) => total + category.items.length, 0)
const lastCategory = sampleMenuData[sampleMenuData.length - 1]
const lastItem = lastCategory?.items[lastCategory.items.length - 1]
const firstItem = sampleMenuData[0]?.items[0]
const PRODUCT_DATA_SIGNATURE = `catalog-v4:${PRODUCT_DATA_COUNT}:${sampleMenuData.map(category => category.name).join('|')}:${firstItem?.name ?? ''}:${firstItem?.price ?? 0}:${firstItem?.image ?? ''}:${lastItem?.name ?? ''}:${lastItem?.price ?? 0}:${lastItem?.image ?? ''}`
const CATEGORY_RULES = [
  { id: 'jugos-bebidas', name: 'Jugos y Bebidas', words: ['jugo', 'jugos', 'jugi', 'limonada', 'batido', 'malteada', 'agua', 'gaseosa', 'soda', 'coca', 'schweppes', 'cerveza', 'vino', 'mimosa', 'cafe', 'café', 'capuccino', 'espresso', 'macchiato', 'chocolate', 'milo', 'chai', 'aromatica', 'aromática'] },
  { id: 'sopas-cremas', name: 'Sopas y Cremas', words: ['sopa', 'sopas', 'crema', 'cremas', 'lentejas', 'cebolla', 'ahuyama', 'covarachia', 'covarachía'] },
  { id: 'crepes-salados', name: 'Crepes Salados', words: ['crepe', 'crepes', 'pollo', 'ternera', 'lomo', 'lomito', 'stroganoff', 'mexicano', 'pita', 'pocket', 'salmon', 'salmón', 'camarones', 'calamares', 'atun', 'atún', 'palmitos'] },
  { id: 'waffles', name: 'Waffles', words: ['waffle', 'waffles'] },
  { id: 'ensaladas', name: 'Ensaladas', words: ['ensalada', 'ensaladas', 'kale', 'cesar', 'césar', 'tomatina'] },
  { id: 'postres-helados', name: 'Postres y Helados', words: ['postre', 'postres', 'helado', 'helados', 'cono', 'copa', 'arequipe', 'nutella', 'chocolate', 'frutos', 'parfait', 'tostada francesa', 'panqueque', 'pancake'] },
  { id: 'desayunos', name: 'Desayunos', words: ['desayuno', 'huevo', 'huevos', 'omelette', 'benedictine', 'açai', 'acai', 'tostada', 'parisien', 'campesino'] },
  { id: 'infantil', name: 'Menu Infantil', words: ['infantil', 'niño', 'niños', 'mickey', 'payaso', 'snowman', 'gummy', 'samy', 'piggy', 'rodolfo'] }
]

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MenuCategory[]>(sampleMenuData)
  const [style, setStyle] = useState<MenuStyle>(defaultMenuStyle)
  const [activeTab, setActiveTab] = useState<'products' | 'design' | 'preview'>('products')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('crepes-menu-builder')
    if (!saved) {
      setLoaded(true)
      return
    }

    try {
      const parsed = JSON.parse(saved) as { categories?: MenuCategory[]; style?: MenuStyle; dataSignature?: string }
      if (parsed.categories) {
        setCategories(parsed.dataSignature === PRODUCT_DATA_SIGNATURE ? ensureCategoryColors(parsed.categories) : sampleMenuData)
      }
      if (parsed.style) {
        const nextStyle = { ...defaultMenuStyle, ...parsed.style }
        const subtitle = nextStyle.headerSubtitle?.toLowerCase() ?? ''
        if (subtitle.includes('menú digital editable') || subtitle.includes('menÃº digital editable')) {
          nextStyle.headerSubtitle = ''
        }
        setStyle(nextStyle)
      }
    } catch {
      window.localStorage.removeItem('crepes-menu-builder')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem('crepes-menu-builder', JSON.stringify({ categories, style, dataSignature: PRODUCT_DATA_SIGNATURE }))
  }, [categories, loaded, style])

  const updateStyle = (updates: Partial<MenuStyle>) => {
    setStyle(prev => ({ ...prev, ...updates }))
  }

  const addCategory = (name: string) => {
    const newCategory: MenuCategory = {
      id: Date.now().toString(),
      name,
      color: getCategoryColor(name),
      items: []
    }
    setCategories(prev => [...prev, newCategory])
  }

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ))
  }

  const organizeCategories = () => {
    setCategories(prev => categorizeMenu(prev))
    setSelectedCategory(null)
  }

  const addItem = (categoryId: string, item: Omit<MenuItem, 'id' | 'category'>) => {
    const newItem: MenuItem = {
      ...item,
      id: Date.now().toString(),
      category: categoryId
    }
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ))
  }

  const removeItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
        : cat
    ))
  }

  const updateItem = (categoryId: string, itemId: string, updates: Partial<MenuItem>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            items: cat.items.map(item => 
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : cat
    ))
  }

  return (
    <MenuContext.Provider value={{
      categories,
      setCategories,
      style,
      setStyle,
      updateStyle,
      addCategory,
      removeCategory,
      updateCategory,
      organizeCategories,
      addItem,
      removeItem,
      updateItem,
      activeTab,
      setActiveTab,
      selectedCategory,
      setSelectedCategory
    }}>
      {children}
    </MenuContext.Provider>
  )
}

function categorizeMenu(categories: MenuCategory[]) {
  const buckets = new Map<string, MenuCategory>()

  for (const rule of CATEGORY_RULES) {
    buckets.set(rule.id, { id: rule.id, name: rule.name, color: getCategoryColor(rule.name), items: [] })
  }
  buckets.set('otros', { id: 'otros', name: 'Otros', color: getCategoryColor('Otros'), items: [] })

  for (const item of categories.flatMap(category => category.items)) {
    const category = getItemCategory(item)
    buckets.get(category.id)!.items.push({ ...item, category: category.id })
  }

  return Array.from(buckets.values()).filter(category => category.items.length > 0)
}

function ensureCategoryColors(categories: MenuCategory[]) {
  return categories.map((category) => ({
    ...category,
    color: category.color || getCategoryColor(category.name)
  }))
}

function getItemCategory(item: MenuItem) {
  const text = normalizeText(`${item.name} ${item.description}`)
  return CATEGORY_RULES.find(rule => rule.words.some(word => text.includes(normalizeText(word)))) ?? { id: 'otros', name: 'Otros' }
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}
