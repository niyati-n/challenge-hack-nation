import { useState } from 'react'
import { Send, Volume2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { AppSettings, FarmConfig, ClassifiedMessage, Intent } from '../types'
import { classifyAndTranslate } from '../lib/claude'
import { speakText } from '../lib/elevenlabs'
import { sampleMessages } from '../data/sampleData'
import FarmMap from './FarmMap'

const INTENT_COLORS: Record<Intent, string> = {
  PRICE: 'bg-green-100 text-green-700',
  DIRECTIONS: 'bg-blue-100 text-blue-700',
  BOOKING: 'bg-purple-100 text-purple-700',
  OPENING_HOURS: 'bg-orange-100 text-orange-700',
  FOOD: 'bg-yellow-100 text-yellow-700',
  ACCESSIBILITY: 'bg-teal-100 text-teal-700',
  CANCELLATION: 'bg-red-100 text-red-700',
  LANGUAGE: 'bg-indigo-100 text-indigo-700',
  OTHER: 'bg-stone-100 text-stone-600',
}

const INTENT_ICONS: Record<Intent, string> = {
  PRICE: '💰',
  DIRECTIONS: '🗺️',
  BOOKING: '📅',
  OPENING_HOURS: '⏰',
  FOOD: '🍽️',
  ACCESSIBILITY: '♿',
  CANCELLATION: '❌',
  LANGUAGE: '🌐',
  OTHER: '💬',
}

type Props = {
  settings: AppSettings
  farmConfig: FarmConfig
  serverReady: boolean
  onNeedSettings: () => void
}

export default function TranslateChat({ settings, farmConfig, serverReady, onNeedSettings }: Props) {
  const [messages, setMessages] = useState<ClassifiedMessage[]>(sampleMessages)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<Record<string, string>>({})

  async function handleSubmit() {
    if (!inputText.trim()) return
    if (!serverReady) { onNeedSettings(); return }

    setLoading(true)
    setError('')
    const text = inputText.trim()
    setInputText('')

    try {
      const result = await classifyAndTranslate(text, farmConfig)
      const newMsg: ClassifiedMessage = {
        id: `msg-${Date.now()}`,
        ...result,
        status: 'pending',
        timestamp: new Date(),
      }
      setMessages(prev => [newMsg, ...prev])
      setExpandedId(newMsg.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed. Check server setup.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSpeak(msg: ClassifiedMessage) {
    setSpeakingId(msg.id)
    try {
      await speakText(msg.translatedToLocal, settings.elevenLabsVoiceId)
    } catch {
      alert('Voice playback failed. Check ElevenLabs key on the server.')
    } finally {
      setSpeakingId(null)
    }
  }

  function handleApprove(id: string) {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'approved' as const } : m)
    )
  }

  function handleSend(id: string) {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'sent' as const } : m)
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Input area */}
      <div className="p-4 border-b border-stone-100 bg-stone-50">
        <p className="text-xs text-stone-500 mb-2 font-medium">
          Paste or type a visitor message in any language:
        </p>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="e.g. 'Wie viel kostet die Tour?' or 'Can I book for 5 people?'"
          className="w-full border border-stone-200 rounded-xl p-3 text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-coffee-400"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
        />
        <div className="flex items-center justify-between mt-2">
          {error && <p className="text-xs text-red-500 flex-1 mr-2">{error}</p>}
          {!error && <div className="flex-1" />}
          <button
            onClick={handleSubmit}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 bg-coffee-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Visitor Messages ({messages.length})
          </h3>
          <button
            onClick={() => setMessages(sampleMessages)}
            className="text-xs text-coffee-600 font-medium"
          >
            Reset demo
          </button>
        </div>

        {messages.map(msg => {
          const isExpanded = expandedId === msg.id
          const draft = editingDraft[msg.id] ?? msg.draftResponse
          const confidence = msg.intentConfidence
          const lowConfidence = confidence < 0.7

          return (
            <div
              key={msg.id}
              className={`border rounded-2xl overflow-hidden ${
                msg.status === 'sent'
                  ? 'border-farm-200 bg-farm-50'
                  : msg.status === 'approved'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-stone-200 bg-white'
              }`}
            >
              {/* Message header */}
              <button
                className="w-full text-left p-3"
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{msg.originalText}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-stone-400">{msg.detectedLanguage}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${INTENT_COLORS[msg.intent]}`}>
                        {INTENT_ICONS[msg.intent]} {msg.intent}
                      </span>
                      {lowConfidence && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle size={10} /> Low confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {msg.status === 'sent' && <CheckCircle size={16} className="text-farm-600" />}
                    {msg.status === 'approved' && <span className="text-xs text-blue-600 font-medium">Approved</span>}
                    {isExpanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-stone-100 p-3 space-y-3">
                  {/* Translation to local language */}
                  <div className="bg-coffee-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-coffee-700">
                        In {farmConfig.localLanguage} (your language):
                      </p>
                      <button
                        onClick={() => handleSpeak(msg)}
                        disabled={speakingId === msg.id}
                        className="flex items-center gap-1 text-xs text-coffee-600 font-medium disabled:opacity-50"
                      >
                        <Volume2 size={12} />
                        {speakingId === msg.id ? 'Playing…' : 'Listen'}
                      </button>
                    </div>
                    <p className="text-sm text-coffee-800">{msg.translatedToLocal}</p>
                    <p className="text-xs text-coffee-400 mt-2 italic">
                      Translation evaluated against FLORES-200 / NLLB-200 (Meta, 200 languages)
                    </p>
                  </div>

                  {/* Offline map auto-shown for DIRECTIONS intent */}
                  {msg.intent === 'DIRECTIONS' && (
                    <div>
                      <p className="text-xs font-semibold text-stone-600 mb-2">
                        📍 Farm location map (works offline after download):
                      </p>
                      <FarmMap farmConfig={farmConfig} compact />
                    </div>
                  )}

                  {/* Intent confidence */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-500 font-medium">Intent confidence</span>
                      <span className={`font-bold ${lowConfidence ? 'text-amber-600' : 'text-farm-600'}`}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${lowConfidence ? 'bg-amber-400' : 'bg-farm-500'}`}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    {lowConfidence && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Not sure about intent — please review manually before sending.
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-2 italic">
                      Intent taxonomy grounded in MASSIVE dataset (Amazon, ~1M utterances, 51 languages)
                    </p>
                  </div>

                  {/* Draft response */}
                  <div>
                    <p className="text-xs font-semibold text-stone-600 mb-1">
                      AI draft response (in {msg.detectedLanguage}):
                    </p>
                    <textarea
                      value={draft}
                      onChange={e => setEditingDraft(prev => ({ ...prev, [msg.id]: e.target.value }))}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300 bg-white"
                      rows={4}
                    />
                  </div>

                  {/* Action buttons */}
                  {msg.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(msg.id)}
                        className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl active:scale-95"
                      >
                        ✓ Approve Draft
                      </button>
                    </div>
                  )}
                  {msg.status === 'approved' && (
                    <button
                      onClick={() => handleSend(msg.id)}
                      className="w-full bg-farm-600 text-white text-xs font-semibold py-2 rounded-xl active:scale-95"
                    >
                      Send to Visitor ✓
                    </button>
                  )}
                  {msg.status === 'sent' && (
                    <p className="text-xs text-farm-600 font-semibold text-center">
                      ✓ Sent to visitor
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
