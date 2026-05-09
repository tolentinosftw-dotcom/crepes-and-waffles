'use client'

import { memo, startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { MenuCategory, MenuItem } from '@/lib/types'
import { useMenu } from '@/lib/menu-context'
import { formatMenuPrice, languages as supportedLanguages, preloadMenuTranslations, translateText, uiCopy } from '@/lib/menu-i18n'
import { Search, Star, X } from 'lucide-react'

type LanguageCode = 'es' | 'en' | 'fr' | 'it' | 'zh' | 'ja' | 'hi'
type TranslatedMenuItem = MenuItem & {
  translatedName: string
  translatedDescription: string
  translatedPrice: string
  translatedRatingLabel: string
  translatedViewImageLabel: string
}

type TranslatedMenuCategory = Omit<MenuCategory, 'items'> & {
  translatedName: string
  items: TranslatedMenuItem[]
}

type RatingStats = { average: number; count: number; sum?: number }

export function ClientMenu() {
  const { categories, style } = useMenu()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [language, setLanguage] = useState<LanguageCode>('es')
  const [selectedItem, setSelectedItem] = useState<TranslatedMenuItem | null>(null)
  const [ratings, setRatings] = useState<Record<string, RatingStats>>({})
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})
  const deferredQuery = useDeferredValue(query)
  const text = uiCopy[language]
  const logoUrl = style.logoUrl || '/logo.webp'
  const showingFavorites = activeCategory === 'favorites'

  useEffect(() => {
    const savedUserRatings = window.localStorage.getItem('crepes-product-user-ratings')

    try {
      if (savedUserRatings) setUserRatings(JSON.parse(savedUserRatings) as Record<string, number>)
    } catch {
      window.localStorage.removeItem('crepes-product-user-ratings')
    }

    void loadSharedRatings()
  }, [])

  useEffect(() => {
    const values = [
      style.headerText,
      ...categories.flatMap((category) => [
        category.name,
        ...category.items.flatMap((item) => [item.name, item.description])
      ])
    ].filter(Boolean)

    const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), 1))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = schedule(() => preloadMenuTranslations(values))

    return () => cancel(handle)
  }, [categories, style.headerText])

  const loadSharedRatings = async () => {
    try {
      const response = await fetch('/api/ratings', { cache: 'no-store' })
      if (!response.ok) return
      const payload = await response.json() as { ratings?: Record<string, RatingStats> }
      setRatings(payload.ratings ?? {})
    } catch {
      setRatings({})
    }
  }

  const translatedCategories = useMemo<TranslatedMenuCategory[]>(() => {
    return categories.map((category) => ({
      ...category,
      translatedName: translateText(category.name, language),
      items: category.items.map((item) => {
        const translatedName = translateText(item.name, language)

        return {
          ...item,
          translatedName,
          translatedDescription: translateText(item.description, language),
          translatedPrice: formatMenuPrice(item.price, language),
          translatedRatingLabel: `${text.ratingLabel}: ${translatedName}`,
          translatedViewImageLabel: `${text.viewImage}: ${translatedName}`
        }
      })
    }))
  }, [categories, language, text.ratingLabel, text.viewImage])

  const visibleCategories = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    if (showingFavorites) return []

    return translatedCategories
      .filter((category) => activeCategory === 'all' || category.id === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedQuery) return true
          return `${item.translatedName} ${item.translatedDescription}`.toLowerCase().includes(normalizedQuery)
        })
      }))
      .filter((category) => category.items.length > 0)
  }, [activeCategory, deferredQuery, showingFavorites, translatedCategories])

  const favoriteItems = useMemo(() => {
    return translatedCategories
      .flatMap((category) => category.items)
      .filter((item) => getRatingStats(item.id, ratings).count > 0)
      .sort((first, second) => {
        const firstStats = getRatingStats(first.id, ratings)
        const secondStats = getRatingStats(second.id, ratings)
        return secondStats.average - firstStats.average || secondStats.count - firstStats.count
      })
  }, [ratings, translatedCategories])

  const rateItem = async (itemId: string, rating: number) => {
    const previousRating = userRatings[itemId]
    const nextUserRatings = { ...userRatings, [itemId]: rating }
    setUserRatings(nextUserRatings)
    window.localStorage.setItem('crepes-product-user-ratings', JSON.stringify(nextUserRatings))

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, rating, previousRating })
      })
      if (!response.ok) throw new Error('Rating request failed')
      const payload = await response.json() as { itemId: string; stats: RatingStats }
      setRatings((current) => ({ ...current, [payload.itemId]: payload.stats }))
    } catch {
      await loadSharedRatings()
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: style.backgroundColor, color: style.textColor, fontFamily: style.fontFamily }}>
      <section className="relative overflow-hidden px-4 py-8 text-white sm:py-10">
        <img src={style.heroImageUrl || '/placeholder.jpg'} alt="" loading="eager" decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${style.primaryColor}f5, ${style.primaryColor}b8)` }} />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <img src={logoUrl} alt="Crepes & Waffles" width={56} height={56} loading="eager" decoding="async" fetchPriority="high" className="h-14 w-14 rounded-full bg-white object-cover ring-2 ring-white/50" />
            <LanguagePicker language={language} onChange={(nextLanguage) => startTransition(() => setLanguage(nextLanguage))} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-sm">{text.digitalMenu}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{translateText(style.headerText, language)}</h1>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a5b3e]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.search}
              className="h-11 w-full rounded-lg border border-[#e6d7c5] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#d8b56d]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <CategoryButton active={activeCategory === 'all'} label={text.all} onClick={() => setActiveCategory('all')} />
            <CategoryButton active={showingFavorites} label={text.favoritesTab} onClick={() => setActiveCategory('favorites')} />
            {translatedCategories.map((category) => (
              <CategoryButton key={category.id} active={activeCategory === category.id} label={category.translatedName} color={category.color} onClick={() => setActiveCategory(category.id)} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
        {showingFavorites && favoriteItems.length > 0 && (
          <div className="menu-category-section mb-9 rounded-lg border border-[#eadfce] bg-white/55 p-3 shadow-sm sm:p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: style.primaryColor }}>{text.favoritesTitle}</h2>
              <p className="mt-1 text-sm" style={{ color: style.secondaryColor }}>{text.favoritesText}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {favoriteItems.map((item) => (
                <MemoProductCard
                  key={item.id}
                  item={item}
                  rating={userRatings[item.id] ?? 0}
                  ratingStats={getRatingStats(item.id, ratings)}
                  textColor={style.textColor}
                  priceColor={style.priceColor}
                  secondaryColor={style.secondaryColor}
                  onOpen={() => setSelectedItem(item)}
                  onRate={(rating) => rateItem(item.id, rating)}
                />
              ))}
            </div>
          </div>
        )}

        {visibleCategories.map((category) => (
          <div key={category.id} className="menu-category-section mb-8">
            <h2 className="mb-4 text-xl font-bold sm:text-2xl" style={{ color: category.color || style.primaryColor }}>{category.translatedName}</h2>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item) => (
                <MemoProductCard
                  key={item.id}
                  item={item}
                  rating={userRatings[item.id] ?? 0}
                  ratingStats={getRatingStats(item.id, ratings)}
                  textColor={style.textColor}
                  priceColor={style.priceColor}
                  secondaryColor={style.secondaryColor}
                  categoryColor={category.color}
                  onOpen={() => setSelectedItem(item)}
                  onRate={(rating) => rateItem(item.id, rating)}
                />
              ))}
            </div>
          </div>
        ))}

        {((showingFavorites && favoriteItems.length === 0) || (!showingFavorites && visibleCategories.length === 0)) && (
          <div className="rounded-lg border border-[#eadfce] bg-white px-4 py-12 text-center">
            <p className="font-semibold">{text.emptyTitle}</p>
            <p className="mt-1 text-sm opacity-70">{text.emptyText}</p>
          </div>
        )}
      </section>

      {selectedItem && (
        <ProductModal item={selectedItem} closeLabel={text.close} onClose={() => setSelectedItem(null)} priceColor={style.priceColor} textColor={style.textColor} secondaryColor={style.secondaryColor} />
      )}

      <footer className="px-4 pb-5 pt-2 text-center text-[11px] text-[#8a5b3e]/45">
        desarrollado por tolentinosw Â· tolentinosftw@gmail.com
      </footer>
    </main>
  )
}

function ProductCard({
  item,
  rating,
  ratingStats,
  textColor,
  priceColor,
  secondaryColor,
  categoryColor,
  onOpen,
  onRate
}: {
  item: TranslatedMenuItem
  rating: number
  ratingStats: { average: number; count: number }
  textColor: string
  priceColor: string
  secondaryColor: string
  categoryColor?: string
  onOpen: () => void
  onRate: (rating: number) => void
}) {
  return (
    <article className="menu-product-card flex h-full min-h-[292px] w-full flex-col overflow-hidden rounded-lg border bg-white text-left shadow-sm sm:min-h-[340px]" style={{ borderColor: categoryColor ? `${categoryColor}55` : '#eadfce' }}>
      <button
        onClick={onOpen}
        className="flex flex-1 flex-col text-left transition-transform active:scale-[0.99]"
        aria-label={item.translatedViewImageLabel}
      >
        <div className="aspect-square w-full shrink-0 overflow-hidden bg-[#faf7f1]">
          <img
            src={item.image || '/placeholder.jpg'}
            alt={item.translatedName}
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3 pb-2">
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight sm:text-base" style={{ color: textColor }}>{item.translatedName}</h3>
            <p className="text-sm font-bold sm:text-base" style={{ color: priceColor }}>{item.translatedPrice}</p>
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-3 text-xs leading-4 sm:text-sm sm:leading-5" style={{ color: secondaryColor }}>{item.translatedDescription}</p>
          )}
        </div>
      </button>
      <div className="border-t border-[#eadfce] px-2 py-2">
        <RatingStars rating={rating} stats={ratingStats} label={item.translatedRatingLabel} onRate={onRate} />
      </div>
    </article>
  )
}

const MemoProductCard = memo(ProductCard)

function RatingStars({
  rating,
  stats,
  label,
  onRate
}: {
  rating: number
  stats: { average: number; count: number }
  label: string
  onRate: (rating: number) => void
}) {
  return (
    <div className="space-y-1" aria-label={label}>
      <div className="text-center text-xs font-semibold text-[#8a5b3e]">
        {stats.count > 0 ? `${stats.average.toFixed(1)} (${stats.count})` : '0.0 (0)'}
      </div>
      <div className="flex items-center justify-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRate(value)}
            className="rounded-full p-1 text-[#d8b56d] transition-colors hover:bg-[#f4eadf]"
            aria-label={`${label} ${value}`}
          >
            <Star className={`h-4 w-4 ${value <= (rating || Math.round(stats.average)) ? 'fill-[#d8b56d]' : 'fill-transparent'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductModal({
  item,
  closeLabel,
  onClose,
  priceColor,
  textColor,
  secondaryColor
}: {
  item: TranslatedMenuItem
  closeLabel: string
  onClose: () => void
  priceColor: string
  textColor: string
  secondaryColor: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <article className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative bg-gray-100">
          <img src={item.image || '/placeholder.jpg'} alt={item.translatedName} width={900} height={900} loading="eager" decoding="async" fetchPriority="high" className="max-h-[58vh] w-full object-contain" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#2f211b] shadow"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-bold leading-tight" style={{ color: textColor }}>{item.translatedName}</h3>
            <p className="shrink-0 text-xl font-bold" style={{ color: priceColor }}>{item.translatedPrice}</p>
          </div>
          {item.description && <p className="mt-3 leading-7" style={{ color: secondaryColor }}>{item.translatedDescription}</p>}
        </div>
      </article>
    </div>
  )
}

function LanguagePicker({ language, onChange }: { language: LanguageCode; onChange: (language: LanguageCode) => void }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/15 p-1 backdrop-blur">
      {supportedLanguages.map((item) => (
        <button
          key={item.code}
          onClick={() => onChange(item.code)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${language === item.code ? 'bg-white' : 'hover:bg-white/20'}`}
          title={item.label}
          aria-label={item.label}
        >
          <img src={item.flag} alt="" aria-hidden="true" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover" />
        </button>
      ))}
    </div>
  )
}

function CategoryButton({ active, label, color, onClick }: { active: boolean; label: string; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors"
      style={active ? { backgroundColor: color || '#7f271c', color: '#fff' } : { backgroundColor: color ? `${color}18` : '#f4eadf', color: color || '#6c4a37' }}
    >
      {label}
    </button>
  )
}

function getRatingStats(itemId: string, ratings: Record<string, RatingStats>) {
  const stats = ratings[itemId]

  if (!stats || stats.count <= 0) return { average: 0, count: 0 }
  return { average: stats.average, count: stats.count }
}
