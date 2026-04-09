export interface PatientInfo {
  ho_ten?: string
  gioi_tinh?: string
  ngay_sinh?: string
  dia_chi?: string
  patient_id?: string
}

export interface KhamLamSang {
  nhan_xet_chung?: string
  cam_xuc?: string
  tu_duy?: string
  tri_giac?: string
  hanh_vi?: string
}

export interface VisitInfo {
  ngay_kham?: string
  benh_su?: string
  ly_do_kham?: string
  trieu_chung?: string
  kham_lam_sang?: KhamLamSang
  xet_nghiem?: string[]
  chan_doan?: string
  chan_doan_icd?: string
  huong_dieu_tri?: string
  dan_do?: string
  ngay_tai_kham?: string
}

export interface MedicalRecord {
  patient: PatientInfo
  visit: VisitInfo
}
