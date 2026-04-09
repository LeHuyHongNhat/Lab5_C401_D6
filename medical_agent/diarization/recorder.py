"""
Thu âm trực tiếp từ microphone (MacBook M4 Pro / bất kỳ thiết bị nào).

Cách dùng:
  # Thu âm rồi diarize luôn bằng LLM (không cần GPU)
  python diarization/recorder.py --session-id VNM-001 --patient-id BN-2026-00001

  # Thu âm rồi diarize bằng Whisper+pyannote
  python diarization/recorder.py --session-id VNM-001 --patient-id BN-2026-00001 --method whisper

  # Chỉ thu âm, lưu file wav, không diarize
  python diarization/recorder.py --output-audio audio/session.wav --no-diarize

Yêu cầu:
  pip install sounddevice soundfile numpy
"""

import argparse
import sys
import os
import threading
import time
from datetime import datetime
from pathlib import Path

MEDICAL_AGENT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(MEDICAL_AGENT_DIR))


def _check_deps():
    missing = []
    for pkg in ("sounddevice", "soundfile", "numpy"):
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        raise ImportError(
            f"Thiếu thư viện: {', '.join(missing)}\n"
            f"Cài đặt: pip install {' '.join(missing)}"
        )


class AudioRecorder:
    """
    Thu âm từ microphone, lưu ra file .wav.
    Dừng khi người dùng nhấn Enter hoặc Ctrl+C.
    """

    SAMPLE_RATE = 16000   # 16kHz — chuẩn cho Whisper và pyannote
    CHANNELS = 1          # Mono
    DTYPE = "int16"

    def __init__(self):
        _check_deps()
        import sounddevice as sd
        import numpy as np
        self._sd = sd
        self._np = np
        self._frames: list = []
        self._recording = False
        self._start_time: float = 0.0

    def _callback(self, indata, frames, time_info, status):
        if status:
            print(f"  [Cảnh báo] {status}", file=sys.stderr)
        if self._recording:
            self._frames.append(indata.copy())

    def _show_timer(self):
        """Hiện timer đang chạy trong terminal."""
        while self._recording:
            elapsed = time.time() - self._start_time
            mins, secs = divmod(int(elapsed), 60)
            print(f"\r  ● Đang thu âm... {mins:02d}:{secs:02d}  (nhấn Enter để dừng)",
                  end="", flush=True)
            time.sleep(0.5)
        print()  # Xuống dòng sau khi dừng

    def record(self) -> "numpy.ndarray":
        """
        Bắt đầu thu âm cho đến khi nhấn Enter.
        Returns: numpy array chứa audio data.
        """
        print("\n[Recorder] Chuẩn bị thu âm...")
        print(f"  Sample rate : {self.SAMPLE_RATE} Hz")
        print(f"  Channels    : {self.CHANNELS} (mono)")
        print(f"  Nhấn Enter để bắt đầu...")
        input()

        self._frames = []
        self._recording = True
        self._start_time = time.time()

        # Chạy timer trên thread riêng
        timer_thread = threading.Thread(target=self._show_timer, daemon=True)
        timer_thread.start()

        with self._sd.InputStream(
            samplerate=self.SAMPLE_RATE,
            channels=self.CHANNELS,
            dtype=self.DTYPE,
            callback=self._callback,
        ):
            try:
                input()  # Chặn tại đây cho đến khi nhấn Enter
            except KeyboardInterrupt:
                pass

        self._recording = False
        timer_thread.join(timeout=1)

        elapsed = time.time() - self._start_time
        print(f"  Đã dừng. Tổng thời gian: {elapsed:.1f}s — {len(self._frames)} blocks")

        if not self._frames:
            raise RuntimeError("Không thu được audio. Kiểm tra microphone.")

        return self._np.concatenate(self._frames, axis=0)

    def save(self, audio_data: "numpy.ndarray", output_path: str) -> None:
        """Lưu audio data ra file .wav."""
        import soundfile as sf
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        sf.write(output_path, audio_data, self.SAMPLE_RATE)
        size_kb = Path(output_path).stat().st_size / 1024
        print(f"[Recorder] Đã lưu audio: {output_path} ({size_kb:.1f} KB)")

    @staticmethod
    def list_devices():
        """In danh sách thiết bị audio khả dụng."""
        import sounddevice as sd
        print(sd.query_devices())


