/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { KhamLamSang, MedicalRecord, PatientInfo, VisitInfo } from '../types/medicalRecord'
import { transcribeAudio, saveRecord } from '../services/api'

export type Speaker = 'doctor' | 'patient'

export interface TranscriptTurn {
  speaker: Speaker
  text: string
}

// Patient ID được truyền từ hệ thống đăng ký bệnh viện
const CURRENT_PATIENT_ID = 'BN-2026-00001'

const emptyMedicalRecord: MedicalRecord = {
  patient: { patient_id: CURRENT_PATIENT_ID },
  visit: {},
}

interface ClinicalScribeContextValue {
  showToast: boolean
  isRecording: boolean
  isProcessing: boolean
  processingError: string | null
  showSoap: boolean
  transcriptTurns: TranscriptTurn[]
  medicalRecordDraft: MedicalRecord
  recordingTime: string
  canUndo: boolean
  canRedo: boolean
  setShowToast: (open: boolean) => void
  handleStartRecording: () => void
  handleStopAndProcess: () => void
  handleSaveRecord: () => Promise<void>
  updatePatientField: (field: keyof PatientInfo, value: string) => void
  updateVisitField: (field: keyof VisitInfo, value: string | string[] | KhamLamSang) => void
  updateKhamLamSangField: (field: keyof KhamLamSang, value: string) => void
  toggleXetNghiem: (testName: string) => void
  handleCancelCase: () => void
  undoSoap: () => void
  redoSoap: () => void
}

const ClinicalScribeContext = createContext<ClinicalScribeContextValue | undefined>(undefined)

