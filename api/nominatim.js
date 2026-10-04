// Geocoding proxy — keeps Nominatim requests server-side with proper User-Agent
export default async function handler(req, res) {
  const qs = req.url?.split('?')[1] ?? ''
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
      headers: { 'User-Agent': 'TourLocalAI/1.0', 'Accept-Language': 'en' },
    })
    const text = await r.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(r.status).send(text)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
