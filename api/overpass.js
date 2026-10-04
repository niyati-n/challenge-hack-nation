// Live OSM data proxy — tries three Overpass endpoints with fallback
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Missing query' })

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  for (const endpoint of endpoints) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`
      const r = await fetch(url)
      if (r.status >= 500) continue
      const text = await r.text()
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/json')
      return res.status(r.status).send(text)
    } catch {
      continue
    }
  }

  return res.status(504).json({ error: 'All Overpass endpoints timed out' })
}