export function ClinicalScribeProvider({ children }: { children: ReactNode }) {
  const [showToast, setShowToast] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([])
  const [medicalRecordDraft, setMedicalRecordDraft] = useState<MedicalRecord>(emptyMedicalRecord)
  const [showSoap, setShowSoap] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  const soapHistoryRef = useRef<MedicalRecord[]>([emptyMedicalRecord])
  const soapHistoryIndexRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const recordingIntervalRef = useRef<number | null>(null)

  const recordingTimeRef = useRef(0)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const recordingTime = useMemo(() => {
    const mm = String(Math.floor(recordingSeconds / 60)).padStart(2, '0')
    const ss = String(recordingSeconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [recordingSeconds])

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(soapHistoryIndexRef.current > 0)
    setCanRedo(soapHistoryIndexRef.current < soapHistoryRef.current.length - 1)
  }, [])

  const commitHistory = useCallback((next: MedicalRecord) => {
    const base = soapHistoryRef.current.slice(0, soapHistoryIndexRef.current + 1)
    soapHistoryRef.current = [...base, next]
    soapHistoryIndexRef.current = soapHistoryRef.current.length - 1
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const resetSoapHistory = useCallback((value: MedicalRecord) => {
    soapHistoryRef.current = [value]
    soapHistoryIndexRef.current = 0
    syncHistoryFlags()
  }, [syncHistoryFlags])

  // Timer đếm giây khi đang ghi âm
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0)
      recordingTimeRef.current = 0
      return
    }
    recordingIntervalRef.current = window.setInterval(() => {
      recordingTimeRef.current += 1
      setRecordingSeconds(recordingTimeRef.current)
    }, 1000)
    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  const handleStartRecording = useCallback(async () => {
    setTranscriptTurns([])
    setShowSoap(false)
    setIsProcessing(false)
    setProcessingError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(500) // gửi chunk mỗi 500ms
      setIsRecording(true)

      // Tạo session ID mới cho mỗi lần ghi
      const newSessionId = `VNM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`
      setSessionId(newSessionId)
    } catch (err) {
      setProcessingError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.')
    }
  }, [])

  const handleStopAndProcess = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    setIsRecording(false)
    setIsProcessing(true)
    setProcessingError(null)

    // Dừng recorder và chờ onstop
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    })

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const result = await transcribeAudio(audioBlob, CURRENT_PATIENT_ID, sessionId)

      const record: MedicalRecord = result.medical_record
      setTranscriptTurns(result.transcript as TranscriptTurn[])
      setMedicalRecordDraft(record)
      setShowSoap(true)
      resetSoapHistory(record)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setProcessingError(msg)
      setShowSoap(false)
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, resetSoapHistory])

  const updatePatientField = useCallback(
    (field: keyof PatientInfo, value: string) => {
      setMedicalRecordDraft((prev) => {
        const next: MedicalRecord = {
          ...prev,
          patient: {
            ...prev.patient,
            [field]: value,
          },
        }
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          commitHistory(next)
        }
        return next
      })
    },
    [commitHistory],
  )

  const updateVisitField = useCallback(
    (field: keyof VisitInfo, value: string | string[] | KhamLamSang) => {
      setMedicalRecordDraft((prev) => {
        const next: MedicalRecord = {
          ...prev,
          visit: {
            ...prev.visit,
            [field]: value,
          },
        }
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          commitHistory(next)
        }
        return next
      })
    },
    [commitHistory],
  )

  const updateKhamLamSangField = useCallback(
    (field: keyof KhamLamSang, value: string) => {
      setMedicalRecordDraft((prev) => {
        const next: MedicalRecord = {
          ...prev,
          visit: {
            ...prev.visit,
            kham_lam_sang: {
              ...(prev.visit.kham_lam_sang ?? {}),
              [field]: value,
            },
          },
        }
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          commitHistory(next)
        }
        return next
      })
    },
    [commitHistory],
  )

  const toggleXetNghiem = useCallback(
    (testName: string) => {
      setMedicalRecordDraft((prev) => {
        const current = prev.visit.xet_nghiem ?? []
        const hasItem = current.includes(testName)
        const nextList = hasItem ? current.filter((item) => item !== testName) : [...current, testName]

        const next: MedicalRecord = {
          ...prev,
          visit: {
            ...prev.visit,
            xet_nghiem: nextList,
          },
        }

        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          commitHistory(next)
        }

        return next
      })
    },
    [commitHistory],
  )

  const handleCancelCase = useCallback(() => {
    // Dừng recorder nếu đang ghi
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []

    setTranscriptTurns([])
    setShowSoap(false)
    setIsRecording(false)
    setIsProcessing(false)
    setProcessingError(null)
    setMedicalRecordDraft(emptyMedicalRecord)

    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    resetSoapHistory(emptyMedicalRecord)
  }, [resetSoapHistory])

  const handleSaveRecord = useCallback(async () => {
    try {
      await saveRecord(sessionId, medicalRecordDraft)
      setShowToast(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu bệnh án'
      setProcessingError(msg)
    }
  }, [sessionId, medicalRecordDraft])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) window.clearInterval(recordingIntervalRef.current)
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
        recorder.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const undoSoap = useCallback(() => {
    if (soapHistoryIndexRef.current <= 0) return
    soapHistoryIndexRef.current -= 1
    setMedicalRecordDraft(soapHistoryRef.current[soapHistoryIndexRef.current])
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const redoSoap = useCallback(() => {
    if (soapHistoryIndexRef.current >= soapHistoryRef.current.length - 1) return
    soapHistoryIndexRef.current += 1
    setMedicalRecordDraft(soapHistoryRef.current[soapHistoryIndexRef.current])
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const value = useMemo<ClinicalScribeContextValue>(
    () => ({
      showToast,
      isRecording,
      isProcessing,
      processingError,
      showSoap,
      transcriptTurns,
      medicalRecordDraft,
      recordingTime,
      canUndo,
      canRedo,
      setShowToast,
      handleStartRecording,
      handleStopAndProcess,
      handleSaveRecord,
      updatePatientField,
      updateVisitField,
      updateKhamLamSangField,
      toggleXetNghiem,
      handleCancelCase,
      undoSoap,
      redoSoap,
    }),
    [
      canRedo,
      canUndo,
      handleCancelCase,
      handleSaveRecord,
      handleStartRecording,
      handleStopAndProcess,
      isProcessing,
      isRecording,
      medicalRecordDraft,
      processingError,
      recordingTime,
      redoSoap,
      showSoap,
      showToast,
      transcriptTurns,
      undoSoap,
      updateKhamLamSangField,
      updatePatientField,
      updateVisitField,
      toggleXetNghiem,
    ],
  )

  return <ClinicalScribeContext.Provider value={value}>{children}</ClinicalScribeContext.Provider>
}

export function useClinicalScribe() {
  const context = useContext(ClinicalScribeContext)
  if (!context) {
    throw new Error('useClinicalScribe must be used within ClinicalScribeProvider')
  }
  return context
}
