export type Intent =
  | 'PRICE'
  | 'DIRECTIONS'
  | 'BOOKING'
  | 'OPENING_HOURS'
  | 'FOOD'
  | 'ACCESSIBILITY'
  | 'CANCELLATION'
  | 'LANGUAGE'
  | 'OTHER'

export interface ClassifiedMessage {
  id: string
  originalText: string
  detectedLanguage: string
  languageCode: string
  translatedToLocal: string
  intent: Intent
  intentConfidence: number
  draftResponse: string
  status: 'pending' | 'approved' | 'sent'
  timestamp: Date
}

export interface Booking {
  id: string
  guestName: string
  guestEmail: string
  guestLanguage: string
  date: string
  groupSize: number
  tourType: string
  status: 'pending' | 'confirmed' | 'cancelled'
  aiDraft: string
  notes: string
  createdAt: Date
}

export interface ReviewTheme {
  emoji: string
  topic: string
  count: number
  sentiment: 'positive' | 'negative' | 'request'
  examples: string[]
}

export interface ReviewAnalysis {
  totalReviews: number
  averageRating: number
  topPositives: ReviewTheme[]
  complaints: ReviewTheme[]
  visitorRequests: ReviewTheme[]
  aiSuggestion: string
  analyzedAt: Date
}

export interface FarmConfig {
  name: string
  ownerName: string
  localLanguage: string
  localLanguageCode: string
  location: string
  tourTypes: string[]
  pricing: Record<string, string>
  openingHours: string
  directions: string
  phone: string
  lat: number
  lng: number
}

export interface AppSettings {
  elevenLabsVoiceId: string
  // API keys are now set as server environment variables (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY)
  // and accessed via /api/claude and /api/elevenlabs proxy routes
}

export interface ServerStatus {
  claude: boolean
  elevenlabs: boolean
}

export interface Operator {
  id: string
  name: string
  ownerName: string
  country: string
  city: string
  lat: number
  lng: number
  sector: string
  emoji: string
  languages: string[]
  description: string
  tourTypes: string[]
  priceFrom: string
  verified: boolean
  registeredAt: string
}
