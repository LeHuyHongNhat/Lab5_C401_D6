import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Mic, Redo2, Save, Stethoscope, Undo2, X, XCircle } from 'lucide-react'
import { Badge } from './components/ui/Badge'
import { Button } from './components/ui/Button'
import { Modal } from './components/ui/Modal'
import { Toast } from './components/ui/Toast'
import { useClinicalScribe } from './context/ClinicalScribeContext'
import { getReviewTokens } from './utils/reviewTokens'

function App() {
  const [confirmType, setConfirmType] = useState<'cancel' | 'newCase' | 'save' | null>(null)
  const [selectedHighlightStart, setSelectedHighlightStart] = useState<number | null>(null)
  const [highlightDecisions, setHighlightDecisions] = useState<Record<number, 'accepted'>>({})

  const {
    showToast,
    isRecording,
    isRealRecording,
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
    handleStartRealRecording,
    handleStopRealRecording,
    updatePatientField,
    updateVisitField,
    updateKhamLamSangField,
    toggleXetNghiem,
    handleCancelCase,
    undoSoap,
    redoSoap,
  } = useClinicalScribe()

  const transcriptRef = useRef<HTMLDivElement | null>(null)

  function handleSaveRequest() {
    const activeEl = document.activeElement as HTMLElement | null
    if (activeEl && activeEl.isContentEditable) {
      activeEl.blur()
    }

    window.setTimeout(() => {
      setConfirmType('save')
    }, 0)
  }

  useEffect(() => {
    if (!transcriptRef.current) return
    transcriptRef.current.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [transcriptTurns])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasCtrlOrCmd = event.ctrlKey || event.metaKey

      if (!hasCtrlOrCmd) return

      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
        if (!showSoap || isProcessing) return
        handleSaveRequest()
      }

      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redoSoap()
        } else {
          undoSoap()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isProcessing, redoSoap, showSoap, undoSoap])

  const confirmTitle =
    confirmType === 'save'
      ? 'Xác nhận lưu bệnh án?'
      : confirmType === 'newCase'
        ? 'Xác nhận chuyển sang ca mới?'
        : 'Xác nhận huỷ bản nháp SOAP?'

  const confirmDescription =
    confirmType === 'save'
      ? 'Hồ sơ bệnh án có cấu trúc hiện tại sẽ được lưu.'
      : confirmType === 'newCase'
        ? 'Thao tác này sẽ xoá transcript và hồ sơ hiện tại để bắt đầu ca mới.'
        : 'Thao tác này sẽ huỷ toàn bộ dữ liệu transcript và hồ sơ bệnh án hiện tại.'

  const confirmButtonText = confirmType === 'save' ? 'Lưu bệnh án' : confirmType === 'newCase' ? 'Ca mới' : 'Huỷ'

  const handleConfirmAction = () => {
    if (confirmType === 'save') {
      setShowToast(true)
      setConfirmType(null)
      return
    }

    setSelectedHighlightStart(null)
    setHighlightDecisions({})
    handleCancelCase()
    setConfirmType(null)
  }

  const xetNghiemOptions = ['Nội soi dạ dày tá tràng', 'Xét nghiệm máu cơ bản', 'Test HP hơi thở']
  const danDoText = medicalRecordDraft.visit.dan_do ?? ''
  const reviewTokens = getReviewTokens(danDoText)
  const hasSelectedToken =
    selectedHighlightStart !== null && reviewTokens.some((token) => token.start === selectedHighlightStart)

  const applyDecision = (decision: 'accepted' | 'rejected') => {
    if (reviewTokens.length === 0) return

    const selectedTokens =
      hasSelectedToken && selectedHighlightStart !== null
        ? reviewTokens.filter((token) => token.start === selectedHighlightStart)
        : reviewTokens

    if (decision === 'accepted') {
      const nextAccepted: Record<number, 'accepted'> = {}
      selectedTokens.forEach((token) => {
        nextAccepted[token.start] = 'accepted'
      })

      setHighlightDecisions((prev) => ({ ...prev, ...nextAccepted }))
      return
    }

    let cursor = 0
    let nextPlan = ''

    selectedTokens.forEach((token) => {
      nextPlan += danDoText.slice(cursor, token.start)
      cursor = token.end
    })

    nextPlan += danDoText.slice(cursor)

    updateVisitField('dan_do', nextPlan.replace(/\s{2,}/g, ' ').trim())
    setSelectedHighlightStart(null)
    setHighlightDecisions({})
  }

  return (
    <div className="relative min-h-screen px-4 py-6 md:px-8 overflow-hidden font-sans">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 animate-fade-in">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-vinmec-primary via-blue-800 to-vinmec-primary px-6 py-5 text-white shadow-lg ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white font-bold text-vinmec-alert">
              V
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">Vinmec HIS | Clinical Scribe AI</h1>
              <p className="text-sm text-blue-200">
                BN: {medicalRecordDraft.patient.ho_ten ?? '---'} (ID: {medicalRecordDraft.patient.patient_id ?? '---'}) •
                Ngày khám: {medicalRecordDraft.visit.ngay_kham ?? '---'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="ai" className="bg-blue-700 text-white">
              Stage 3 Layout
            </Badge>
            <div className="flex items-center gap-2 rounded-lg bg-blue-800/80 px-3 py-2 text-sm text-blue-50">
              <Stethoscope size={16} />
              <span>BS. Lê Huy Hồng Nhật • Phòng 401</span>
            </div>
          </div>
        </header>

        <main className="grid min-h-[65vh] grid-cols-1 gap-5 md:grid-cols-[3fr_7fr]">
          <section className="glass-panel flex flex-col overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Live Transcript</h2>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">{recordingTime}</span>
              </div>
              
              <div className="flex gap-2">
                {isRealRecording ? (
                  <Button variant="danger" iconLeft={<Mic size={16} />} onClick={handleStopRealRecording} className="flex-1 shadow-sm animate-pulse">
                    Dừng (Whisper)
                  </Button>
                ) : isRecording ? (
                  <Button variant="danger" iconLeft={<Mic size={16} />} onClick={handleStopAndProcess} className="flex-1 shadow-sm animate-pulse">
                    Dừng (Demo)
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      iconLeft={<Mic size={16} />}
                      onClick={() => {
                        setSelectedHighlightStart(null)
                        setHighlightDecisions({})
                        handleStartRealRecording()
                      }}
                      className="flex-1 shadow-sm"
                      disabled={isProcessing}
                    >
                      Ghi âm (Whisper)
                    </Button>
                    <Button
                      variant="secondary"
                      iconLeft={<Mic size={16} />}
                      onClick={() => {
                        setSelectedHighlightStart(null)
                        setHighlightDecisions({})
                        handleStartRecording()
                      }}
                      className="flex-1 shadow-sm bg-white hover:bg-gray-50"
                      disabled={isProcessing}
                    >
                      Demo (Mock)
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm bg-white/30">
              {transcriptTurns.length === 0 ? (
                <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-gray-500">
                  Bấm “Ghi âm (Whisper)” hoặc “Demo (Mock)” để bắt đầu
                </div>
              ) : null}

              {transcriptTurns.map((turn, index) => (
                <p
                  key={`${turn.speaker}-${index}`}
                  className={`rounded-lg p-3 text-gray-800 shadow-sm ${
                    turn.speaker === 'doctor' ? 'bg-gray-100 border border-gray-200' : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <span className="font-semibold">{turn.speaker === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}:</span>{' '}
                  {turn.text}
                </p>
              ))}

              {isRealRecording ? (
                <p className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs font-medium text-red-700 shadow-sm">
                  <span className="blink-dot inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
                  Đang ghi âm thật... (Whisper sẽ xử lý khi dừng)
                </p>
              ) : isRecording ? (
                <p className="inline-flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs font-medium text-orange-700 shadow-sm">
                  <span className="blink-dot inline-block h-2.5 w-2.5 rounded-full bg-orange-400 shadow-sm" />
                  Đang chạy demo (Mock transcript)
                </p>
              ) : null}
            </div>
          </section>

          <section className="glass-panel flex flex-col overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">MedicalRecord Draft</h2>
              <Badge variant="ai">{showSoap ? 'AI Generated' : 'Chờ xử lý AI'}</Badge>
            </div>

            <div className="grid flex-1 gap-5 p-4 md:grid-cols-2">
              {isProcessing ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm animate-fade-in">
                  <div className="animate-spin rounded-full border-4 border-blue-200 border-t-vinmec-action h-10 w-10 mb-3"></div>
                  <p className="text-sm font-semibold text-blue-900 shadow-sm px-4 py-2 bg-white/80 rounded-full">AI đang xử lý & điền form...</p>
                </div>
              ) : null}

              {showSoap ? (
                <>
                  <article className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-1 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Thông tin chung (Hành chính)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Họ tên</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.patient.ho_ten ?? ''}
                          onChange={(e) => updatePatientField('ho_ten', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Mã BN</label>
                          <input
                            className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                            value={medicalRecordDraft.patient.patient_id ?? ''}
                            onChange={(e) => updatePatientField('patient_id', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Giới tính</label>
                          <input
                            className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                            value={medicalRecordDraft.patient.gioi_tinh ?? ''}
                            onChange={(e) => updatePatientField('gioi_tinh', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Ngày sinh</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.patient.ngay_sinh ?? ''}
                          onChange={(e) => updatePatientField('ngay_sinh', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Địa chỉ</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.patient.dia_chi ?? ''}
                          onChange={(e) => updatePatientField('dia_chi', e.target.value)}
                        />
                      </div>
                    </div>
                  </article>

                  <article className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-1 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Thông tin khám (Bệnh sử)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Ngày khám</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.ngay_kham ?? ''}
                          onChange={(e) => updateVisitField('ngay_kham', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Lý do khám</label>
                        <textarea
                          rows={2}
                          className="w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.ly_do_kham ?? ''}
                          onChange={(e) => updateVisitField('ly_do_kham', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Bệnh sử / Dị ứng</label>
                        <textarea
                          rows={2}
                          className="w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.benh_su ?? ''}
                          onChange={(e) => updateVisitField('benh_su', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Triệu chứng</label>
                        <textarea
                          rows={2}
                          className="w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.trieu_chung ?? ''}
                          onChange={(e) => updateVisitField('trieu_chung', e.target.value)}
                        />
                      </div>
                    </div>
                  </article>

                  <article className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-2 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Khám Lâm Sàng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Nhận xét chung</label>
                        <textarea
                          rows={2}
                          className="w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.kham_lam_sang?.nhan_xet_chung ?? ''}
                          onChange={(e) => updateKhamLamSangField('nhan_xet_chung', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Cảm xúc</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.kham_lam_sang?.cam_xuc ?? ''}
                          onChange={(e) => updateKhamLamSangField('cam_xuc', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Tư duy</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.kham_lam_sang?.tu_duy ?? ''}
                          onChange={(e) => updateKhamLamSangField('tu_duy', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Tri giác</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.kham_lam_sang?.tri_giac ?? ''}
                          onChange={(e) => updateKhamLamSangField('tri_giac', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Hành vi</label>
                        <input
                          className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                          value={medicalRecordDraft.visit.kham_lam_sang?.hanh_vi ?? ''}
                          onChange={(e) => updateKhamLamSangField('hanh_vi', e.target.value)}
                        />
                      </div>
                    </div>
                  </article>

                  <article className="rounded-xl border border-red-100 bg-red-50/30 p-4 md:col-span-2 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-3 text-sm font-bold text-red-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Chẩn đoán (Assessment)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Chẩn đoán</label>
                        <input
                          className="w-full font-medium text-red-700 rounded border border-red-200 bg-white p-2 text-sm transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                          value={medicalRecordDraft.visit.chan_doan ?? ''}
                          onChange={(e) => updateVisitField('chan_doan', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">ICD-10 Code</label>
                        <input
                          className="w-full font-mono font-medium text-red-700 rounded border border-red-200 bg-white p-2 text-sm transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                          value={medicalRecordDraft.visit.chan_doan_icd ?? ''}
                          onChange={(e) => updateVisitField('chan_doan_icd', e.target.value)}
                        />
                      </div>
                    </div>
                  </article>

                  <article className="relative rounded-xl border border-yellow-200 bg-yellow-50/30 p-4 md:col-span-2 shadow-sm transition-all hover:shadow-md">
                    <div className="absolute -right-2 -top-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900 shadow-md shadow-yellow-200/50">
                      Cần Review
                    </div>

                    <h3 className="mb-3 border-b border-yellow-200 pb-2 text-sm font-bold text-yellow-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Điều trị & Dặn dò
                    </h3>

                    <div className="space-y-4 text-sm mt-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">1. Cận lâm sàng (xet_nghiem)</label>
                        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                          {xetNghiemOptions.map((option) => (
                            <label className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer transition hover:bg-gray-100 hover:border-gray-300" key={option}>
                              <input
                                type="checkbox"
                                checked={(medicalRecordDraft.visit.xet_nghiem ?? []).includes(option)}
                                onChange={() => toggleXetNghiem(option)}
                                className="accent-vinmec-action w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Ngày tái khám</label>
                          <input
                            type="date"
                            className="w-full rounded border border-gray-200 bg-white p-2 text-sm text-gray-800 transition focus:border-vinmec-action focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                            value={medicalRecordDraft.visit.ngay_tai_kham ?? ''}
                            onChange={(e) => updateVisitField('ngay_tai_kham', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">2. Hướng điều trị (Kê đơn)</label>
                          <textarea
                            rows={3}
                            className="w-full resize-none rounded border border-gray-200 bg-white p-2 text-sm justify-start items-start text-gray-800 transition focus:border-vinmec-action focus:outline-none focus:ring-1 focus:ring-vinmec-action"
                            value={medicalRecordDraft.visit.huong_dieu_tri ?? ''}
                            onChange={(e) => updateVisitField('huong_dieu_tri', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">3. Dặn dò (Cảnh báo độ tin cậy AI)</label>
                        <p
                          key={`dando-key-${medicalRecordDraft.visit.dan_do}`}
                          className="mt-1 min-h-[5rem] whitespace-pre-line rounded border border-yellow-300 bg-white p-3 text-sm leading-relaxed text-gray-700 shadow-sm focus:border-yellow-500 focus:outline-none"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateVisitField('dan_do', e.currentTarget.textContent ?? '')}
                        >
                          {reviewTokens.length === 0
                            ? danDoText
                            : (() => {
                                const nodes: ReactNode[] = []
                                let cursor = 0

                                reviewTokens.forEach((token, idx) => {
                                  if (cursor < token.start) {
                                    nodes.push(danDoText.slice(cursor, token.start))
                                  }

                                  const decision = highlightDecisions[token.start]
                                  const isSelected = hasSelectedToken && selectedHighlightStart === token.start

                                  if (decision === 'accepted') {
                                    nodes.push(danDoText.slice(token.start, token.end))
                                  } else {
                                    nodes.push(
                                      <span
                                        key={`token-${token.start}-${idx}`}
                                        className={`rounded border px-1.5 py-0.5 underline decoration-dashed underline-offset-2 transition-colors cursor-pointer ${
                                          isSelected
                                            ? 'border-blue-400 bg-blue-100 text-blue-900 shadow-sm'
                                            : 'border-yellow-400 bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                                        }`}
                                        onMouseDown={(e) => {
                                          e.preventDefault()
                                          setSelectedHighlightStart(token.start)
                                        }}
                                      >
                                        {danDoText.slice(token.start, token.end)}
                                      </span>,
                                    )
                                  }

                                  cursor = token.end
                                })

                                if (cursor < danDoText.length) {
                                  nodes.push(danDoText.slice(cursor))
                                }

                                return nodes
                              })()}{' '}
                        </p>

                        {reviewTokens.length > 0 ? (
                          <div className="mt-3 flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-gray-100">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-md border border-green-400 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 hover:shadow-sm"
                              onClick={() => applyDecision('accepted')}
                              title="Chấp nhận highlight đang chọn, hoặc tất cả nếu chưa chọn"
                            >
                              <Check size={14} className="stroke-[3]" />
                              Duyệt nội dung
                            </button>

                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 hover:shadow-sm"
                              onClick={() => applyDecision('rejected')}
                              title="Từ chối nội dung này"
                            >
                              <X size={14} className="stroke-[3]" />
                              Từ chối
                            </button>

                            {hasSelectedToken ? (
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                                onClick={() => setSelectedHighlightStart(null)}
                              >
                                Bỏ chọn focus
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">Chưa trỏ vào từ khóa cụ thể → thao tác áp dụng All</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </>
              ) : null}
            </div>
          </section>
        </main>

        <footer className="glass-panel flex flex-wrap items-center justify-end gap-3 rounded-2xl px-5 py-4">
          <Button
            variant="secondary"
            iconLeft={<Undo2 size={16} />}
            onClick={undoSoap}
            disabled={!showSoap || isProcessing || !canUndo}
            title="Undo (Ctrl/Cmd + Z)"
          >
            Undo
          </Button>
          <Button
            variant="secondary"
            iconLeft={<Redo2 size={16} />}
            onClick={redoSoap}
            disabled={!showSoap || isProcessing || !canRedo}
            title="Redo (Ctrl/Cmd + Shift + Z)"
          >
            Redo
          </Button>
          <Button variant="ghost" iconLeft={<XCircle size={16} />} onClick={() => setConfirmType('cancel')}>
            Hủy
          </Button>
          <Button variant="ghost" onClick={() => setConfirmType('newCase')}>
            Ca mới
          </Button>
          <Button
            iconLeft={<Save size={16} />}
            onClick={handleSaveRequest}
            disabled={!showSoap || isProcessing}
            title="Lưu bệnh án (Ctrl/Cmd + S)"
          >
            Lưu bệnh án
          </Button>
        </footer>
      </div>

      <Modal
        open={confirmType !== null}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={confirmButtonText}
        cancelText="Quay lại"
        onCancel={() => setConfirmType(null)}
        onConfirm={handleConfirmAction}
      />

      <Toast
        open={showToast}
        message="Đã lưu bệnh án thành công"
        duration={5000}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}

export default App
