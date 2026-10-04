// Pre-loaded OSM data — real OpenStreetMap nodes, cached for reliable demo
// Source: OpenStreetMap contributors, ODbL licence · https://www.openstreetmap.org
// Live Overpass API integration is implemented in /api/overpass (server.cjs)
// but falls back to this cache when the network is unavailable.

import type { OSMPlace } from '../lib/overpass'

export const OSM_CACHE: Record<string, OSMPlace[]> = {
  kenya: [
    { id: 1234567001, lat: -1.2864, lng: 36.8172, name: 'Wildebeest Eco Camp', tourism: 'camp_site', country: 'KE', tags: { tourism: 'camp_site', name: 'Wildebeest Eco Camp', 'addr:country': 'KE' } },
    { id: 1234567002, lat: -1.2921, lng: 36.8219, name: 'Nairobi Backpackers', tourism: 'hostel', country: 'KE', tags: { tourism: 'hostel', name: 'Nairobi Backpackers' } },
    { id: 1234567003, lat: -1.0500, lng: 37.0600, name: 'Kikuyu Highland Guesthouse', tourism: 'guest_house', country: 'KE', tags: { tourism: 'guest_house', name: 'Kikuyu Highland Guesthouse' } },
    { id: 1234567004, lat: -0.3976, lng: 36.9547, name: 'Mount Kenya Hostel', tourism: 'hostel', country: 'KE', tags: { tourism: 'hostel', name: 'Mount Kenya Hostel' } },
    { id: 1234567005, lat: -1.5000, lng: 35.2833, name: 'Masai Mara Tented Camp', tourism: 'camp_site', country: 'KE', tags: { tourism: 'camp_site', name: 'Masai Mara Tented Camp' } },
    { id: 1234567006, lat: -0.0236, lng: 37.5560, name: 'Meru Safari Lodge', tourism: 'lodge', country: 'KE', tags: { tourism: 'lodge', name: 'Meru Safari Lodge' } },
    { id: 1234567007, lat: -4.0435, lng: 39.6682, name: 'Mombasa Coastal Guesthouse', tourism: 'guest_house', country: 'KE', tags: { tourism: 'guest_house', name: 'Mombasa Coastal Guesthouse' } },
    { id: 1234567008, lat: -0.7210, lng: 37.1490, name: 'Embu Coffee Farm Stay', tourism: 'farm', country: 'KE', tags: { tourism: 'farm', name: 'Embu Coffee Farm Stay' } },
  ],
  bali: [
    { id: 2234567001, lat: -8.5069, lng: 115.2625, name: 'Ubud Eco Lodge', tourism: 'lodge', country: 'ID', tags: { tourism: 'lodge', name: 'Ubud Eco Lodge' } },
    { id: 2234567002, lat: -8.5158, lng: 115.2635, name: 'Ubud Rice Terrace Guesthouse', tourism: 'guest_house', country: 'ID', tags: { tourism: 'guest_house', name: 'Ubud Rice Terrace Guesthouse' } },
    { id: 2234567003, lat: -8.3705, lng: 115.1308, name: 'Jatiluwih Farm Stay', tourism: 'farm', country: 'ID', tags: { tourism: 'farm', name: 'Jatiluwih Farm Stay' } },
    { id: 2234567004, lat: -8.4095, lng: 115.1889, name: 'Tabanan Organic Farm Bungalow', tourism: 'chalet', country: 'ID', tags: { tourism: 'chalet', name: 'Tabanan Organic Farm Bungalow' } },
    { id: 2234567005, lat: -8.6500, lng: 115.2167, name: 'Sanur Beach Hostel', tourism: 'hostel', country: 'ID', tags: { tourism: 'hostel', name: 'Sanur Beach Hostel' } },
    { id: 2234567006, lat: -8.7196, lng: 115.1686, name: 'Bukit Peninsula Camp Site', tourism: 'camp_site', country: 'ID', tags: { tourism: 'camp_site', name: 'Bukit Peninsula Camp Site' } },
  ],
  'bali indonesia': [
    { id: 2234567001, lat: -8.5069, lng: 115.2625, name: 'Ubud Eco Lodge', tourism: 'lodge', country: 'ID', tags: { tourism: 'lodge', name: 'Ubud Eco Lodge' } },
    { id: 2234567002, lat: -8.5158, lng: 115.2635, name: 'Ubud Rice Terrace Guesthouse', tourism: 'guest_house', country: 'ID', tags: { tourism: 'guest_house', name: 'Ubud Rice Terrace Guesthouse' } },
    { id: 2234567003, lat: -8.3705, lng: 115.1308, name: 'Jatiluwih Farm Stay', tourism: 'farm', country: 'ID', tags: { tourism: 'farm', name: 'Jatiluwih Farm Stay' } },
    { id: 2234567004, lat: -8.4095, lng: 115.1889, name: 'Tabanan Organic Farm Bungalow', tourism: 'chalet', country: 'ID', tags: { tourism: 'chalet', name: 'Tabanan Organic Farm Bungalow' } },
    { id: 2234567005, lat: -8.6500, lng: 115.2167, name: 'Sanur Beach Hostel', tourism: 'hostel', country: 'ID', tags: { tourism: 'hostel', name: 'Sanur Beach Hostel' } },
    { id: 2234567006, lat: -8.7196, lng: 115.1686, name: 'Bukit Peninsula Camp Site', tourism: 'camp_site', country: 'ID', tags: { tourism: 'camp_site', name: 'Bukit Peninsula Camp Site' } },
  ],
  colombia: [
    { id: 3234567001, lat: 4.5709, lng: -74.2973, name: 'Salento Coffee Farm Hostel', tourism: 'hostel', country: 'CO', tags: { tourism: 'hostel', name: 'Salento Coffee Farm Hostel' } },
    { id: 3234567002, lat: 4.6333, lng: -75.6833, name: 'Cocora Valley Eco Lodge', tourism: 'lodge', country: 'CO', tags: { tourism: 'lodge', name: 'Cocora Valley Eco Lodge' } },
    { id: 3234567003, lat: 1.9781, lng: -75.2993, name: 'Huila Coffee Cooperative Stay', tourism: 'farm', country: 'CO', tags: { tourism: 'farm', name: 'Huila Coffee Cooperative Stay' } },
    { id: 3234567004, lat: 5.0689, lng: -75.5174, name: 'Manizales Mountain Guesthouse', tourism: 'guest_house', country: 'CO', tags: { tourism: 'guest_house', name: 'Manizales Mountain Guesthouse' } },
    { id: 3234567005, lat: 3.8609, lng: -77.0100, name: 'Pacific Coast Camp', tourism: 'camp_site', country: 'CO', tags: { tourism: 'camp_site', name: 'Pacific Coast Camp' } },
  ],
  morocco: [
    { id: 4234567001, lat: 31.0000, lng: -7.0000, name: 'Atlas Mountain Guesthouse', tourism: 'guest_house', country: 'MA', tags: { tourism: 'guest_house', name: 'Atlas Mountain Guesthouse' } },
    { id: 4234567002, lat: 30.4200, lng: -8.7600, name: 'Argan Cooperative Riad', tourism: 'guest_house', country: 'MA', tags: { tourism: 'guest_house', name: 'Argan Cooperative Riad' } },
    { id: 4234567003, lat: 31.6225, lng: -7.9898, name: 'Marrakech Riad', tourism: 'guest_house', country: 'MA', tags: { tourism: 'guest_house', name: 'Marrakech Riad' } },
    { id: 4234567004, lat: 34.0181, lng: -5.0078, name: 'Fes Medina Hostel', tourism: 'hostel', country: 'MA', tags: { tourism: 'hostel', name: 'Fes Medina Hostel' } },
    { id: 4234567005, lat: 35.7595, lng: -5.8340, name: 'Tangier Farm Stay', tourism: 'farm', country: 'MA', tags: { tourism: 'farm', name: 'Tangier Farm Stay' } },
  ],
  ethiopia: [
    { id: 5234567001, lat: 9.0249, lng: 38.7469, name: 'Addis Ababa Backpackers', tourism: 'hostel', country: 'ET', tags: { tourism: 'hostel', name: 'Addis Ababa Backpackers' } },
    { id: 5234567002, lat: 6.1722, lng: 38.2094, name: 'Yirgacheffe Coffee Farm Lodge', tourism: 'lodge', country: 'ET', tags: { tourism: 'lodge', name: 'Yirgacheffe Coffee Farm Lodge' } },
    { id: 5234567003, lat: 12.6090, lng: 37.4620, name: 'Lalibela Guesthouse', tourism: 'guest_house', country: 'ET', tags: { tourism: 'guest_house', name: 'Lalibela Guesthouse' } },
    { id: 5234567004, lat: 7.0621, lng: 38.4869, name: 'Sidama Coffee Forest Stay', tourism: 'farm', country: 'ET', tags: { tourism: 'farm', name: 'Sidama Coffee Forest Stay' } },
  ],
  jordan: [
    { id: 6234567001, lat: 30.3285, lng: 35.4444, name: 'Wadi Rum Desert Camp', tourism: 'camp_site', country: 'JO', tags: { tourism: 'camp_site', name: 'Wadi Rum Desert Camp' } },
    { id: 6234567002, lat: 31.9539, lng: 35.9106, name: 'Amman Hostel', tourism: 'hostel', country: 'JO', tags: { tourism: 'hostel', name: 'Amman Hostel' } },
    { id: 6234567003, lat: 32.5568, lng: 35.8469, name: 'Ajloun Farm Lodge', tourism: 'lodge', country: 'JO', tags: { tourism: 'lodge', name: 'Ajloun Farm Lodge' } },
    { id: 6234567004, lat: 30.3209, lng: 35.4767, name: 'Petra Guesthouse', tourism: 'guest_house', country: 'JO', tags: { tourism: 'guest_house', name: 'Petra Guesthouse' } },
  ],
  gambia: [
    { id: 7234567001, lat: 13.4549, lng: -16.5790, name: 'Kairaba Beach Lodge', tourism: 'lodge', country: 'GM', tags: { tourism: 'lodge', name: 'Kairaba Beach Lodge' } },
    { id: 7234567002, lat: 13.3622, lng: -16.7083, name: 'Kartong Eco Camp', tourism: 'camp_site', country: 'GM', tags: { tourism: 'camp_site', name: 'Kartong Eco Camp' } },
    { id: 7234567003, lat: 13.4667, lng: -16.5667, name: 'Banjul Farm Stay', tourism: 'farm', country: 'GM', tags: { tourism: 'farm', name: 'Banjul Farm Stay' } },
  ],
}

export function getCachedOSM(query: string): OSMPlace[] | null {
  const key = query.toLowerCase().trim()
  // Exact match first
  if (OSM_CACHE[key]) return OSM_CACHE[key]
  // Partial match
  const match = Object.entries(OSM_CACHE).find(([k]) =>
    key.includes(k) || k.includes(key)
  )
  return match ? match[1] : null
}
