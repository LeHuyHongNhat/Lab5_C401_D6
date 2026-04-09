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

export type Speaker = 'doctor' | 'patient'

export interface TranscriptTurn {
  speaker: Speaker
  text: string
}

const scriptedTurns: TranscriptTurn[] = [
  { speaker: 'doctor', text: 'Anh/chị đến khám vì lý do gì hôm nay?' },
  { speaker: 'patient', text: 'Tôi đau bụng vùng thượng vị và buồn nôn khoảng 3 ngày.' },
  { speaker: 'doctor', text: 'Cơn đau tăng sau ăn hay lúc đói?' },
  { speaker: 'patient', text: 'Đau tăng sau ăn đồ chua cay, đôi lúc ợ chua.' },
  { speaker: 'doctor', text: 'Tôi sẽ chỉ định nội soi và xét nghiệm máu để đánh giá thêm.' },
]

const initialMedicalRecord: MedicalRecord = {
  patient: {
    ho_ten: 'Nguyễn Văn A',
    gioi_tinh: 'Nam',
    ngay_sinh: '1988-05-20',
    dia_chi: 'Q. Bình Thạnh, TP.HCM',
    patient_id: 'BN-2026-00001',
  },
  visit: {
    ngay_kham: '2026-04-09',
    benh_su: 'Chưa ghi nhận dị ứng thuốc.',
    ly_do_kham: 'Đau bụng vùng thượng vị 3 ngày, buồn nôn.',
    trieu_chung: 'Đau tăng sau ăn đồ chua cay, đôi lúc ợ chua.',
    kham_lam_sang: {
      nhan_xet_chung: 'Tỉnh táo, tiếp xúc tốt, sinh hiệu ổn định.',
      cam_xuc: 'Lo lắng nhẹ vì đau kéo dài.',
      tu_duy: 'Mạch lạc, trả lời đúng trọng tâm.',
      tri_giac: 'Không ghi nhận rối loạn tri giác/ảo giác.',
      hanh_vi: 'Hợp tác khám, hành vi phù hợp.',
    },
    xet_nghiem: ['Nội soi dạ dày tá tràng', 'Xét nghiệm máu cơ bản'],
    chan_doan: 'Trào ngược dạ dày thực quản (GERD), theo dõi viêm dạ dày.',
    chan_doan_icd: 'K21.9',
    huong_dieu_tri: 'Pantoprazole 40mg uống buổi sáng trước ăn 30 phút.',
    dan_do: 'Kiêng đồ chua cay, tái khám sau 2 tuần. Hướng dẫn dùng thuốc: sau khi chăn trâu (??).',
    ngay_tai_kham: '2026-04-23',
  },
}

interface ClinicalScribeContextValue {
  showToast: boolean
  isRecording: boolean
  isProcessing: boolean
  showSoap: boolean
  transcriptTurns: TranscriptTurn[]
  medicalRecordDraft: MedicalRecord
  recordingTime: string
  canUndo: boolean
  canRedo: boolean
  setShowToast: (open: boolean) => void
  handleStartRecording: () => void
  handleStopAndProcess: () => void
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
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([])
  const [medicalRecordDraft, setMedicalRecordDraft] = useState<MedicalRecord>(initialMedicalRecord)
  const [showSoap, setShowSoap] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const soapHistoryRef = useRef<MedicalRecord[]>([initialMedicalRecord])
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
      setMedicalRecordDraft(initialMedicalRecord)
      setShowSoap(true)
      setIsProcessing(false)
      resetSoapHistory(initialMedicalRecord)
      processingTimeoutRef.current = null
    }, 2200)
  }, [resetSoapHistory])

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
    setTranscriptTurns([])
    setShowSoap(false)
    setIsRecording(false)
    setIsProcessing(false)
    setMedicalRecordDraft(initialMedicalRecord)

    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }

    resetSoapHistory(initialMedicalRecord)
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
      showSoap,
      transcriptTurns,
      medicalRecordDraft,
      recordingTime,
      canUndo,
      canRedo,
      setShowToast,
      handleStartRecording,
      handleStopAndProcess,
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
      handleStartRecording,
      handleStopAndProcess,
      isProcessing,
      isRecording,
      medicalRecordDraft,
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
