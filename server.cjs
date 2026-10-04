// Local dev API proxy — run with: node server.cjs
// Keeps API keys server-side while Vite serves the frontend.
// Keys are read from .env or .env.local in this directory.

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

// ── Load .env and .env.local ──────────────────────────────────────────────────
;['.env', '.env.local'].forEach(file => {
  const p = path.join(__dirname, file)
  if (!fs.existsSync(p)) return
  fs.readFileSync(p, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq < 0) return
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  })
})

// ── Read request body as JSON ─────────────────────────────────────────────────
function readBody(req) {
  return new Promise(resolve => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
      catch { resolve({}) }
    })
  })
}

// ── Proxy a fetch call and pipe binary/JSON response back ─────────────────────
function proxyFetch(res, upstreamUrl, upstreamOpts) {
  return new Promise((resolve, reject) => {
    const mod = upstreamUrl.startsWith('https') ? https : http
    const req = mod.request(upstreamUrl, upstreamOpts, upstream => {
      const status = upstream.statusCode
      if (status >= 400) console.error(`← ${status} from ${upstreamUrl.split('/').slice(0,4).join('/')}`)
      res.writeHead(status, {
        'Content-Type': upstream.headers['content-type'] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      })
      upstream.pipe(res)
      upstream.on('end', resolve)
    })
    req.on('error', reject)
    if (upstreamOpts.body) req.write(upstreamOpts.body)
    req.end()
  })
}

// ── Request handler ───────────────────────────────────────────────────────────
async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  // ── /api/overpass-test  (connectivity check — visit in browser) ──────────────
  if (req.url === '/api/overpass-test') {
    const testQuery = '[out:json][timeout:10];node(51.50,-0.10,51.52,-0.08)[name][tourism];out 3;'
    const u = new URL('https://overpass-api.de/api/interpreter')
    u.searchParams.set('data', testQuery)
    console.log('Test URL:', u.toString().substring(0, 150))
    try {
      const r = await fetch(u.toString(), {
        headers: { 'User-Agent': 'TourLocalAI/1.0', Accept: 'application/json' },
      })
      const text = await r.text()
      console.log('Test result status:', r.status, '| body:', text.substring(0, 100))
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' })
      res.end(`Overpass status: ${r.status}\n\nResponse:\n${text.substring(0, 800)}`)
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(`Fetch error: ${err}\n\nOverpass may be blocked on this network.`)
    }
    return
  }

  // ── /api/health ─────────────────────────────────────────────────────────────
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      claude: !!process.env.ANTHROPIC_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    }))
    return
  }

  // ── /api/claude ──────────────────────────────────────────────────────────────
  if (req.url === '/api/claude' && req.method === 'POST') {
    if (!process.env.ANTHROPIC_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env' }))
      return
    }
    const body = await readBody(req)
    console.log(`→ Claude  model=${body.model}  messages=${body.messages?.length}`)
    const bodyStr = JSON.stringify(body)
    await proxyFetch(res, 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(bodyStr).toString(),
      },
      body: bodyStr,
    })
    return
  }

  // ── /api/elevenlabs ──────────────────────────────────────────────────────────
  if (req.url === '/api/elevenlabs' && req.method === 'POST') {
    if (!process.env.ELEVENLABS_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'ELEVENLABS_API_KEY not set in .env' }))
      return
    }
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await readBody(req)
    await proxyFetch(
      res,
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'content-type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )
    return
  }

  // ── /api/nominatim  (geocode country → bbox) ────────────────────────────────
  if (req.url?.startsWith('/api/nominatim') && req.method === 'GET') {
    const qs = req.url.split('?')[1] ?? ''
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
      headers: { 'User-Agent': 'TourLocalAI/1.0', 'Accept-Language': 'en' },
    })
    const text = await r.text()
    res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(text)
    return
  }

  // ── /api/overpass  (live OSM operator search) ────────────────────────────────
  if (req.url === '/api/overpass' && req.method === 'POST') {
    const body = await readBody(req)
    const query = body.query
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing query' }))
      return
    }

    // Log first 120 chars so we can see the actual query
    console.log(`→ Overpass query: ${query.substring(0, 120)}`)

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ]

    for (const endpoint of endpoints) {
      try {
        // encodeURIComponent encodes spaces as %20 — URLSearchParams uses + which Overpass rejects
        const urlStr = `${endpoint}?data=${encodeURIComponent(query)}`
        console.log(`→ GET ${urlStr.substring(0, 120)}`)

        const r = await fetch(urlStr)   // no custom headers — let Node use defaults
        console.log(`← Overpass ${r.status} from ${endpoint}`)
        const text = await r.text()
        console.log(`   body[0:80]: ${text.substring(0, 80)}`)
        if (r.status >= 500) continue
        res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        res.end(text)
        return
      } catch (err) {
        console.error(`Overpass error from ${endpoint}:`, err.message ?? err)
      }
    }

    res.writeHead(504, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'All Overpass endpoints timed out — try a more specific region' }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = 3001
http.createServer((req, res) => {
  handler(req, res).catch(err => {
    console.error('Proxy error:', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err) }))
    }
  })
}).listen(PORT, () => {
  console.log('\n☕  TourLocal AI — local API proxy')
  console.log(`   Listening on http://localhost:${PORT}`)
  console.log(`   Claude:      ${process.env.ANTHROPIC_API_KEY ? '✓ key loaded' : '✗ ANTHROPIC_API_KEY missing'}`)
  console.log(`   ElevenLabs:  ${process.env.ELEVENLABS_API_KEY ? '✓ key loaded' : '— not set (voice disabled)'}`)
  console.log('\n   In a second terminal run:  npm run dev\n')
})