def record_and_diarize(
    session_id: str,
    patient_id: str,
    method: str = "llm",
    audio_dir: str | None = None,
    output_transcript: str | None = None,
    hf_token: str | None = None,
    whisper_model: str = "medium",
) -> dict:
    """
    Thu âm rồi diarize ngay, trả về raw_transcript dict.

    Args:
        session_id         : ID phiên khám
        patient_id         : Mã bệnh nhân nội bộ
        method             : "llm" hoặc "whisper"
        audio_dir          : Thư mục lưu file audio tạm
        output_transcript  : Đường dẫn lưu raw_transcript.json
        hf_token           : HuggingFace token (cho method whisper)
        whisper_model      : Kích thước whisper model
    """
    recorded_at = datetime.now().isoformat()
    _audio_dir = audio_dir or str(MEDICAL_AGENT_DIR / "audio")
    _output_transcript = output_transcript or str(MEDICAL_AGENT_DIR / "input" / "raw_transcript.json")
    audio_path = str(Path(_audio_dir) / f"{session_id}.wav")

    # Bước 1: Thu âm
    recorder = AudioRecorder()
    audio_data = recorder.record()
    recorder.save(audio_data, audio_path)

    # Bước 2: Diarize
    from diarization.diarize import run as diarize_run
    transcript = diarize_run(
        input_path=audio_path,
        session_id=session_id,
        patient_id=patient_id,
        recorded_at=recorded_at,
        output_path=_output_transcript,
        method=method,
        hf_token=hf_token,
        whisper_model=whisper_model,
    )
    return transcript


def main():
    parser = argparse.ArgumentParser(
        description="Thu âm trực tiếp từ microphone rồi diarize"
    )
    parser.add_argument("--session-id", default=f"VNM-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                        help="ID phiên khám (tự tạo nếu không truyền)")
    parser.add_argument("--patient-id", default=None,
                        help="Mã bệnh nhân nội bộ, ví dụ BN-2026-00001 (bắt buộc khi thu âm)")
    parser.add_argument("--method", choices=["auto", "whisper", "llm"], default="llm",
                        help="Phương pháp diarize sau khi thu âm (mặc định: llm)")
    parser.add_argument("--output-audio", default=None,
                        help="Đường dẫn lưu file .wav (mặc định: <medical_agent>/audio/<session_id>.wav)")
    parser.add_argument("--output-transcript",
                        default=str(MEDICAL_AGENT_DIR / "input" / "raw_transcript.json"),
                        help="Đường dẫn lưu raw_transcript.json")
    parser.add_argument("--no-diarize", action="store_true",
                        help="Chỉ thu âm, không diarize")
    parser.add_argument("--list-devices", action="store_true",
                        help="In danh sách thiết bị audio rồi thoát")
    parser.add_argument("--hf-token", default=None)
    parser.add_argument("--whisper-model", default="medium",
                        choices=["tiny", "base", "small", "medium", "large"])

    args = parser.parse_args()

    if args.list_devices:
        AudioRecorder.list_devices()
        return

    if not args.patient_id:
        parser.error("--patient-id là bắt buộc khi thu âm")

    recorder = AudioRecorder()
    audio_data = recorder.record()

    audio_path = args.output_audio or str(MEDICAL_AGENT_DIR / "audio" / f"{args.session_id}.wav")
    recorder.save(audio_data, audio_path)

    if args.no_diarize:
        print(f"\n[Done] File audio đã lưu tại: {audio_path}")
        return

    # Diarize ngay sau khi thu âm
    from diarization.diarize import run as diarize_run
    diarize_run(
        input_path=audio_path,
        session_id=args.session_id,
        patient_id=args.patient_id,
        recorded_at=datetime.now().isoformat(),
        output_path=args.output_transcript,
        method=args.method,
        hf_token=args.hf_token or os.getenv("HF_TOKEN"),
        whisper_model=args.whisper_model,
    )
    print(f"\n[Done] Transcript đã lưu tại: {args.output_transcript}")
    print("Tiếp theo: python main.py")


if __name__ == "__main__":
    main()
