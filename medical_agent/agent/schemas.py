from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class PatientInfo(BaseModel):
    ho_ten: Optional[str] = Field(None, description="Họ và tên đầy đủ của bệnh nhân")
    gioi_tinh: Optional[str] = Field(None, description="'Nam' hoặc 'Nữ'")
    ngay_sinh: Optional[str] = Field(None, description="Ngày sinh, định dạng YYYY-MM-DD")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ thường trú")
    patient_id: Optional[str] = Field(None, description="Mã bệnh nhân nội bộ, ví dụ 'BN-2026-00001'")


class KhamLamSang(BaseModel):
    nhan_xet_chung: Optional[str] = Field(None, description="Nhận xét chung về tình trạng bệnh nhân")
    cam_xuc: Optional[str] = Field(None, description="Trạng thái cảm xúc")
    tu_duy: Optional[str] = Field(None, description="Đánh giá tư duy")
    tri_giac: Optional[str] = Field(None, description="Đánh giá tri giác, ảo giác")
    hanh_vi: Optional[str] = Field(None, description="Nhận xét hành vi")


class VisitInfo(BaseModel):
    ngay_kham: Optional[str] = Field(None, description="Ngày khám, định dạng YYYY-MM-DD")
    benh_su: Optional[str] = Field(None, description="Tiền sử bệnh và dị ứng thuốc")
    ly_do_kham: Optional[str] = Field(None, description="Lý do bệnh nhân đến khám")
    trieu_chung: Optional[str] = Field(None, description="Các triệu chứng bệnh nhân mô tả")
    kham_lam_sang: Optional[KhamLamSang] = Field(None, description="Kết quả khám lâm sàng")
    xet_nghiem: Optional[List[str]] = Field(None, description="Danh sách xét nghiệm được chỉ định")
    chan_doan: Optional[str] = Field(None, description="Chẩn đoán bệnh bằng tiếng Việt")
    chan_doan_icd: Optional[str] = Field(None, description="Mã ICD-10 tương ứng")
    huong_dieu_tri: Optional[str] = Field(None, description="Phác đồ điều trị")
    dan_do: Optional[str] = Field(None, description="Lời dặn dò của bác sĩ")
    ngay_tai_kham: Optional[str] = Field(None, description="Ngày hẹn tái khám, định dạng YYYY-MM-DD")


class MedicalRecord(BaseModel):
    """Hồ sơ bệnh án có cấu trúc được trích xuất từ hội thoại khám bệnh."""

    patient: PatientInfo
    visit: VisitInfo
