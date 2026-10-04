import type { Operator } from '../types'

const STORAGE_KEY = 'tourlocal_operators'

export const SECTOR_EMOJIS: Record<string, string> = {
  Coffee: '☕',
  Tea: '🍵',
  Wine: '🍇',
  Cacao: '🍫',
  Spices: '🌶️',
  Rice: '🌾',
  Olive: '🫒',
  Agritourism: '🌿',
  Other: '🏡',
}

export const defaultOperators: Operator[] = [
  {
    id: 'noor-kenya',
    name: 'Noor Coffee Farm Experience',
    ownerName: 'Noor',
    country: 'Kenya',
    city: 'Nyeri Highlands',
    lat: -0.4168,
    lng: 36.9524,
    sector: 'Coffee',
    emoji: '☕',
    languages: ['Swahili', 'English'],
    description: 'Highland Arabica at 1750m. Morning harvest tours, sunset walks, full-day coffee journey from cherry to cup.',
    tourTypes: ['Morning Harvest', 'Sunset Walk', 'Full-Day Journey'],
    priceFrom: '$18/person',
    verified: true,
    registeredAt: '2026-01-15',
  },
  {
    id: 'carlos-colombia',
    name: 'Finca La Esperanza',
    ownerName: 'Carlos',
    country: 'Colombia',
    city: 'Huila',
    lat: 1.9781,
    lng: -75.2993,
    sector: 'Coffee',
    emoji: '☕',
    languages: ['Spanish', 'English'],
    description: 'Shade-grown specialty coffee in the Colombian Andes. Award-winning micro-lot harvests. Farm-to-cup tastings.',
    tourTypes: ['Cupping Session', 'Harvest Tour', 'Cooking Class'],
    priceFrom: '$22/person',
    verified: true,
    registeredAt: '2026-02-03',
  },
  {
    id: 'priya-india',
    name: "Priya's Darjeeling Tea Garden",
    ownerName: 'Priya',
    country: 'India',
    city: 'Darjeeling',
    lat: 27.0360,
    lng: 88.2627,
    sector: 'Tea',
    emoji: '🍵',
    languages: ['Bengali', 'Hindi', 'English'],
    description: 'Second-flush Darjeeling tea at 2000m. Learn to hand-roll leaves with local pickers. Panoramic Himalayan views.',
    tourTypes: ['Leaf Rolling', 'Tea Tasting', 'Sunrise Walk'],
    priceFrom: '$15/person',
    verified: true,
    registeredAt: '2026-02-20',
  },
  {
    id: 'lela-georgia',
    name: 'Lela\'s Qvevri Winery',
    ownerName: 'Lela',
    country: 'Georgia',
    city: 'Kakheti',
    lat: 41.6505,
    lng: 45.9764,
    sector: 'Wine',
    emoji: '🍇',
    languages: ['Georgian', 'Russian', 'English'],
    description: '8000-year-old winemaking tradition. Ancient qvevri clay jars, natural orange wine, grape harvest celebrations.',
    tourTypes: ['Harvest Fest', 'Cellar Tour', 'Traditional Feast'],
    priceFrom: '$20/person',
    verified: true,
    registeredAt: '2026-03-01',
  },
  {
    id: 'amara-ethiopia',
    name: 'Amara Yirgacheffe Estate',
    ownerName: 'Amara',
    country: 'Ethiopia',
    city: 'Yirgacheffe',
    lat: 6.1722,
    lng: 38.2094,
    sector: 'Coffee',
    emoji: '☕',
    languages: ['Amharic', 'Oromo', 'English'],
    description: 'Birthplace of coffee. Wild forest Arabica, traditional jebena ceremony, visit the legendary wild coffee trees.',
    tourTypes: ['Coffee Ceremony', 'Forest Walk', 'Processing Tour'],
    priceFrom: '$12/person',
    verified: true,
    registeredAt: '2026-03-15',
  },
  {
    id: 'budi-bali',
    name: 'Budi\'s Jatiluwih Rice Terrace',
    ownerName: 'Budi',
    country: 'Indonesia',
    city: 'Bali',
    lat: -8.3705,
    lng: 115.1308,
    sector: 'Rice',
    emoji: '🌾',
    languages: ['Balinese', 'Indonesian', 'English'],
    description: 'UNESCO World Heritage rice terraces. Traditional Subak water system, organic farming, Balinese cooking class.',
    tourTypes: ['Terrace Walk', 'Cooking Class', 'Sunrise Yoga'],
    priceFrom: '$25/person',
    verified: true,
    registeredAt: '2026-04-01',
  },
  {
    id: 'fatima-morocco',
    name: 'Fatima\'s Argan Cooperative',
    ownerName: 'Fatima',
    country: 'Morocco',
    city: 'Souss-Massa',
    lat: 30.4200,
    lng: -8.7600,
    sector: 'Spices',
    emoji: '🫒',
    languages: ['Amazigh', 'Arabic', 'French'],
    description: 'Women-led cooperative in the Argan forest. Press your own oil, learn about this UNESCO biosphere reserve.',
    tourTypes: ['Oil Pressing', 'Forest Walk', 'Cooking Demo'],
    priceFrom: '$10/person',
    verified: true,
    registeredAt: '2026-04-10',
  },
  {
    id: 'ana-peru',
    name: 'Ana\'s Sacred Valley Farm',
    ownerName: 'Ana',
    country: 'Peru',
    city: 'Cusco Region',
    lat: -13.5320,
    lng: -71.9675,
    sector: 'Agritourism',
    emoji: '🌿',
    languages: ['Quechua', 'Spanish', 'English'],
    description: 'Andean crops at 3500m: quinoa, purple corn, native potato varieties. Ancient Incan terracing still in use.',
    tourTypes: ['Harvest Walk', 'Traditional Cooking', 'Weaving Class'],
    priceFrom: '$16/person',
    verified: false,
    registeredAt: '2026-05-01',
  },
]

export function loadOperators(): Operator[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultOperators
    const custom: Operator[] = JSON.parse(saved)
    // Merge: defaults first, then any custom operators not in defaults
    const defaultIds = new Set(defaultOperators.map(o => o.id))
    const newCustom = custom.filter(o => !defaultIds.has(o.id))
    return [...defaultOperators, ...newCustom]
  } catch {
    return defaultOperators
  }
}

export function saveOperator(op: Operator): void {
  const all = loadOperators()
  const existing = all.findIndex(o => o.id === op.id)
  if (existing >= 0) all[existing] = op
  else all.push(op)
  // Only persist non-default operators
  const defaultIds = new Set(defaultOperators.map(o => o.id))
  const custom = all.filter(o => !defaultIds.has(o.id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
}
