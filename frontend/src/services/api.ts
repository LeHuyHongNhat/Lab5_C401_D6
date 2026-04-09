import type { MedicalRecord } from '../types/medicalRecord'

export interface TranscriptTurn {
  speaker: 'doctor' | 'patient'
  text: string
}

export interface TranscribeResponse {
  session_id: string
  transcript: TranscriptTurn[]
  medical_record: MedicalRecord
}

export interface CorrectionEntry {
  field: string
  action: 'accepted' | 'edited' | 'declined'
  agent_value: string
  final_value: string
  latency_ms?: number
}

// ── Transcribe ───────────────────────────────────────────────────────────────

export async function transcribeAudio(
  audioBlob: Blob,
  patientId: string,
  sessionId: string,
): Promise<TranscribeResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('patient_id', patientId)
  formData.append('session_id', sessionId)
  formData.append('whisper_model', 'small')

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Lỗi server: ${res.status}`)
  }

  return res.json()
}

// ── Save record ──────────────────────────────────────────────────────────────

export async function saveRecord(
  sessionId: string,
  medicalRecord: MedicalRecord,
  corrections: CorrectionEntry[] = [],
): Promise<{ status: string }> {
  const res = await fetch('/api/records/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      medical_record: medicalRecord,
      corrections,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Lỗi server: ${res.status}`)
  }

  return res.json()
}

// ── Health check ─────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health')
    return res.ok
  } catch {
    return false
  }
}
