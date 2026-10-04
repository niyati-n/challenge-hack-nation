import { useState, useEffect } from 'react'
import { Home, MessageSquare, Star, CalendarDays, Settings, Globe } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import Dashboard from './components/Dashboard'
import TranslateChat from './components/TranslateChat'
import ReviewIntelligence from './components/ReviewIntelligence'
import BookingManager from './components/BookingManager'
import SettingsPanel from './components/SettingsPanel'
import DiscoverTab from './components/DiscoverTab'
import type { AppSettings, FarmConfig, ServerStatus } from './types'
import { defaultFarmConfig } from './data/sampleData'

type Tab = 'home' | 'discover' | 'chat' | 'reviews' | 'bookings' | 'settings'

const STORAGE_KEYS = {
  settings: 'tourlocal_settings_v2',
  farm: 'tourlocal_farm',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.settings)
    return saved ? JSON.parse(saved) : { elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL' }
  })
  const [farmConfig, setFarmConfig] = useState<FarmConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.farm)
    // Spread defaults first so fields added after the initial save (lat, lng) are always present
    return saved ? { ...defaultFarmConfig, ...JSON.parse(saved) } : defaultFarmConfig
  })
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.farm, JSON.stringify(farmConfig))
  }, [farmConfig])

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setServerStatus)
      .catch(() => setServerStatus({ claude: false, elevenlabs: false }))
  }, [])

  const serverReady = serverStatus?.claude === true

  const tabs = [
    { id: 'home' as Tab, label: 'Home', icon: Home },
    { id: 'discover' as Tab, label: 'Discover', icon: Globe },
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'reviews' as Tab, label: 'Reviews', icon: Star },
    { id: 'bookings' as Tab, label: 'Bookings', icon: CalendarDays },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto bg-white shadow-xl relative">
      <header className="bg-coffee-700 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-coffee-500 rounded-full flex items-center justify-center text-lg">☕</div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm leading-tight truncate">{farmConfig.name}</h1>
          <p className="text-coffee-200 text-xs">{farmConfig.location}</p>
        </div>
        {!serverReady && serverStatus !== null && (
          <button
            onClick={() => setTab('settings')}
            className="ml-auto text-xs bg-amber-400 text-amber-900 px-2 py-1 rounded-full font-semibold shrink-0"
          >
            Setup
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'home' && (
          <Dashboard farmConfig={farmConfig} serverReady={serverReady} onNavigate={setTab} />
        )}
        {tab === 'discover' && <DiscoverTab />}
        {tab === 'chat' && (
          <TranslateChat
            settings={settings}
            farmConfig={farmConfig}
            serverReady={serverReady}
            onNeedSettings={() => setTab('settings')}
          />
        )}
        {tab === 'reviews' && (
          <ReviewIntelligence
            farmConfig={farmConfig}
            serverReady={serverReady}
            onNeedSettings={() => setTab('settings')}
          />
        )}
        {tab === 'bookings' && (
          <BookingManager
            settings={settings}
            farmConfig={farmConfig}
            serverReady={serverReady}
            onNeedSettings={() => setTab('settings')}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            farmConfig={farmConfig}
            serverStatus={serverStatus}
            onSaveSettings={setSettings}
            onSaveFarm={setFarmConfig}
          />
        )}
      </main>

      <nav className="border-t border-stone-200 bg-white flex-shrink-0">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                tab === id ? 'text-coffee-700' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.5} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
