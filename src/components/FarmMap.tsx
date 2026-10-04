import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Download, WifiOff, CheckCircle2 } from 'lucide-react'
import type { FarmConfig } from '../types'

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const CACHE_NAME = 'tourlocal-map-tiles-v1'

// Custom emoji markers — avoids the broken default icon in Vite builds
function makeIcon(emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -28],
  })
}

// Tile layer that checks Cache API before hitting the network
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
            if (cached) {
              tile.src = URL.createObjectURL(await cached.blob())
            } else {
              tile.src = url
            }
            tile.onload = () => done(undefined, tile)
            tile.onerror = () => done(new Error('tile load failed'), tile)
          } catch {
            tile.src = url
            tile.onload = () => done(undefined, tile)
            tile.onerror = () => done(new Error('tile load failed'), tile)
          }
        })()

        return tile
      },
    })

    const layer = new (OfflineLayer as new (url: string, opts: object) => L.TileLayer)(
      OSM_TILE_URL,
      {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }
    )
    map.addLayer(layer)
    return () => { map.removeLayer(layer) }
  }, [map])

  return null
}

// Calculate all tile x/y for a lat/lng bounding box at a given zoom
function latLngToTile(lat: number, lng: number, z: number) {
  const n = 2 ** z
  const x = Math.floor((lng + 180) / 360 * n)
  const y = Math.floor(
    (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * n,
  )
  return { x, y }
}

function tilesForBounds(
  north: number, south: number, east: number, west: number, z: number,
) {
  const tl = latLngToTile(north, west, z)
  const br = latLngToTile(south, east, z)
  const tiles: { x: number; y: number; z: number; s: string }[] = []
  const subs = ['a', 'b', 'c']
  for (let x = tl.x; x <= br.x; x++) {
    for (let y = tl.y; y <= br.y; y++) {
      tiles.push({ x, y, z, s: subs[(x + y) % 3] })
    }
  }
  return tiles
}

type Props = { farmConfig: FarmConfig; compact?: boolean }

export default function FarmMap({ farmConfig, compact = false }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cached, setCached] = useState(false)

  // Fall back to Nyeri highlands if coordinates aren't saved yet
  const lat = farmConfig.lat ?? -0.4168
  const lng = farmConfig.lng ?? 36.9524
  const farmPos: [number, number] = [lat, lng]
  // District town is 8 km south (approx −0.072° lat)
  const townPos: [number, number] = [lat - 0.072, lng]

  useEffect(() => {
    caches.open(CACHE_NAME).then(cache =>
      cache.keys().then(keys => setCached(keys.length > 50))
    )
  }, [])

  async function downloadTiles() {
    setDownloading(true)
    setProgress(0)

    // Download zoom levels 12–14 for a ~20km box around the farm
    const pad = 0.15 // ~16 km
    const north = lat + pad
    const south = lat - pad
    const east = lng + pad
    const west = lng - pad

    const allTiles = [12, 13, 14].flatMap(z => tilesForBounds(north, south, east, west, z))

    const cache = await caches.open(CACHE_NAME)
    let done = 0

    for (const tile of allTiles) {
      const url = `https://${tile.s}.tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`
      try {
        const existing = await cache.match(url)
        if (!existing) await cache.add(url)
      } catch { /* skip failed tiles */ }
      done++
      setProgress(Math.round((done / allTiles.length) * 100))
    }

    setCached(true)
    setDownloading(false)
  }

  const mapHeight = compact ? 'h-48' : 'h-64'

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200">
      {/* Map */}
      <div className={`${mapHeight} relative`}>
        <MapContainer
          center={farmPos}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={!compact}
          scrollWheelZoom={false}
        >
          <OfflineTileLayer />
          <Marker position={farmPos} icon={makeIcon('☕')}>
            <Popup>
              <strong>{farmConfig.name}</strong><br />
              {farmConfig.ownerName}'s farm<br />
              <span className="text-xs text-stone-500">{farmConfig.openingHours}</span>
            </Popup>
          </Marker>
          <Marker position={townPos} icon={makeIcon('🏘️')}>
            <Popup>District Town<br /><span className="text-xs text-stone-500">~8 km to farm</span></Popup>
          </Marker>
          <Polyline
            positions={[townPos, farmPos]}
            color="#b5671c"
            weight={3}
            dashArray="6 6"
            opacity={0.8}
          />
        </MapContainer>

        {/* Offline badge */}
        {cached && (
          <div className="absolute top-2 right-2 z-[1000] bg-farm-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <WifiOff size={10} /> Offline ready
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-stone-50 px-3 py-2 flex items-center justify-between gap-2">
        <div className="text-xs text-stone-500 leading-tight">
          <span className="font-medium">OpenStreetMap</span> · Section 7.3 dataset
        </div>

        {cached ? (
          <div className="flex items-center gap-1 text-xs text-farm-600 font-medium">
            <CheckCircle2 size={14} /> Tiles cached
          </div>
        ) : downloading ? (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-coffee-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        ) : (
          <button
            onClick={downloadTiles}
            className="flex items-center gap-1 text-xs text-coffee-700 font-semibold border border-coffee-300 px-2 py-1 rounded-lg active:scale-95 transition-transform"
          >
            <Download size={12} /> Save offline
          </button>
        )}
      </div>
    </div>
  )
}
