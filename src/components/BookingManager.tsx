import { useState } from 'react'
import { Plus, Sparkles, CheckCircle, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { AppSettings, FarmConfig, Booking } from '../types'
import { draftBookingConfirmation } from '../lib/claude'
import { sampleBookings } from '../data/sampleData'

type Props = {
  settings: AppSettings
  farmConfig: FarmConfig
  serverReady: boolean
  onNeedSettings: () => void
}

const LANGUAGES = ['English', 'German', 'French', 'Spanish', 'Swahili', 'Japanese', 'Italian']

export default function BookingManager({ settings, farmConfig, serverReady, onNeedSettings }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftingId, setDraftingId] = useState<string | null>(null)
  const [editingDrafts, setEditingDrafts] = useState<Record<string, string>>({})
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestLanguage: 'English',
    date: '',
    groupSize: 2,
    tourType: farmConfig.tourTypes[0],
    notes: '',
  })

  async function handleDraft(booking: Booking) {
    if (!serverReady) { onNeedSettings(); return }
    setDraftingId(booking.id)
    try {
      const draft = await draftBookingConfirmation(
        booking.guestName,
        booking.date,
        booking.groupSize,
        booking.tourType,
        booking.guestLanguage,
        farmConfig,
      )
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, aiDraft: draft } : b)
      )
      setEditingDrafts(prev => ({ ...prev, [booking.id]: draft }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Draft failed')
    } finally {
      setDraftingId(null)
    }
  }

  function handleConfirm(id: string) {
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b)
    )
  }

  function addBooking() {
    if (!form.guestName || !form.date) return
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      ...form,
      status: 'pending',
      aiDraft: '',
      createdAt: new Date(),
    }
    setBookings(prev => [newBooking, ...prev])
    setExpandedId(newBooking.id)
    setShowNewForm(false)
    setForm({
      guestName: '', guestEmail: '', guestLanguage: 'English',
      date: '', groupSize: 2, tourType: farmConfig.tourTypes[0], notes: '',
    })
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-800">Bookings</h2>
          <p className="text-xs text-stone-500">
            {pendingCount > 0 ? `${pendingCount} pending confirmation` : 'All bookings up to date'}
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-1 bg-coffee-700 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* New booking form */}
      {showNewForm && (
        <div className="bg-stone-50 rounded-2xl p-4 space-y-3 border border-stone-200">
          <h3 className="font-semibold text-sm text-stone-700">New Booking</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.guestName}
              onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
              placeholder="Guest name *"
              className="col-span-2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
            <input
              value={form.guestEmail}
              onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))}
              placeholder="Email"
              type="email"
              className="col-span-2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
            <input
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              type="date"
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
            <input
              value={form.groupSize}
              onChange={e => setForm(f => ({ ...f, groupSize: parseInt(e.target.value) || 1 }))}
              type="number"
              min={1}
              placeholder="Group size"
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
            <select
              value={form.tourType}
              onChange={e => setForm(f => ({ ...f, tourType: e.target.value }))}
              className="col-span-2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white"
            >
              {farmConfig.tourTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              value={form.guestLanguage}
              onChange={e => setForm(f => ({ ...f, guestLanguage: e.target.value }))}
              className="col-span-2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white"
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              className="col-span-2 border border-stone-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewForm(false)}
              className="flex-1 border border-stone-200 text-stone-600 text-sm py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={addBooking}
              disabled={!form.guestName || !form.date}
              className="flex-1 bg-coffee-700 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            >
              Add Booking
            </button>
          </div>
        </div>
      )}

      {/* Booking list */}
      <div className="space-y-3">
        {bookings.map(booking => {
          const isExpanded = expandedId === booking.id
          const draft = editingDrafts[booking.id] ?? booking.aiDraft

          return (
            <div
              key={booking.id}
              className={`border rounded-2xl overflow-hidden ${
                booking.status === 'confirmed'
                  ? 'border-farm-200 bg-farm-50'
                  : booking.status === 'cancelled'
                  ? 'border-red-100 bg-red-50'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <button
                className="w-full text-left p-3"
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-stone-800">{booking.guestName}</p>
                      <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                        {booking.guestLanguage}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      📅 {booking.date} · 👥 {booking.groupSize} people · {booking.tourType.split('(')[0].trim()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {booking.status === 'confirmed' ? (
                      <CheckCircle size={16} className="text-farm-600" />
                    ) : (
                      <Clock size={16} className="text-amber-500" />
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 p-3 space-y-3">
                  {booking.notes && (
                    <p className="text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2">
                      📝 {booking.notes}
                    </p>
                  )}

                  {/* AI Draft section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-stone-600">
                        Confirmation message ({booking.guestLanguage}):
                      </p>
                      <button
                        onClick={() => handleDraft(booking)}
                        disabled={draftingId === booking.id}
                        className="flex items-center gap-1 text-xs text-coffee-600 font-medium disabled:opacity-50"
                      >
                        {draftingId === booking.id ? (
                          <><Loader2 size={12} className="animate-spin" /> Drafting…</>
                        ) : (
                          <><Sparkles size={12} /> {booking.aiDraft ? 'Re-draft' : 'AI Draft'}</>
                        )}
                      </button>
                    </div>
                    {draft ? (
                      <textarea
                        value={draft}
                        onChange={e => setEditingDrafts(prev => ({ ...prev, [booking.id]: e.target.value }))}
                        className="w-full border border-stone-200 rounded-xl p-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300 bg-white"
                        rows={7}
                      />
                    ) : (
                      <div className="border border-dashed border-stone-200 rounded-xl p-4 text-center">
                        <p className="text-xs text-stone-400">
                          Tap "AI Draft" to generate a confirmation in {booking.guestLanguage}
                        </p>
                      </div>
                    )}
                  </div>

                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleConfirm(booking.id)}
                      className="w-full bg-farm-600 text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95"
                    >
                      ✓ Confirm Booking
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <p className="text-xs text-farm-700 font-semibold text-center">✓ Booking confirmed</p>
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
