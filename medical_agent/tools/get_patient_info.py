import requests
from config import PATIENT_API_BASE_URL


# Dữ liệu mock để test khi chưa có API thật
# Key là mã bệnh nhân nội bộ (không phải CCCD — tránh đưa định danh nhạy cảm vào LLM)
_MOCK_PATIENTS = {
    "BN-2026-00001": {
        "ho_ten": "Nguyễn Văn A",
        "gioi_tinh": "Nam",
        "ngay_sinh": "1990-05-12",
        "dia_chi": "123 Nguyễn Trãi, Q.1, TP.HCM",
        "benh_su": "Tiền sử tăng huyết áp độ 1 (2024). Không dị ứng thuốc.",
    },
    "BN-2026-00002": {
        "ho_ten": "Trần Thị B",
        "gioi_tinh": "Nữ",
        "ngay_sinh": "1985-11-20",
        "dia_chi": "45 Lê Lợi, Q.3, TP.HCM",
        "benh_su": "Không có tiền sử bệnh đặc biệt. Dị ứng Penicillin.",
    },
}


def get_patient_info(patient_id: str) -> dict:
    """
    Lấy thông tin bệnh nhân từ DB qua mã bệnh nhân nội bộ.
    Thử gọi REST API thật trước; nếu không có thì dùng mock data.

    Input : patient_id — mã bệnh nhân nội bộ, ví dụ "BN-2026-00001"
    Output: dict thông tin bệnh nhân hoặc {"error": "..."}
    """
    # Thử gọi API thật
    try:
        resp = requests.get(
            f"{PATIENT_API_BASE_URL}/api/patients/{patient_id}",
            timeout=5,
        )
        if resp.status_code == 200:
            return resp.json()
    except requests.exceptions.RequestException:
        pass  # Fallback xuống mock

    # Fallback: mock data
    if patient_id in _MOCK_PATIENTS:
        return _MOCK_PATIENTS[patient_id]

    return {"error": f"Không tìm thấy bệnh nhân với mã: {patient_id}"}


# Định nghĩa tool cho OpenAI function calling
# strict phải nằm trong function (không phải top-level)
TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "get_patient_info",
        "description": (
            "Lấy thông tin bệnh nhân (họ tên, ngày sinh, địa chỉ, bệnh sử, dị ứng) "
            "từ cơ sở dữ liệu bệnh viện dựa trên mã bệnh nhân nội bộ."
        ),
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "patient_id": {
                    "type": "string",
                    "description": "Mã bệnh nhân nội bộ của bệnh viện, ví dụ 'BN-2026-00001'.",
                }
            },
            "required": ["patient_id"],
            "additionalProperties": False,
        },
    },
}
