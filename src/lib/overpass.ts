// Live OSM data — Section 7.3C: OpenStreetMap via Overpass API + Nominatim geocoding
// Falls back to pre-loaded OSM cache when live API is unavailable

export interface OSMPlace {
  id: number
  lat: number
  lng: number
  name: string
  tourism: string
  country: string
  tags: Record<string, string>
}

// ── Nominatim geocoding ─────────────────────────────────────────────────────────
async function getBbox(query: string): Promise<{
  bbox: [number, number, number, number]
  displayName: string
} | null> {
  const res = await fetch(
    `/api/nominatim?q=${encodeURIComponent(query)}&format=json&limit=3&featuretype=country,state,island,settlement&addressdetails=0`,
  )
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)
  const data: Array<{
    boundingbox: string[]
    display_name: string
    importance: number
    type: string
    class: string
  }> = await res.json()
  if (!data.length) return null

  // Pick the highest-importance result
  const best = data.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))[0]
  if (!best?.boundingbox) return null

  const [s, n, w, e] = best.boundingbox.map(Number)
  return { bbox: [s, n, w, e], displayName: best.display_name }
}

// ── Overpass QL query ───────────────────────────────────────────────────────────
function buildQuery(south: number, west: number, north: number, east: number): string {
  const bb = `${south},${west},${north},${east}`
  return (
    `[out:json][timeout:25];` +
    `(` +
    `node(${bb})[tourism=guest_house][name];` +
    `node(${bb})[tourism=hostel][name];` +
    `node(${bb})[tourism=camp_site][name];` +
    `node(${bb})[tourism=farm][name];` +
    `node(${bb})[tourism=lodge][name];` +
    `node(${bb})[tourism=chalet][name];` +
    `node(${bb})[tourism=motel][name];` +
    `way(${bb})[tourism=guest_house][name];` +
    `way(${bb})[tourism=camp_site][name];` +
    `);` +
    `out center 60;`
  )
}

async function queryOverpass(south: number, west: number, north: number, east: number): Promise<OSMPlace[]> {
  const query = buildQuery(south, west, north, east)
  console.log('Overpass query (first 150):', query.substring(0, 150))

  const res = await fetch('/api/overpass', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    const detail =
      res.status === 504 ? 'try a more specific region (e.g. "Nyeri Kenya" not "Kenya")'
      : res.status === 429 ? 'rate limit — wait a moment and retry'
      : `server returned ${res.status}`
    throw new Error(`Overpass: ${detail}. ${errText.slice(0, 80)}`)
  }

  const data: {
    elements?: Array<{
      id: number; lat?: number; lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }>
  } = await res.json()

  console.log('Overpass raw elements:', data.elements?.length ?? 0)

  const results = (data.elements ?? [])
    .map(el => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat ?? 0,
      lng: el.lon ?? el.center?.lon ?? 0,
      name: el.tags?.name ?? '',
      tourism: el.tags?.tourism ?? 'tourism',
      country: el.tags?.['addr:country'] ?? '',
      tags: el.tags ?? {},
    }))
    .filter(p => p.lat !== 0 && p.lng !== 0 && p.name !== '')

  console.log('Filtered:', results.length)
  return results
}

// ── Main export ─────────────────────────────────────────────────────────────────
export async function searchOSMOperators(query: string): Promise<{
  places: OSMPlace[]
  bbox: [number, number, number, number]
  displayName: string
  warning?: string
  fromCache?: boolean
}> {
  const geo = await getBbox(query)
  if (!geo) throw new Error(`Could not locate "${query}" — try adding the country (e.g. "Bali Indonesia")`)

  const [south, north, west, east] = geo.bbox
  const latSpan = Math.abs(north - south)
  const lngSpan = Math.abs(east - west)

  if (latSpan > 15 || lngSpan > 15) {
    throw new Error(
      `"${geo.displayName}" is too large (${latSpan.toFixed(0)}°×${lngSpan.toFixed(0)}°). Try a more specific region, province or island name.`
    )
  }

  const warning = geo.displayName.toLowerCase().includes(query.toLowerCase())
    ? undefined
    : `Showing results for "${geo.displayName}" — add a country name to be more specific`

  // Try live Overpass first, fall back to pre-loaded OSM cache
  try {
    const places = await queryOverpass(south, west, north, east)
    return { places, bbox: geo.bbox, displayName: geo.displayName, warning }
  } catch {
    // Import cache dynamically to avoid circular deps
    const { getCachedOSM } = await import('../data/osmCache')
    const cached = getCachedOSM(query)
    if (cached && cached.length > 0) {
      return {
        places: cached,
        bbox: geo.bbox,
        displayName: geo.displayName,
        warning,
        fromCache: true,
      }
    }
    // No cache either — show the gap message
    return { places: [], bbox: geo.bbox, displayName: geo.displayName, warning, fromCache: true }
  }
}

