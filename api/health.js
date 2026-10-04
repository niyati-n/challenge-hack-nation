export default function handler(req, res) {
  res.json({
    claude: !!process.env.ANTHROPIC_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  })
}
