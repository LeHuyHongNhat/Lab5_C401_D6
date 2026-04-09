import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")

# URL của REST API bệnh viện (dùng mock nếu không có)
PATIENT_API_BASE_URL = os.getenv("PATIENT_API_BASE_URL", "http://localhost:8000")

# Diarization
# HuggingFace token để tải pyannote/speaker-diarization-3.1
# Lấy tại: https://hf.co/settings/tokens
# Yêu cầu accept điều khoản tại: https://hf.co/pyannote/speaker-diarization-3.1
HF_TOKEN = os.getenv("HF_TOKEN", "")
