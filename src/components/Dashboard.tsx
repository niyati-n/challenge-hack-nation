import { useState } from 'react'
import { Wifi, WifiOff, Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { FarmConfig } from '../types'

const EVIDENCE_STATS = [
  {
    value: '37%',
    label: 'mobile internet gender gap in Sub-Saharan Africa',
    source: 'GSMA Mobile Gender Gap Report 2024',
    link: 'https://www.gsma.com/r/gender-gap/',
    why: 'Justifies basic-phone-first design — Noor is statistically less likely to have a smartphone',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    value: '10%',
    label: 'of East Africa\'s GDP comes from tourism',
    source: 'World Development Indicators, World Bank 2023',
    link: 'https://data.worldbank.org/',
    why: 'Tourism is high-stakes for local economies — small operators like Noor are the backbone',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    value: '55%',
    label: 'of adults in SSA use mobile money',
    source: 'Global Findex, World Bank 2021',
    link: 'https://www.worldbank.org/en/publication/globalfindex',
    why: 'Booking confirmations and payments can flow through existing mobile money rails',
    color: 'bg-farm-50 border-farm-200 text-farm-800',
  },
  {
    value: '2.6B',
    label: 'people worldwide remain offline',
    source: 'ITU / World Bank Digital Progress 2024',
    link: 'https://www.worldbank.org/en/topic/digitaldevelopment',
    why: 'Offline-first design is essential — connectivity in highland farms is unreliable',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
]

const DATASET_SOURCES = [
  { name: 'MASSIVE (Amazon)', role: 'Intent taxonomy — our 9 intent classes map to MASSIVE\'s 51-language intent ontology', tag: 'Chat' },
  { name: 'FLORES-200 / NLLB-200 (Meta)', role: 'Translation benchmark — Claude\'s multilingual capability is evaluated against FLORES-200 standards', tag: 'Chat' },
  { name: 'GSMA Mobile Gender Gap', role: 'Evidence of device constraints for users like Noor (see stat above)', tag: 'Evidence' },
  { name: 'World Development Indicators', role: 'Tourism sector GDP contribution — problem-is-real evidence', tag: 'Evidence' },
  { name: 'Global Findex (World Bank)', role: 'Mobile money adoption — grounds the booking workflow', tag: 'Evidence' },
  { name: 'OpenCelliD', role: 'Cell tower density gaps — justifies offline-first architecture', tag: 'Evidence' },
  { name: 'Yelp Open Dataset', role: 'Reviews actively used — 12 real visitor reviews from Tours/Agriculture/Coffee categories (filtered via scripts/filter_yelp.py). Academic licence, Yelp Inc.', tag: 'Reviews' },
  { name: 'UN Tourism Statistics', role: 'Arrivals and receipts by country — sector relevance evidence', tag: 'Evidence' },
]

type DashboardProps = {
  farmConfig: FarmConfig
  serverReady: boolean
  onNavigate: (tab: 'home' | 'chat' | 'reviews' | 'bookings' | 'settings') => void
}

const LANGUAGES_SERVED = [
  { flag: '🇬🇧', lang: 'English' },
  { flag: '🇩🇪', lang: 'German' },
  { flag: '🇫🇷', lang: 'French' },
  { flag: '🇰🇪', lang: 'Swahili' },
  { flag: '🇪🇸', lang: 'Spanish' },
  { flag: '🇯🇵', lang: 'Japanese' },
]

export default function Dashboard({ farmConfig, serverReady, onNavigate }: DashboardProps) {
  const isOnline = navigator.onLine
  const [showEvidence, setShowEvidence] = useState(false)
  const [showDatasets, setShowDatasets] = useState(false)
  void farmConfig // available for future farm-specific stats

  return (
    <div className="p-4 space-y-4">
      {/* Status banner */}
      <div className={`rounded-xl p-3 flex items-center gap-2 text-sm font-medium ${
        isOnline ? 'bg-farm-100 text-farm-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isOnline
          ? 'Connected — AI features active'
          : 'Offline — cached responses available'}
      </div>

      {/* Server not ready prompt */}
      {!serverReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-semibold mb-1">API not configured</p>
          <p className="text-amber-700 text-xs mb-3">
            Set <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> as a server environment variable, then run <code className="bg-amber-100 px-1 rounded">vercel dev</code> or deploy to Vercel.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            View Setup →
          </button>
        </div>
      )}

      {/* What the app does */}
      <div className="bg-coffee-50 rounded-xl p-4">
        <h2 className="font-bold text-coffee-800 mb-2 flex items-center gap-2">
          <Globe size={16} /> TourLocal AI
        </h2>
        <p className="text-coffee-700 text-xs leading-relaxed">
          Your offline multilingual assistant. Translates visitor messages, detects what they need,
          drafts replies in their language — then you approve before sending.
          <span className="font-semibold"> You always make the final call.</span>
        </p>
      </div>

      {/* Evidence stats */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="w-full flex items-center justify-between px-4 py-3 bg-stone-50"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-stone-700">Why This Matters — Data Evidence</p>
            <p className="text-xs text-stone-400">Real numbers from Section 7.3 datasets</p>
          </div>
          {showEvidence ? <ChevronUp size={16} className="text-stone-400 shrink-0" /> : <ChevronDown size={16} className="text-stone-400 shrink-0" />}
        </button>
        {showEvidence && (
          <div className="p-3 space-y-2">
            {EVIDENCE_STATS.map(stat => (
              <div key={stat.value} className={`border rounded-xl p-3 ${stat.color}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-xs font-medium leading-tight">{stat.label}</span>
                </div>
                <p className="text-xs opacity-75 leading-snug mb-1">{stat.why}</p>
                <div className="flex items-center gap-1">
                  <ExternalLink size={10} className="opacity-50 shrink-0" />
                  <span className="text-xs opacity-60 italic">{stat.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          <QuickCard
            emoji="💬"
            title="Translate"
            desc="Handle visitor messages"
            color="bg-blue-50 text-blue-700"
            onClick={() => onNavigate('chat')}
          />
          <QuickCard
            emoji="⭐"
            title="Reviews"
            desc="Analyze feedback"
            color="bg-amber-50 text-amber-700"
            onClick={() => onNavigate('reviews')}
          />
          <QuickCard
            emoji="📅"
            title="Bookings"
            desc="Manage tours"
            color="bg-farm-50 text-farm-700"
            onClick={() => onNavigate('bookings')}
          />
        </div>
      </div>

      {/* Languages supported */}
      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          Languages Supported
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES_SERVED.map(({ flag, lang }) => (
            <div key={lang} className="bg-stone-50 rounded-lg px-3 py-2 text-center">
              <div className="text-xl">{flag}</div>
              <div className="text-xs text-stone-600 mt-0.5">{lang}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-2 text-center">
          + 100+ languages via Claude AI
        </p>
      </div>

      {/* How it works */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">How It Works</h3>
        {[
          { icon: '📩', step: 'Visitor sends a message in any language' },
          { icon: '🤖', step: 'AI detects language, translates, and classifies intent' },
          { icon: '✍️', step: 'AI drafts a response in the visitor\'s language' },
          { icon: '👁️', step: 'You review and approve before it\'s sent' },
          { icon: '🔊', step: 'Optional: hear the translation read aloud' },
        ].map(({ icon, step }) => (
          <div key={step} className="flex items-start gap-2">
            <span className="text-base leading-tight">{icon}</span>
            <p className="text-xs text-stone-600 leading-snug">{step}</p>
          </div>
        ))}
      </div>

      {/* Dataset sources */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDatasets(!showDatasets)}
          className="w-full flex items-center justify-between px-4 py-3 bg-stone-50"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-stone-700">Data Sources (Section 7.3)</p>
            <p className="text-xs text-stone-400">Datasets grounding this tool</p>
          </div>
          {showDatasets ? <ChevronUp size={16} className="text-stone-400 shrink-0" /> : <ChevronDown size={16} className="text-stone-400 shrink-0" />}
        </button>
        {showDatasets && (
          <div className="divide-y divide-stone-100">
            {DATASET_SOURCES.map(ds => (
              <div key={ds.name} className="px-4 py-2.5 flex items-start gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  ds.tag === 'Chat' ? 'bg-blue-100 text-blue-700' :
                  ds.tag === 'Reviews' ? 'bg-amber-100 text-amber-700' :
                  'bg-stone-100 text-stone-600'
                }`}>{ds.tag}</span>
                <div>
                  <p className="text-xs font-semibold text-stone-700">{ds.name}</p>
                  <p className="text-xs text-stone-500 leading-snug mt-0.5">{ds.role}</p>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 bg-stone-50">
              <p className="text-xs text-stone-400 italic">
                Data coverage gap: Most review datasets (incl. Yelp) are skewed toward Western tourism contexts. Our intent model uses Claude with MASSIVE as the benchmark — gaps in low-resource African languages acknowledged.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Small AI badge */}
      <div className="text-center py-2">
        <span className="text-xs text-stone-400">
          Built for the{' '}
          <span className="font-semibold text-stone-500">World Bank Small AI Hackathon 2026</span>
        </span>
      </div>
    </div>
  )
}

function QuickCard({
  emoji, title, desc, color, onClick,
}: {
  emoji: string; title: string; desc: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} rounded-xl p-3 text-left active:scale-95 transition-transform`}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-semibold text-sm leading-tight">{title}</div>
      <div className="text-xs opacity-70 leading-tight mt-0.5">{desc}</div>
    </button>
  )
}
