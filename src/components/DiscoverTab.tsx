import { useState, useEffect, useRef } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, Plus, X, MapPin, CheckCircle2, Loader2, Globe, ExternalLink, TrendingUp } from 'lucide-react'
import type { Operator } from '../types'
import { loadOperators, saveOperator, SECTOR_EMOJIS } from '../data/operators'
import { searchOSMOperators, getEvidence, type OSMPlace, type TourismEvidence } from '../lib/overpass'

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const CACHE_NAME = 'tourlocal-map-tiles-v1'

// ── Tile layer with Cache API fallback ──────────────────────────────────────────
function OfflineTileLayer() {
  const map = useMap()
  useEffect(() => {
    const OfflineLayer = L.TileLayer.extend({
      createTile(coords: L.Coords, done: L.DoneCallback) {
        const tile = L.DomUtil.create('img', 'leaflet-tile') as HTMLImageElement
        tile.alt = ''
        const url = (this as L.TileLayer).getTileUrl(coords)
        ;(async () => {
          try {
            const cache = await caches.open(CACHE_NAME)
            const cached = await cache.match(url)
            tile.src = cached ? URL.createObjectURL(await cached.blob()) : url
          } catch { tile.src = url }
          tile.onload = () => done(undefined, tile)
          tile.onerror = () => done(new Error('tile failed'), tile)
        })()
        return tile
      },
    })
    const layer = new (OfflineLayer as new (url: string, opts: object) => L.TileLayer)(
      OSM_TILE_URL,
      { attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, subdomains: ['a', 'b', 'c'] }
    )
    map.addLayer(layer)
    return () => { map.removeLayer(layer) }
  }, [map])
  return null
}

// ── Fly to bounding box when search completes ───────────────────────────────────
function FlyToBbox({ bbox }: { bbox: [number, number, number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bbox) return
    const [south, north, west, east] = bbox
    map.fitBounds([[south, west], [north, east]], { padding: [20, 20], maxZoom: 10 })
  }, [bbox, map])
  return null
}

// ── Marker icon helpers ─────────────────────────────────────────────────────────
function makeNetworkIcon(emoji: string, verified: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">
      ${emoji}${verified ? '<sup style="font-size:9px">✓</sup>' : ''}
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 24], popupAnchor: [0, -24],
  })
}

const OSM_TOURISM_EMOJI: Record<string, string> = {
  farm: '🏡', guest_house: '🛏️', hostel: '🏨', chalet: '🏔️',
  camp_site: '⛺', lodge: '🌿', wilderness_hut: '🏕️', attraction: '📍',
}

