// Serverless proxy — keeps ELEVENLABS_API_KEY server-side, streams audio back
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured on server' })
  }

  const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
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

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', buffer.length)
    return res.send(buffer)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
