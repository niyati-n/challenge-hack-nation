import type { ClassifiedMessage, FarmConfig, ReviewAnalysis, Intent } from '../types'

// Claude sometimes wraps JSON in ```json ... ``` despite instructions — strip it
function parseJSON(text: string): ReturnType<typeof JSON.parse> {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

async function callClaude(model: string, max_tokens: number, messages: { role: string; content: string }[]) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens, messages }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    console.error('Claude API error:', err)
    // Anthropic wraps errors as { error: { type, message } } — extract the string message
    const errMsg =
      err?.error?.message ??
      err?.message ??
      (typeof err?.error === 'string' ? err.error : null) ??
      `API error ${res.status} ${res.statusText}`
    throw new Error(errMsg)
  }
  return res.json()
}

export async function classifyAndTranslate(
  text: string,
  farmConfig: FarmConfig,
): Promise<Omit<ClassifiedMessage, 'id' | 'timestamp' | 'status'>> {
  const prompt = `You are an assistant for ${farmConfig.name}, a coffee farm tour run by ${farmConfig.ownerName} in ${farmConfig.location}.

FARM KNOWLEDGE BASE:
- Tour types: ${farmConfig.tourTypes.join(', ')}
- Pricing: ${Object.entries(farmConfig.pricing).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Opening hours: ${farmConfig.openingHours}
- Directions: ${farmConfig.directions}
- Local language spoken: ${farmConfig.localLanguage}

A visitor sent this message: "${text}"

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "detectedLanguage": "full language name in English",
  "languageCode": "ISO 639-1 code (e.g. en, de, fr, sw)",
  "translatedToLocal": "translation into ${farmConfig.localLanguage}",
  "intent": "one of: PRICE|DIRECTIONS|BOOKING|OPENING_HOURS|FOOD|ACCESSIBILITY|CANCELLATION|LANGUAGE|OTHER",
  "intentConfidence": 0.0-1.0,
  "draftResponse": "a friendly, helpful response in the visitor's original language, using the farm knowledge base. Keep it under 3 sentences. If unsure about something, say 'I'll check with Noor directly for you.'"
}`

  const data = await callClaude('claude-sonnet-4-6', 600, [{ role: 'user', content: prompt }])
  const content = data.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const parsed = parseJSON(content.text)
  return {
    originalText: text,
    detectedLanguage: parsed.detectedLanguage,
    languageCode: parsed.languageCode,
    translatedToLocal: parsed.translatedToLocal,
    intent: parsed.intent as Intent,
    intentConfidence: parsed.intentConfidence,
    draftResponse: parsed.draftResponse,
  }
}

export async function analyzeReviews(
  reviews: string[],
  farmName: string,
): Promise<ReviewAnalysis> {
  const reviewText = reviews.map((r, i) => `Review ${i + 1}: ${r}`).join('\n')

  const prompt = `You are analyzing visitor reviews for ${farmName}, a smallholder coffee farm tourism experience.

REVIEWS:
${reviewText}

Extract themes from these reviews. Respond with ONLY valid JSON (no markdown):
{
  "totalReviews": number,
  "averageRating": 4.2,
  "topPositives": [
    {"emoji": "☕", "topic": "Coffee tasting", "count": 5, "sentiment": "positive", "examples": ["quote 1", "quote 2"]},
    {"emoji": "🌄", "topic": "Mountain views", "count": 4, "sentiment": "positive", "examples": ["quote"]},
    {"emoji": "👩‍🌾", "topic": "Host interaction", "count": 3, "sentiment": "positive", "examples": ["quote"]}
  ],
  "complaints": [
    {"emoji": "🗺️", "topic": "Hard to find", "count": 3, "sentiment": "negative", "examples": ["quote"]},
    {"emoji": "🌐", "topic": "Language barrier", "count": 2, "sentiment": "negative", "examples": ["quote"]}
  ],
  "visitorRequests": [
    {"emoji": "🔥", "topic": "Coffee roasting demo", "count": 4, "sentiment": "request", "examples": ["quote"]}
  ],
  "aiSuggestion": "One concrete business improvement Noor could make based on the feedback, in 2 sentences."
}`

  const data = await callClaude('claude-sonnet-4-6', 1200, [{ role: 'user', content: prompt }])
  const content = data.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const parsed = parseJSON(content.text)
  return { ...parsed, analyzedAt: new Date() }
}

export async function draftBookingConfirmation(
  guestName: string,
  date: string,
  groupSize: number,
  tourType: string,
  language: string,
  farmConfig: FarmConfig,
): Promise<string> {
  const prompt = `Draft a warm, professional booking confirmation for a coffee farm tour experience.

Details:
- Guest name: ${guestName}
- Date: ${date}
- Group size: ${groupSize} people
- Tour: ${tourType}
- Farm: ${farmConfig.name}, ${farmConfig.location}
- Host: ${farmConfig.ownerName}
- Directions: ${farmConfig.directions}

Write the confirmation in ${language}. Include: greeting, booking summary, directions, what to bring (comfortable shoes, camera, sunscreen), and a warm closing.
Keep it to 4-5 short paragraphs. Friendly and personal tone. Do not include any markdown formatting.`

  const data = await callClaude('claude-sonnet-4-6', 500, [{ role: 'user', content: prompt }])
  const content = data.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
