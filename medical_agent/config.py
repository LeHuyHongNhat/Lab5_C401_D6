import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")

# URL của REST API bệnh viện (dùng mock nếu không có)
PATIENT_API_BASE_URL = os.getenv("PATIENT_API_BASE_URL", "http://localhost:8000")