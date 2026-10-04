export async function speakText(
  text: string,
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL',
): Promise<void> {
  const res = await fetch('/api/elevenlabs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  })

  if (!res.ok) throw new Error(`Voice error ${res.status}`)

  const audioBuffer = await res.arrayBuffer()
  const audioCtx = new AudioContext()
  const decoded = await audioCtx.decodeAudioData(audioBuffer)
  const source = audioCtx.createBufferSource()
  source.buffer = decoded
  source.connect(audioCtx.destination)
  source.start(0)
}

export const ELEVENLABS_VOICES: Record<string, { id: string; label: string }> = {
  sarah: { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (warm, female)' },
  rachel: { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (calm, female)' },
  adam: { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (deep, male)' },
}
