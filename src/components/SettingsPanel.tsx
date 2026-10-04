import { useState } from 'react'
import { Check, CheckCircle2, XCircle, Terminal } from 'lucide-react'
import type { AppSettings, FarmConfig, ServerStatus } from '../types'
import { ELEVENLABS_VOICES } from '../lib/elevenlabs'
import { defaultFarmConfig } from '../data/sampleData'

type Props = {
  settings: AppSettings
  farmConfig: FarmConfig
  serverStatus: ServerStatus | null
  onSaveSettings: (s: AppSettings) => void
  onSaveFarm: (f: FarmConfig) => void
}

export default function SettingsPanel({ settings, farmConfig, serverStatus, onSaveSettings, onSaveFarm }: Props) {
  const [farm, setFarm] = useState(farmConfig)
  const [voiceId, setVoiceId] = useState(settings.elevenLabsVoiceId)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSaveSettings({ elevenLabsVoiceId: voiceId })
    onSaveFarm(farm)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const StatusBadge = ({ ok, label }: { ok: boolean | null; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-stone-600">{label}</span>
      {ok === null ? (
        <span className="text-xs text-stone-400">Checking…</span>
      ) : ok ? (
        <span className="flex items-center gap-1 text-xs text-farm-600 font-semibold">
          <CheckCircle2 size={14} /> Configured
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
          <XCircle size={14} /> Not set
        </span>
      )}
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="font-bold text-stone-800">Settings</h2>
        <p className="text-xs text-stone-500">Farm config stored locally · API keys stay on the server</p>
      </div>

      {/* Server API status */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm text-stone-700">Server API Status</h3>
        <div className="bg-stone-50 rounded-xl p-4 space-y-3">
          <StatusBadge ok={serverStatus?.claude ?? null} label="Claude (ANTHROPIC_API_KEY)" />
          <StatusBadge ok={serverStatus?.elevenlabs ?? null} label="ElevenLabs (ELEVENLABS_API_KEY)" />
        </div>

        {/* Setup instructions */}
        <div className="bg-stone-900 rounded-xl p-4 space-y-2">
          <p className="text-xs text-stone-300 font-semibold flex items-center gap-2">
            <Terminal size={12} /> How to configure
          </p>
          <p className="text-xs text-stone-400 font-mono leading-relaxed">
            # Create .env.local in project root:<br />
            ANTHROPIC_API_KEY=sk-ant-...<br />
            ELEVENLABS_API_KEY=...<br />
            <br />
            # Then run:<br />
            vercel dev
          </p>
          <p className="text-xs text-stone-500 mt-2">
            Or set env vars in the Vercel dashboard for deployment.
            Keys are <span className="text-stone-300 font-semibold">never sent to the browser</span>.
          </p>
        </div>
      </section>

      {/* Voice preference */}
      <section className="space-y-2">
        <h3 className="font-semibold text-sm text-stone-700">Voice (ElevenLabs)</h3>
        <select
          value={voiceId}
          onChange={e => setVoiceId(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white"
        >
          {Object.entries(ELEVENLABS_VOICES).map(([key, { id, label }]) => (
            <option key={key} value={id}>{label}</option>
          ))}
        </select>
      </section>

      {/* Farm profile */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-stone-700">Farm Profile</h3>
          <button onClick={() => setFarm(defaultFarmConfig)} className="text-xs text-stone-400">Reset</button>
        </div>
        <div className="space-y-2">
          {[
            { key: 'name', placeholder: 'Farm name' },
            { key: 'ownerName', placeholder: 'Your name' },
            { key: 'location', placeholder: 'Location description' },
            { key: 'localLanguage', placeholder: 'Local language (e.g. Swahili)' },
            { key: 'phone', placeholder: 'Phone number' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              value={(farm as unknown as Record<string, string>)[key]}
              onChange={e => setFarm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
          ))}

          {/* Lat/Lng for offline map */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Latitude (for map)</label>
              <input
                type="number"
                step="0.0001"
                value={farm.lat}
                onChange={e => setFarm(f => ({ ...f, lat: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Longitude (for map)</label>
              <input
                type="number"
                step="0.0001"
                value={farm.lng}
                onChange={e => setFarm(f => ({ ...f, lng: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300"
              />
            </div>
          </div>

          <textarea
            value={farm.openingHours}
            onChange={e => setFarm(f => ({ ...f, openingHours: e.target.value }))}
            placeholder="Opening hours"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300"
            rows={2}
          />
          <textarea
            value={farm.directions}
            onChange={e => setFarm(f => ({ ...f, directions: e.target.value }))}
            placeholder="Directions"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coffee-300"
            rows={3}
          />
        </div>
      </section>

      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
          saved ? 'bg-farm-600 text-white' : 'bg-coffee-700 text-white active:scale-95'
        }`}
      >
        {saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
      </button>
    </div>
  )
}
