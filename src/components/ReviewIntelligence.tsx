import { useState } from 'react'
import { Sparkles, Loader2, Trash2, RefreshCw, TrendingUp, Database } from 'lucide-react'
import type { FarmConfig, ReviewAnalysis, ReviewTheme } from '../types'
import { analyzeReviews } from '../lib/claude'
import { sampleReviews } from '../data/sampleData'

type Props = {
  farmConfig: FarmConfig
  serverReady: boolean
  onNeedSettings: () => void
}

export default function ReviewIntelligence({ farmConfig, serverReady, onNeedSettings }: Props) {
  const [reviews, setReviews] = useState<string[]>(sampleReviews)
  const [newReview, setNewReview] = useState('')
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReviews, setShowReviews] = useState(false)

  async function handleAnalyze() {
    if (!serverReady) { onNeedSettings(); return }
    if (reviews.length === 0) return
    setLoading(true)
    setError('')
    try {
      const result = await analyzeReviews(reviews, farmConfig.name)
      setAnalysis(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  function addReview() {
    if (!newReview.trim()) return
    setReviews(prev => [...prev, newReview.trim()])
    setNewReview('')
  }

  return (
    <div className="p-4 space-y-4">

      {/* Dataset attribution */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-start gap-2">
        <Database size={14} className="text-stone-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-stone-600">Yelp Open Dataset</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Reviews filtered from Tours · Coffee & Tea · Agriculture · Nature Tours categories.
            Full dataset: <span className="font-medium">yelp.com/dataset</span> (free, academic licence) ·
            Filter script: <span className="font-medium">scripts/filter_yelp.py</span>
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-800">Review Intelligence</h2>
          <p className="text-xs text-stone-500">AI extracts what visitors love and want improved</p>
        </div>
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="text-xs text-coffee-600 font-medium border border-coffee-200 px-3 py-1.5 rounded-lg"
        >
          {showReviews ? 'Hide' : `${reviews.length} reviews`}
        </button>
      </div>

      {/* Review list */}
      {showReviews && (
        <div className="space-y-2">
          {reviews.map((r, i) => (
            <div key={i} className="flex gap-2 bg-stone-50 rounded-xl p-3">
              <p className="flex-1 text-xs text-stone-700 leading-relaxed">{r}</p>
              <button
                onClick={() => setReviews(prev => prev.filter((_, j) => j !== i))}
                className="text-stone-300 hover:text-red-400 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <textarea
              value={newReview}
              onChange={e => setNewReview(e.target.value)}
              placeholder="Paste a review from Google, TripAdvisor or Yelp…"
              className="flex-1 border border-stone-200 rounded-xl p-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300"
              rows={2}
            />
            <button
              onClick={addReview}
              className="bg-coffee-700 text-white rounded-xl px-3 text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Analyze */}
      <button
        onClick={handleAnalyze}
        disabled={loading || reviews.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-coffee-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Analyzing {reviews.length} reviews…</>
        ) : analysis ? (
          <><RefreshCw size={16} /> Re-analyze</>
        ) : (
          <><Sparkles size={16} /> Analyze {reviews.length} Reviews</>
        )}
      </button>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3">{error}</p>}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Overall Rating</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-3xl font-bold text-amber-800">{analysis.averageRating.toFixed(1)}</span>
                <span className="text-amber-600 mb-0.5">/ 5</span>
              </div>
              <p className="text-xs text-amber-600 mt-0.5">{analysis.totalReviews} reviews analyzed</p>
            </div>
            <div className="text-5xl">⭐</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Most mentioned positively</h3>
            <div className="space-y-2">
              {analysis.topPositives.map((theme, i) => (
                <ThemeCard key={i} theme={theme} colorClass="bg-farm-50 border-farm-200 text-farm-700" />
              ))}
            </div>
          </div>

          {analysis.complaints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Common complaints</h3>
              <div className="space-y-2">
                {analysis.complaints.map((theme, i) => (
                  <ThemeCard key={i} theme={theme} colorClass="bg-red-50 border-red-200 text-red-700" />
                ))}
              </div>
            </div>
          )}

          {analysis.visitorRequests.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Visitors want more of…</h3>
              <div className="space-y-2">
                {analysis.visitorRequests.map((theme, i) => (
                  <ThemeCard key={i} theme={theme} colorClass="bg-blue-50 border-blue-200 text-blue-700" />
                ))}
              </div>
            </div>
          )}

          <div className="bg-coffee-700 text-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} />
              <p className="font-bold text-sm">AI Business Suggestion</p>
            </div>
            <p className="text-sm text-coffee-100 leading-relaxed">{analysis.aiSuggestion}</p>
          </div>

          <p className="text-xs text-stone-400 text-center">
            Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}
          </p>
          <p className="text-xs text-stone-300 text-center">
            Yelp Open Dataset · Tours / Coffee & Tea / Agriculture categories · academic licence, Yelp Inc.
          </p>
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-stone-600 font-medium">{reviews.length} reviews ready to analyze</p>
          <p className="text-xs text-stone-400 mt-1">AI extracts themes, complaints and business insights</p>
        </div>
      )}
    </div>
  )
}

function ThemeCard({ theme, colorClass }: { theme: ReviewTheme; colorClass: string }) {
  const [showExamples, setShowExamples] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden ${colorClass}`}>
      <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setShowExamples(!showExamples)}>
        <span className="text-xl">{theme.emoji}</span>
        <p className="flex-1 font-semibold text-sm">{theme.topic}</p>
        <span className="text-xs font-bold bg-white bg-opacity-60 px-2 py-0.5 rounded-full shrink-0">{theme.count}×</span>
      </button>
      {showExamples && theme.examples.length > 0 && (
        <div className="border-t border-current border-opacity-10 px-4 pb-3 space-y-1.5">
          {theme.examples.slice(0, 2).map((ex, i) => (
            <p key={i} className="text-xs italic opacity-80">"{ex}"</p>
          ))}
        </div>
      )}
    </div>
  )
}
