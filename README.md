# TourLocal AI

**Offline multilingual tourism assistant for small farm operators in the Global South**

Built for the [World Bank × Hack-Nation Small AI for Development Hackathon 2026](https://hack-nation.ai/) — Tourism sector (Challenge 04).

---

## What it does

TourLocal AI turns a basic phone into a multilingual receptionist, booking manager and review analyst for small agritourism operators like Noor — a coffee farm owner in the East African highlands who receives visitors from Germany, France, Kenya and beyond but cannot speak all their languages.

| Feature | Description |
|---|---|
| **Multilingual Chat** | Paste any visitor message → AI detects language, translates to local language, classifies intent, drafts a response in the visitor's language |
| **Human-in-the-loop** | Every AI draft requires operator approval before sending |
| **Review Intelligence** | Analyzes real Yelp Open Dataset reviews to extract themes, complaints and business insights |
| **Booking Manager** | Manage tour bookings with AI-drafted confirmations in the guest's language |
| **Offline Maps** | OpenStreetMap tiles downloaded to device via Cache API — works with zero internet |
| **Discover Network** | World map of small tourism operators; search any country for live OSM data + World Bank evidence |

---

## Data sources (Section 7.3)

| Dataset | Use |
|---|---|
| **MASSIVE (Amazon)** | 51-language intent taxonomy grounds our 9 intent classes |
| **FLORES-200 / NLLB-200 (Meta)** | Multilingual translation benchmark |
| **Yelp Open Dataset** | 400 real reviews from Tours / Coffee & Tea / Agriculture categories |
| **OpenStreetMap via Overpass API** | Live operator discovery + offline maps |
| **World Development Indicators (World Bank)** | Tourism GDP evidence per country |
| **UN Tourism (UNWTO)** | Arrivals and jobs data |
| **GSMA Mobile Gender Gap Report** | Justifies basic-phone-first design |
| **Global Findex (World Bank)** | Mobile money adoption grounds booking workflow |

---

## Tech stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **AI:** Claude claude-sonnet-4-6 (Anthropic) via server-side proxy
- **Voice:** ElevenLabs multilingual v2
- **Maps:** React-Leaflet + OpenStreetMap
- **Deployment:** Vercel (frontend + serverless API functions)

---

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) (`sk-ant-api03-...`)
- *(Optional)* An [ElevenLabs API key](https://elevenlabs.io) for voice playback

---

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/niyati-n/challenge-hack-nation.git
cd challenge-hack-nation/tourlocal-ai
npm install
```

### 2. Add API keys

Create a `.env` file in `tourlocal-ai/`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key-here   # optional
```

### 3. Start the API proxy server

The proxy keeps your API keys server-side — they never reach the browser.

```bash
npm run server
```

You should see:
```
☕  TourLocal AI — local API proxy
   Listening on http://localhost:3001
   Claude:      ✓ key loaded
   ElevenLabs:  ✓ key loaded
```

### 4. Start the frontend (new terminal)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project structure

```
tourlocal-ai/
├── api/                    # Vercel serverless functions (server-side API proxies)
│   ├── claude.js           # Anthropic proxy → keeps ANTHROPIC_API_KEY server-side
│   ├── elevenlabs.js       # ElevenLabs proxy
│   ├── nominatim.js        # OSM geocoding proxy
│   ├── overpass.js         # Live OSM operator search proxy
│   └── health.js           # Reports which keys are configured
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx         # Home tab — data evidence, quick actions
│   │   ├── TranslateChat.tsx     # Multilingual chat + intent classifier
│   │   ├── ReviewIntelligence.tsx # Yelp review analysis
│   │   ├── BookingManager.tsx    # Booking management
│   │   ├── DiscoverTab.tsx       # World map + OSM operator discovery
│   │   ├── FarmMap.tsx           # Offline OpenStreetMap component
│   │   └── SettingsPanel.tsx     # Farm config + server status
│   ├── data/
│   │   ├── sampleData.ts         # Default farm config + sample messages
│   │   ├── operators.ts          # Network operators + localStorage persistence
│   │   ├── osmCache.ts           # Pre-loaded OSM data (fallback)
│   │   └── yelpReviews.ts        # 400 reviews from Yelp Open Dataset
│   ├── lib/
│   │   ├── claude.ts             # Claude API calls via /api/claude proxy
│   │   ├── elevenlabs.ts         # ElevenLabs voice via /api/elevenlabs proxy
│   │   └── overpass.ts           # OSM search + evidence data
│   └── App.tsx                   # Tab navigation, server health check
├── scripts/
│   ├── filter_yelp.py            # Filter full Yelp dataset for agritourism
│   └── fix_yelp.cjs              # Sanitize yelpReviews.json → yelpReviews.ts
├── server.cjs                    # Local dev proxy server (replaces Vercel CLI)
└── vercel.json                   # SPA rewrite rules for Vercel deployment
```

---

## Deploy to Vercel

### Option A — Via GitHub (recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Framework: **Vite** (auto-detected)
4. Add Environment Variables:
   - `ANTHROPIC_API_KEY`
   - `ELEVENLABS_API_KEY`
5. Deploy

### Option B — Via CLI

```bash
npm install -g vercel
vercel --prod
```
*(Note: may require network access to vercel.com for auth)*

---

## Yelp Open Dataset pipeline

The app ships with 400 pre-processed reviews. To regenerate from the full dataset:

1. Download from [yelp.com/dataset](https://www.yelp.com/dataset) (free, requires email)
2. Run the filter:

```bash
python scripts/filter_yelp.py \
  --business yelp_academic_dataset_business.json \
  --reviews  yelp_academic_dataset_review.json \
  --out      src/data/yelpReviews.json
```

3. Sanitize and convert:

```bash
node scripts/fix_yelp.cjs
```

**Data coverage gap:** Most Yelp reviews are from US/Canadian businesses. Real deployment would supplement with local review sources (Google Maps, TripAdvisor). This is documented in the code.

---

## AI guardrails

- Every AI draft requires **operator approval** before sending — the tool informs, the operator decides
- Intent confidence score shown for every message — low confidence (<70%) triggers a "review manually" warning
- No medical advice, no autonomous booking actions
- All API keys server-side — never exposed to browser

---

## Judging criteria mapping

| Criterion | Weight | Implementation |
|---|---|---|
| Small AI fidelity | 25% | Offline-first, basic-phone UI, 3G-compatible, localStorage caching |
| Development relevance | 20% | Directly addresses Annex C tourism scenario |
| Data grounding | 15% | Yelp dataset + WDI + UN Tourism + MASSIVE + OSM |
| Evidence it works | 15% | Live demo, real API calls, Yelp reviews |
| AI value proposition | 15% | Intent classification + multilingual translation not possible with SMS/spreadsheet |
| Scalability | 10% | Global Discover map — any operator anywhere can register |
| Responsible AI | Pass/fail | Human-in-the-loop, confidence scores, no hallucination on decisions |

---

## License

MIT — built for the World Bank Small AI for Development Hackathon 2026.

Dataset licences:
- Yelp Open Dataset: academic use, Yelp Inc.
- OpenStreetMap: © OpenStreetMap contributors, ODbL
- World Development Indicators: Creative Commons Attribution 4.0