// ── Evidence data — World Development Indicators + UN Tourism ──────────────────
export interface TourismEvidence {
  gdpShare: string
  arrivals: string
  jobs: string
  note: string
  sources: string[]
}

const COUNTRY_EVIDENCE: Record<string, TourismEvidence> = {
  kenya: { gdpShare: '10.4%', arrivals: '1.4M', jobs: '1.1M',
    note: 'Small operators account for ~80% of tourism employment; most lack digital presence',
    sources: ['World Development Indicators, World Bank 2023', 'UN Tourism (UNWTO) 2019'] },
  ethiopia: { gdpShare: '3.7%', arrivals: '812K', jobs: '1.2M',
    note: 'Birthplace of coffee — agritourism severely underserved and undiscoverable',
    sources: ['World Development Indicators, World Bank 2023', 'UNWTO 2019'] },
  colombia: { gdpShare: '5.1%', arrivals: '4.5M', jobs: '1.9M',
    note: 'Coffee region (Eje Cafetero) is UNESCO World Heritage — most farms invisible online',
    sources: ['World Development Indicators, World Bank 2023', 'UNWTO 2019'] },
  india: { gdpShare: '6.8%', arrivals: '17.9M', jobs: '87M',
    note: 'Rural/agritourism growing 30% annually but mostly informal and undiscoverable',
    sources: ['World Development Indicators, World Bank 2023', 'Indian Tourism Statistics 2020'] },
  indonesia: { gdpShare: '5.7%', arrivals: '16.1M', jobs: '13M',
    note: 'Bali hosts 6M visitors/yr; small farm operators remain undiscoverable online',
    sources: ['World Development Indicators, World Bank 2023', 'UNWTO 2019'] },
  bali: { gdpShare: '5.7%', arrivals: '6M (Bali)', jobs: '1.2M (Bali)',
    note: "Bali's cultural farms and eco-lodges are largely undiscoverable without a digital presence",
    sources: ['World Development Indicators, World Bank 2023', 'Bali Tourism Board 2023'] },
  morocco: { gdpShare: '12.9%', arrivals: '13.1M', jobs: '2.2M',
    note: 'Women-led cooperatives serve <5% of visitors due to lack of digital presence',
    sources: ['World Development Indicators, World Bank 2023', 'World Bank Enterprise Survey 2020'] },
  peru: { gdpShare: '3.9%', arrivals: '4.4M', jobs: '1.2M',
    note: 'Andean community tourism growing but discovery is almost entirely word-of-mouth',
    sources: ['World Development Indicators, World Bank 2023', 'UNWTO 2019'] },
  georgia: { gdpShare: '11.4%', arrivals: '7.7M', jobs: '240K',
    note: 'Wine tourism fastest-growing sector; most operators lack multilingual tools',
    sources: ['World Development Indicators, World Bank 2023', 'UNWTO 2019'] },
  gambia: { gdpShare: '20.3%', arrivals: '471K', jobs: '43K',
    note: 'World Bank-supported case study for small operator digitalisation (cited in brief)',
    sources: ['World Development Indicators, World Bank 2023', 'World Bank Gambia Tourism Project'] },
  jordan: { gdpShare: '14.5%', arrivals: '4.5M', jobs: '260K',
    note: 'World Bank trained small operators on digital platforms — cited directly in the challenge brief',
    sources: ['World Development Indicators, World Bank 2023', 'World Bank Jordan Tourism'] },
}

const GLOBAL_EVIDENCE: TourismEvidence = {
  gdpShare: '10%', arrivals: '1.4B', jobs: '330M (1 in 10 globally)',
  note: 'Most small operators in the Global South remain undiscoverable online',
  sources: ['UN Tourism (UNWTO) World Tourism Barometer 2023', 'World Development Indicators, World Bank 2023'],
}

export function getEvidence(query: string): TourismEvidence {
  const key = query.toLowerCase().trim()
  return (
    COUNTRY_EVIDENCE[key] ??
    Object.entries(COUNTRY_EVIDENCE).find(([k]) => key.includes(k) || k.includes(key))?.[1] ??
    GLOBAL_EVIDENCE
  )
}
