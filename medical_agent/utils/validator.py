from typing import Tuple, List


# Các trường bắt buộc phải có giá trị trong hồ sơ
REQUIRED_FIELDS = [
    "patient.ho_ten",
    "patient.gioi_tinh",
    "visit.ngay_kham",
    "visit.ly_do_kham",
    "visit.trieu_chung",
    "visit.chan_doan",
]


def _get_nested(data: dict, field_path: str):
    """Lấy giá trị từ nested dict theo path dạng 'a.b.c'."""
    value = data
    for key in field_path.split("."):
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return None
    return value


def validate_record(record: dict) -> Tuple[bool, List[str]]:
    """
    Kiểm tra output của agent có đủ các trường bắt buộc không.

    Input : dict hồ sơ y tế
    Output: (is_valid, danh sách trường còn thiếu)
    """
    missing = [
        field
        for field in REQUIRED_FIELDS
        if not _get_nested(record, field)
    ]
    return len(missing) == 0, missing
