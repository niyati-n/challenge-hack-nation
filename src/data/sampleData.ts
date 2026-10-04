import type { FarmConfig, Booking, ClassifiedMessage } from '../types'
import { yelpReviews } from './yelpReviews'

export const defaultFarmConfig: FarmConfig = {
  name: 'Noor Coffee Farm Experience',
  ownerName: 'Noor',
  localLanguage: 'Swahili',
  localLanguageCode: 'sw',
  location: 'Ondera Highlands, East Africa',
  tourTypes: ['Morning Harvest Tour (2 hrs)', 'Sunset Farm Walk (1.5 hrs)', 'Full-Day Coffee Journey (6 hrs)'],
  pricing: {
    'Morning Harvest Tour': '$25 per person',
    'Sunset Farm Walk': '$18 per person',
    'Full-Day Coffee Journey': '$65 per person',
    'Group discount (6+)': '15% off',
  },
  openingHours: 'Daily 6:00 AM – 5:00 PM. Closed on local public holidays.',
  directions:
    'From the district town market, take the highland road north for 8 km. Turn left at the blue water tank. Follow the dirt track for 2 km — look for our hand-painted sign. 4WD recommended in rainy season.',
  phone: '+254 712 345 678',
  // Nyeri highlands, Kenya — a real Arabica coffee-growing region at ~1750m elevation
  lat: -0.4168,
  lng: 36.9524,
}

// Yelp Open Dataset — 400 real reviews from Tours / Coffee & Tea / Agriculture / Nature Tours
// Source: yelp.com/dataset · academic use licence, Yelp Inc.
// Sanitized via scripts/fix_yelp.cjs · original raw data in src/data/yelpReviews.json
// Sample 25 for AI analysis (keeps Claude prompt cost manageable)
export const sampleReviews: string[] = yelpReviews.slice(0, 25)

export const sampleMessages: ClassifiedMessage[] = [
  {
    id: 'msg-1',
    originalText: 'How much does the farm tour cost? We are 4 people.',
    detectedLanguage: 'English',
    languageCode: 'en',
    translatedToLocal: 'Gharama ya ziara ya shamba ni ngapi? Tuko watu 4.',
    intent: 'PRICE',
    intentConfidence: 0.97,
    draftResponse:
      'Thank you for your interest! Our Morning Harvest Tour is $25 per person, the Sunset Farm Walk is $18 per person, and the Full-Day Coffee Journey is $65 per person. For groups of 6+, we offer a 15% discount. For your group of 4, the morning tour would come to $100 total. Would you like to book?',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'msg-2',
    originalText: 'Wie komme ich zu Ihrer Farm? Wir haben kein Auto.',
    detectedLanguage: 'German',
    languageCode: 'de',
    translatedToLocal: 'Ninafika vipi kwenye shamba lako? Hatuna gari.',
    intent: 'DIRECTIONS',
    intentConfidence: 0.94,
    draftResponse:
      'Hallo! Unsere Farm liegt 8 km nördlich vom Markt der Kreisstadt. Sie können ein Motorrad-Taxi (Boda Boda) direkt bis zu unserem blau-bemalten Eingangsschild nehmen — der Fahrer kennt die "Noor Coffee Farm". Die Fahrt dauert ca. 25 Minuten und kostet etwa 500 Schilling. Wir sehen uns!',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: 'msg-3',
    originalText: 'Puis-je réserver pour samedi matin, 6 personnes ?',
    detectedLanguage: 'French',
    languageCode: 'fr',
    translatedToLocal: 'Ninaweza kuweka nafasi kwa Jumamosi asubuhi, watu 6?',
    intent: 'BOOKING',
    intentConfidence: 0.98,
    draftResponse:
      "Bonjour ! Oui, samedi matin est disponible ! Nous commençons la Visite Matinale à 7h00. Pour 6 personnes, le tarif est de 25 $ par personne avec 15 % de réduction groupe, soit 127,50 $ au total. Puis-je avoir votre nom et un moyen de contact pour confirmer la réservation ?",
    status: 'approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
  },
]

export const sampleBookings: Booking[] = [
  {
    id: 'book-1',
    guestName: 'Marcus Weber',
    guestEmail: 'marcus.weber@email.de',
    guestLanguage: 'German',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
    groupSize: 3,
    tourType: 'Morning Harvest Tour (2 hrs)',
    status: 'confirmed',
    aiDraft:
      'Hallo Marcus,\n\nWir freuen uns sehr, Sie und Ihre Gruppe auf der Noor Coffee Farm begrüßen zu dürfen!\n\nHier sind Ihre Buchungsdetails:\n📅 Datum: Übermorgen\n👥 Gruppe: 3 Personen\n🕕 Beginn: 7:00 Uhr morgens\n🚶 Tour: Morning Harvest (2 Stunden)\n\nSo finden Sie uns: Nehmen Sie die Highland Road 8 km nordwärts vom Markt, biegen Sie links am blauen Wassertank ab.\n\nBitte bringen Sie: bequeme Wanderschuhe, Sonnenschutz und eine Kamera!\n\nBis bald,\nNoor',
    notes: 'Group has a coffee blogger',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: 'book-2',
    guestName: 'Sophie Martin',
    guestEmail: 'sophie.martin@mail.fr',
    guestLanguage: 'French',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    groupSize: 6,
    tourType: 'Full-Day Coffee Journey (6 hrs)',
    status: 'pending',
    aiDraft: '',
    notes: 'Wants vegan lunch option',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
]