function makeOSMIcon(tourism: string) {
  const emoji = OSM_TOURISM_EMOJI[tourism] ?? '📍'
  return L.divIcon({
    className: '',
    html: `<div style="font-size:18px;line-height:1;background:white;border:2px solid #0ea5e9;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)">${emoji}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
  })
}

// ── Register form types ─────────────────────────────────────────────────────────
const SECTORS = Object.keys(SECTOR_EMOJIS)
type RegisterForm = {
  name: string; ownerName: string; country: string; city: string
  lat: string; lng: string; sector: string; languages: string
  description: string; tourTypes: string; priceFrom: string
}
const EMPTY_FORM: RegisterForm = {
  name: '', ownerName: '', country: '', city: '',
  lat: '', lng: '', sector: 'Coffee', languages: '',
  description: '', tourTypes: '', priceFrom: '',
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function DiscoverTab() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [selected, setSelected] = useState<Operator | null>(null)
  const [selectedOSM, setSelectedOSM] = useState<OSMPlace | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM)
  const [locating, setLocating] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [osmResults, setOsmResults] = useState<OSMPlace[]>([])
  const [evidence, setEvidence] = useState<TourismEvidence | null>(null)
  const [currentBbox, setCurrentBbox] = useState<[number, number, number, number] | null>(null)
  const [geoDisplayName, setGeoDisplayName] = useState('')
  const [geoWarning, setGeoWarning] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [activeView, setActiveView] = useState<'network' | 'osm'>('network')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setOperators(loadOperators()) }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    setOsmResults([])
    setSelectedOSM(null)
    setGeoWarning('')
    try {
      const { places, bbox, displayName, warning, fromCache: cached } = await searchOSMOperators(searchQuery.trim())
      setOsmResults(places)
      setCurrentBbox(bbox)
      setGeoDisplayName(displayName)
      setGeoWarning(warning ?? '')
      setFromCache(cached ?? false)
      setEvidence(getEvidence(searchQuery.trim()))
      setActiveView('osm')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleRegister() {
    if (!form.name || !form.ownerName || !form.country) return
    const op: Operator = {
      id: `${form.ownerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: form.name, ownerName: form.ownerName,
      country: form.country, city: form.city,
      lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0,
      sector: form.sector, emoji: SECTOR_EMOJIS[form.sector] ?? '🏡',
      languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
      description: form.description,
      tourTypes: form.tourTypes.split(',').map(t => t.trim()).filter(Boolean),
      priceFrom: form.priceFrom, verified: false,
      registeredAt: new Date().toISOString().split('T')[0],
    }
    saveOperator(op)
    setOperators(loadOperators())
    setSelected(op)
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  function prefillFromOSM(place: OSMPlace) {
    setForm({
      name: place.name,
      ownerName: '', country: place.country || searchQuery,
      city: place.tags['addr:city'] ?? place.tags['addr:place'] ?? '',
      lat: place.lat.toFixed(4), lng: place.lng.toFixed(4),
      sector: place.tourism === 'farm' ? 'Agritourism' : 'Other',
      languages: '',
      description: [place.tags.description, place.tags.note].filter(Boolean).join(' ') || '',
      tourTypes: '', priceFrom: '',
    })
    setShowForm(true)
    setSelectedOSM(null)
  }

  function detectLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }))
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const validNetwork = operators.filter(o => o.lat !== 0 && o.lng !== 0)
  const validOSM = osmResults.filter(o => o.lat !== 0 && o.lng !== 0)

  return (
    <div className="flex flex-col h-full relative">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-3 pt-3 pb-2 border-b border-stone-100 flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search country or region (e.g. Kenya, Bali)…"
            className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="bg-coffee-700 text-white px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          {searching ? '' : 'Search'}
        </button>
      </form>

      {/* Evidence banner */}
      {evidence && (
        <div className="mx-3 mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-blue-700">
                Tourism evidence — {searchQuery}
              </span>
            </div>
          </div>
          {geoDisplayName && (
            <p className="text-xs text-blue-500 mb-2">📍 Resolved to: <span className="font-medium">{geoDisplayName.split(',').slice(0, 3).join(',')}</span></p>
          )}
          {geoWarning && (
            <p className="text-xs text-amber-600 mb-2">⚠️ {geoWarning}</p>
          )}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { label: 'GDP share', val: evidence.gdpShare },
              { label: 'Arrivals', val: evidence.arrivals },
              { label: 'Jobs', val: evidence.jobs },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="font-bold text-blue-800 text-sm">{val}</p>
                <p className="text-xs text-blue-500">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-700 italic">{evidence.note}</p>
          <p className="text-xs text-blue-400 mt-1">{evidence.sources.join(' · ')}</p>
        </div>
      )}

      {/* Map */}
      <div className="h-56 flex-shrink-0 mt-2">
        <MapContainer
          center={[15, 20]} zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false} minZoom={2}
        >
          <OfflineTileLayer />
          <FlyToBbox bbox={currentBbox} />

          {/* TourLocal network operators */}
          {validNetwork.map(op => (
            <Marker key={op.id} position={[op.lat, op.lng]}
              icon={makeNetworkIcon(op.emoji, op.verified)}
              eventHandlers={{ click: () => { setSelected(op); setSelectedOSM(null) } }}
            >
              <Popup><strong>{op.name}</strong><br /><span className="text-xs">{op.city}, {op.country}</span></Popup>
            </Marker>
          ))}

          {/* Live OSM results */}
          {validOSM.map(place => (
            <Marker key={place.id} position={[place.lat, place.lng]}
              icon={makeOSMIcon(place.tourism)}
              eventHandlers={{ click: () => { setSelectedOSM(place); setSelected(null) } }}
            >
              <Popup>
                <strong>{place.name}</strong><br />
                <span className="text-xs text-blue-600">{place.tourism} · OSM #{place.id}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Error */}
      {searchError && (
        <p className="mx-3 mt-2 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{searchError}</p>
      )}

      {/* View tabs */}
      <div className="flex border-b border-stone-100 px-3 mt-2">
        <button
          onClick={() => setActiveView('network')}
          className={`flex-1 text-xs font-semibold py-2 border-b-2 transition-colors ${activeView === 'network' ? 'border-coffee-600 text-coffee-700' : 'border-transparent text-stone-400'}`}
        >
          🌐 TourLocal Network ({operators.length})
        </button>
        <button
          onClick={() => setActiveView('osm')}
          className={`flex-1 text-xs font-semibold py-2 border-b-2 transition-colors ${activeView === 'osm' ? 'border-blue-500 text-blue-600' : 'border-transparent text-stone-400'}`}
        >
          📍 OSM Data {osmResults.length > 0 ? `(${osmResults.length})` : ''}
          {fromCache && osmResults.length > 0 && <span className="ml-1 text-amber-500">●</span>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Selected network operator */}
        {selected && activeView === 'network' && (
          <div className="m-3 bg-coffee-50 border border-coffee-200 rounded-2xl p-4 relative">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-stone-400"><X size={16} /></button>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{selected.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-coffee-800 text-sm">{selected.name}</h3>
                  {selected.verified && <CheckCircle2 size={14} className="text-farm-600" />}
                </div>
                <p className="text-xs text-coffee-600">{selected.ownerName} · {selected.city}, {selected.country}</p>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{selected.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selected.languages.map(l => (
                    <span key={l} className="text-xs bg-white border border-coffee-200 text-coffee-700 px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
                <p className="text-xs font-semibold text-farm-700 mt-2">From {selected.priceFrom}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected OSM place */}
        {selectedOSM && activeView === 'osm' && (
          <div className="m-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 relative">
            <button onClick={() => setSelectedOSM(null)} className="absolute top-3 right-3 text-stone-400"><X size={16} /></button>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{OSM_TOURISM_EMOJI[selectedOSM.tourism] ?? '📍'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-800 text-sm">{selectedOSM.name}</h3>
                <p className="text-xs text-blue-500 mt-0.5 capitalize">{selectedOSM.tourism.replace(/_/g, ' ')} · OpenStreetMap</p>
                {selectedOSM.tags.description && (
                  <p className="text-xs text-stone-600 mt-1">{selectedOSM.tags.description}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <ExternalLink size={10} className="text-stone-400" />
                  <a
                    href={`https://www.openstreetmap.org/node/${selectedOSM.id}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-blue-500 underline"
                  >
                    View on OSM
                  </a>
                </div>
                <button
                  onClick={() => prefillFromOSM(selectedOSM)}
                  className="mt-3 w-full bg-coffee-700 text-white text-xs font-semibold py-2 rounded-xl"
                >
                  + Add to TourLocal Network
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Network list */}
        {activeView === 'network' && (
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                {operators.length} operators · {new Set(operators.map(o => o.country)).size} countries
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 bg-coffee-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl"
              >
                <Plus size={12} /> Register
              </button>
            </div>
            {operators.map(op => (
              <button key={op.id} onClick={() => setSelected(selected?.id === op.id ? null : op)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${selected?.id === op.id ? 'border-coffee-300 bg-coffee-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
              >
                <span className="text-2xl shrink-0">{op.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-stone-800 truncate">{op.name}</p>
                    {op.verified && <CheckCircle2 size={12} className="text-farm-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-stone-500 truncate">{op.city}, {op.country} · {op.languages.slice(0, 2).join(' · ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-coffee-700">{op.priceFrom}</p>
                  <p className="text-xs text-stone-400">{op.sector}</p>
                </div>
              </button>
            ))}
            <p className="text-xs text-stone-400 text-center pt-1 pb-2">
              Map: OpenStreetMap (§7.3C) · Evidence: WDI World Bank + UN Tourism
            </p>
          </div>
        )}

        {/* OSM results list */}
        {activeView === 'osm' && (
          <div className="p-3 space-y-2">
            {osmResults.length === 0 && !searching && !searchError && !currentBbox && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-sm text-stone-600 font-medium">Search a country to find real operators</p>
                <p className="text-xs text-stone-400 mt-1">Live data from OpenStreetMap via Overpass API</p>
              </div>
            )}
            {osmResults.length === 0 && !searching && currentBbox && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-0">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  ⚠️ No mapped small operators found
                </p>
                <p className="text-xs text-amber-700 leading-relaxed mb-2">
                  OpenStreetMap coverage of small tourism operators in <strong>{searchQuery}</strong> is limited — this is exactly the gap TourLocal addresses.
                  Operators that aren't on OSM are undiscoverable to visitors.
                </p>
                <p className="text-xs text-amber-600 font-medium">
                  Be the first to register your farm from this region:
                </p>
                <button
                  onClick={() => { setShowForm(true); setForm(f => ({ ...f, country: searchQuery })) }}
                  className="mt-2 w-full bg-coffee-700 text-white text-xs font-semibold py-2 rounded-xl"
                >
                  + Register an operator in {searchQuery}
                </button>
                <p className="text-xs text-amber-400 mt-2">Source: OpenStreetMap via Overpass API (Section 7.3C)</p>
              </div>
            )}
            {osmResults.map(place => (
              <button key={place.id}
                onClick={() => setSelectedOSM(selectedOSM?.id === place.id ? null : place)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${selectedOSM?.id === place.id ? 'border-blue-300 bg-blue-50' : 'border-stone-100 bg-white hover:border-blue-100'}`}
              >
                <span className="text-2xl shrink-0">{OSM_TOURISM_EMOJI[place.tourism] ?? '📍'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{place.name}</p>
                  <p className="text-xs text-stone-400 capitalize">{place.tourism.replace(/_/g, ' ')} · OSM</p>
                </div>
                <span className="text-xs text-blue-500 font-medium shrink-0">+ Add</span>
              </button>
            ))}
            {osmResults.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  📊 Data gap: {osmResults.length} operators visible on OSM
                </p>
                <p className="text-xs text-blue-500 leading-relaxed">
                  These operators exist but lack multilingual AI assistance. Each "Add to TourLocal" registers them on the network.
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Source: OpenStreetMap contributors (§7.3C) ·{' '}
                  {fromCache ? 'Pre-loaded OSM cache (live Overpass API integration available)' : 'Live via Overpass API'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register form overlay */}
      {showForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-[2000] flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[85dvh] overflow-y-auto">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-stone-800">Register your farm</h3>
                <p className="text-xs text-stone-500">Join the TourLocal network</p>
              </div>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}><X size={20} className="text-stone-400" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Farm / experience name *"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                  placeholder="Your name *"
                  className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
                <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="Country *"
                  className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              </div>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Region / city"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                {SECTORS.map(s => <option key={s}>{SECTOR_EMOJIS[s]} {s}</option>)}
              </select>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-stone-500 font-medium">Map coordinates</label>
                  <button onClick={detectLocation} disabled={locating}
                    className="flex items-center gap-1 text-xs text-coffee-600 font-medium disabled:opacity-50">
                    {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                    {locating ? 'Locating…' : 'Use GPS'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.0001" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="Latitude"
                    className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
                  <input type="number" step="0.0001" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="Longitude"
                    className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
                </div>
              </div>
              <input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
                placeholder="Languages spoken (comma-separated)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your experience (2-3 sentences)" rows={3}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <input value={form.tourTypes} onChange={e => setForm(f => ({ ...f, tourTypes: e.target.value }))}
                placeholder="Tour types (comma-separated)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <input value={form.priceFrom} onChange={e => setForm(f => ({ ...f, priceFrom: e.target.value }))}
                placeholder="Price from (e.g. $15/person)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300" />
              <button onClick={handleRegister} disabled={!form.name || !form.ownerName || !form.country}
                className="w-full bg-coffee-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 active:scale-95">
                <Globe size={16} className="inline mr-2" />
                Join the TourLocal Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
