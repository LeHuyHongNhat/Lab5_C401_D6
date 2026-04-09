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

export type Speaker = 'doctor' | 'patient'

export interface TranscriptTurn {
  speaker: Speaker
  text: string
}

export interface SoapDraft {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

const scriptedTurns: TranscriptTurn[] = [
  { speaker: 'doctor', text: 'Anh đến khám vì triệu chứng gì hôm nay?' },
  { speaker: 'patient', text: 'Tôi đau bụng vùng thượng vị và buồn nôn khoảng 3 ngày.' },
  { speaker: 'doctor', text: 'Cơn đau tăng sau ăn hay lúc đói?' },
  { speaker: 'patient', text: 'Đau tăng sau ăn đồ chua cay, đôi lúc ợ chua.' },
  { speaker: 'doctor', text: 'Tôi sẽ cho chỉ định nội soi dạ dày để kiểm tra thêm.' },
]

const initialSoap: SoapDraft = {
  subjective:
    'Đau bụng vùng thượng vị 3 ngày, đau tăng sau ăn chua cay, kèm ợ chua và buồn nôn.',
  objective: 'Ấn đau nhẹ vùng thượng vị, không phản ứng thành bụng, sinh hiệu ổn định.',
  assessment: 'K21.9 - Trào ngược dạ dày thực quản (GERD), theo dõi viêm dạ dày.',
  plan:
    'Pantoprazole 40mg mỗi sáng trước ăn. Dặn dò kiêng đồ chua cay, tái khám sau 2 tuần. Hướng dẫn dùng thuốc: sau khi chăn trâu (??).',
}

interface ClinicalScribeContextValue {
  showToast: boolean
  showModal: boolean
  isRecording: boolean
  isProcessing: boolean
  showSoap: boolean
  transcriptTurns: TranscriptTurn[]
  soapDraft: SoapDraft
  uncertainPhrase: string
  recordingTime: string
  canUndo: boolean
  canRedo: boolean
  setShowToast: (open: boolean) => void
  setShowModal: (open: boolean) => void
  setUncertainPhrase: (value: string) => void
  handleStartRecording: () => void
  handleStopAndProcess: () => void
  updateSoapField: (field: keyof SoapDraft, value: string) => void
  handleCancelCase: () => void
  undoSoap: () => void
  redoSoap: () => void
}

const ClinicalScribeContext = createContext<ClinicalScribeContextValue | undefined>(undefined)

export function ClinicalScribeProvider({ children }: { children: ReactNode }) {
  const [showToast, setShowToast] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([])
  const [soapDraft, setSoapDraft] = useState<SoapDraft>(initialSoap)
  const [showSoap, setShowSoap] = useState(false)
  const [uncertainPhrase, setUncertainPhrase] = useState('sau khi chăn trâu (??)')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const soapHistoryRef = useRef<SoapDraft[]>([initialSoap])
  const soapHistoryIndexRef = useRef(0)
  const recordingIntervalRef = useRef<number | null>(null)
  const processingTimeoutRef = useRef<number | null>(null)

  const recordingTime = useMemo(() => {
    const seconds = transcriptTurns.length * 8
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [transcriptTurns.length])

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(soapHistoryIndexRef.current > 0)
    setCanRedo(soapHistoryIndexRef.current < soapHistoryRef.current.length - 1)
  }, [])

  const commitHistory = useCallback((next: SoapDraft) => {
    const base = soapHistoryRef.current.slice(0, soapHistoryIndexRef.current + 1)
    soapHistoryRef.current = [...base, next]
    soapHistoryIndexRef.current = soapHistoryRef.current.length - 1
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const resetSoapHistory = useCallback((value: SoapDraft) => {
    soapHistoryRef.current = [value]
    soapHistoryIndexRef.current = 0
    syncHistoryFlags()
  }, [syncHistoryFlags])

  useEffect(() => {
    if (!isRecording) return

    let idx = 0
    recordingIntervalRef.current = window.setInterval(() => {
      if (idx >= scriptedTurns.length) {
        if (recordingIntervalRef.current) {
          window.clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
        return
      }

      const nextTurn = scriptedTurns[idx]
      if (!nextTurn) {
        if (recordingIntervalRef.current) {
          window.clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
        return
      }

      setTranscriptTurns((prev) => [...prev, nextTurn])
      idx += 1
    }, 1200)

    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  const handleStartRecording = useCallback(() => {
    setTranscriptTurns([])
    setShowSoap(false)
    setIsProcessing(false)
    setUncertainPhrase('sau khi chăn trâu (??)')
    setIsRecording(true)
  }, [])

  const handleStopAndProcess = useCallback(() => {
    setIsRecording(false)
    setIsProcessing(true)

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }

    processingTimeoutRef.current = window.setTimeout(() => {
      setSoapDraft(initialSoap)
      setShowSoap(true)
      setIsProcessing(false)
      resetSoapHistory(initialSoap)
      processingTimeoutRef.current = null
    }, 2200)
  }, [resetSoapHistory])

  const updateSoapField = useCallback(
    (field: keyof SoapDraft, value: string) => {
      setSoapDraft((prev) => {
        const next = { ...prev, [field]: value }
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          commitHistory(next)
        }
        return next
      })
    },
    [commitHistory],
  )

  const handleCancelCase = useCallback(() => {
    setShowModal(false)
    setTranscriptTurns([])
    setShowSoap(false)
    setIsRecording(false)
    setIsProcessing(false)
    setSoapDraft(initialSoap)
    setUncertainPhrase('sau khi chăn trâu (??)')

    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }

    resetSoapHistory(initialSoap)
  }, [resetSoapHistory])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
      }
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [])

  const undoSoap = useCallback(() => {
    if (soapHistoryIndexRef.current <= 0) return
    soapHistoryIndexRef.current -= 1
    setSoapDraft(soapHistoryRef.current[soapHistoryIndexRef.current])
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const redoSoap = useCallback(() => {
    if (soapHistoryIndexRef.current >= soapHistoryRef.current.length - 1) return
    soapHistoryIndexRef.current += 1
    setSoapDraft(soapHistoryRef.current[soapHistoryIndexRef.current])
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const value = useMemo<ClinicalScribeContextValue>(
    () => ({
      showToast,
      showModal,
      isRecording,
      isProcessing,
      showSoap,
      transcriptTurns,
      soapDraft,
      uncertainPhrase,
      recordingTime,
      canUndo,
      canRedo,
      setShowToast,
      setShowModal,
      setUncertainPhrase,
      handleStartRecording,
      handleStopAndProcess,
      updateSoapField,
      handleCancelCase,
      undoSoap,
      redoSoap,
    }),
    [
      canRedo,
      canUndo,
      handleCancelCase,
      handleStartRecording,
      handleStopAndProcess,
      isProcessing,
      isRecording,
      recordingTime,
      redoSoap,
      showModal,
      showSoap,
      showToast,
      soapDraft,
      transcriptTurns,
      uncertainPhrase,
      undoSoap,
      updateSoapField,
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
