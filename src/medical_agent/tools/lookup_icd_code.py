# Bảng ICD-10 local — subset các bệnh phổ biến trong y tế Việt Nam
_ICD_TABLE = {
    # Tâm thần kinh
    "rối loạn lo âu": "F41.9",
    "rối loạn lo âu lan toả": "F41.1",
    "rối loạn lo âu lan tỏa": "F41.1",
    "rối loạn hoảng sợ": "F41.0",
    "ám ảnh xã hội": "F40.1",
    "trầm cảm": "F32.9",
    "trầm cảm nặng": "F32.2",
    "rối loạn lưỡng cực": "F31.9",
    "tâm thần phân liệt": "F20.9",
    "mất ngủ": "G47.0",
    "rối loạn giấc ngủ": "G47.9",
    # Tim mạch
    "tăng huyết áp": "I10",
    "suy tim": "I50.9",
    "nhồi máu cơ tim": "I21.9",
    "đau thắt ngực": "I20.9",
    "đau ngực": "R07.9",
    # Nội tiết
    "đái tháo đường type 2": "E11.9",
    "đái tháo đường": "E11.9",
    "cường giáp": "E05.9",
    "suy giáp": "E03.9",
    # Hô hấp
    "viêm phổi": "J18.9",
    "hen phế quản": "J45.9",
    "bệnh phổi tắc nghẽn mạn tính": "J44.9",
    "copd": "J44.9",
    "viêm phế quản": "J40",
    # Tiêu hoá
    "viêm dạ dày": "K29.7",
    "loét dạ dày": "K25.9",
    "đau dạ dày": "K25.9",
    "trào ngược dạ dày": "K21.0",
    "viêm ruột thừa": "K37",
    # Thần kinh
    "đau đầu": "R51",
    "đau nửa đầu": "G43.9",
    "migraine": "G43.9",
    "đột quỵ": "I64",
    "động kinh": "G40.9",
    # Cơ xương khớp
    "đau lưng": "M54.5",
    "thoái hoá khớp": "M19.9",
    "viêm khớp dạng thấp": "M06.9",
    "gout": "M10.9",
    # Khác
    "sốt": "R50.9",
    "mệt mỏi": "R53",
    "chóng mặt": "R42",
    "buồn nôn": "R11",
}


def lookup_icd_code(diagnosis_text: str) -> dict:
    """
    Tra mã ICD-10 từ chẩn đoán văn bản tiếng Việt.
    Tìm exact match trước, rồi partial match.

    Input : diagnosis_text — chẩn đoán dạng chuỗi
    Output: {"diagnosis": ..., "icd_code": ..., "note": ...}
    """
    key = diagnosis_text.lower().strip()

    # Exact match
    if key in _ICD_TABLE:
        return {"diagnosis": diagnosis_text, "icd_code": _ICD_TABLE[key]}

    # Partial match — tìm key nào xuất hiện trong chẩn đoán
    for table_key, code in _ICD_TABLE.items():
        if table_key in key:
            return {
                "diagnosis": diagnosis_text,
                "icd_code": code,
                "note": f"Khớp gần đúng với: '{table_key}'",
            }

    return {
        "diagnosis": diagnosis_text,
        "icd_code": None,
        "note": "Không tìm thấy trong bảng ICD-10 local. Vui lòng tra thủ công.",
    }


# Định nghĩa tool cho OpenAI function calling
TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "lookup_icd_code",
        "description": (
            "Tra cứu mã ICD-10 tương ứng với chẩn đoán bệnh bằng tiếng Việt. "
            "Luôn gọi tool này khi cần điền trường chan_doan_icd."
        ),
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "diagnosis_text": {
                    "type": "string",
                    "description": "Tên chẩn đoán bệnh bằng tiếng Việt, ví dụ: 'rối loạn lo âu lan toả'",
                }
            },
            "required": ["diagnosis_text"],
            "additionalProperties": False,
        },
    },
}
