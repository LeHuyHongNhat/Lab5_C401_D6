"""
test_pipeline.py
================
Unit tests cho audio_simulation.py pipeline.
Chạy: python -m pytest spec/test_pipeline.py -v
      hoặc: python spec/test_pipeline.py
"""

import sys
import json
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Thêm spec/ vào path để import audio_simulation
sys.path.insert(0, str(Path(__file__).parent))
import audio_simulation as sim


# ─────────────────────────────────────────────────────────────
# TEST 1: Load scenario từ mock_transcripts.json
# ─────────────────────────────────────────────────────────────

class TestLoadScenario(unittest.TestCase):

    def test_load_all_4_scenarios(self):
        """Phải load được đủ 4 scenario."""
        for i in range(1, 5):
            scenario = sim.load_scenario(i)
            self.assertIn("scenario_id", scenario)
            self.assertIn("turns", scenario)
            self.assertIn("expected_output", scenario)

    def test_scenario_has_required_fields(self):
        """Mỗi scenario phải có đủ các trường bắt buộc."""
        scenario = sim.load_scenario(1)
        required = ["scenario_id", "scenario_name", "scenario_type",
                    "description", "turns", "expected_output"]
        for field in required:
            self.assertIn(field, scenario, f"Thiếu trường: {field}")

    def test_turns_have_speaker_and_text(self):
        """Mỗi turn phải có 'speaker' và 'text'."""
        scenario = sim.load_scenario(1)
        for turn in scenario["turns"]:
            self.assertIn("speaker", turn)
            self.assertIn("text", turn)
            self.assertIn(turn["speaker"], ["doctor", "patient", "family"])

    def test_invalid_scenario_index_exits(self):
        """Index ngoài phạm vi phải gọi sys.exit."""
        with self.assertRaises(SystemExit):
            sim.load_scenario(99)

    def test_scenario_3_has_family_speaker(self):
        """Scenario 3 phải có ít nhất 1 turn từ 'family'."""
        scenario = sim.load_scenario(3)
        speakers = {t["speaker"] for t in scenario["turns"]}
        self.assertIn("family", speakers, "Scenario 3 phải có speaker 'family'")

    def test_scenario_4_has_medication_mapping(self):
        """Scenario 4 phải có medication_mapping."""
        scenario = sim.load_scenario(4)
        self.assertIn("medication_mapping", scenario)
        self.assertGreater(len(scenario["medication_mapping"]), 0)


# ─────────────────────────────────────────────────────────────
# TEST 2: simulate_ai_processing trả đúng cấu trúc SOAP
# ─────────────────────────────────────────────────────────────

class TestSimulateAIProcessing(unittest.TestCase):

    def setUp(self):
        self.scenario1 = sim.load_scenario(1)
        self.scenario3 = sim.load_scenario(3)

    def test_output_has_patient_and_visit(self):
        """Output phải có 'patient' và 'visit'."""
        output = sim.simulate_ai_processing(self.scenario1)
        self.assertIn("patient", output)
        self.assertIn("visit", output)

    def test_visit_has_soap_fields(self):
        """Visit phải có đủ 4 trường SOAP."""
        output = sim.simulate_ai_processing(self.scenario1)
        visit = output["visit"]
        for field in ["S_subjective", "O_objective", "A_assessment", "P_plan"]:
            self.assertIn(field, visit, f"Thiếu trường SOAP: {field}")

    def test_scenario1_icd_code(self):
        """Scenario 1 (lo âu lan toả) phải ra ICD F41.1."""
        output = sim.simulate_ai_processing(self.scenario1)
        self.assertEqual(output["visit"]["chan_doan_icd"], "F41.1")

    def test_scenario3_has_flags(self):
        """Scenario 3 (người nhà chen vào) phải có diarization flags."""
        output = sim.simulate_ai_processing(self.scenario3)
        flags = output["visit"].get("flags", [])
        self.assertTrue(len(flags) > 0, "Scenario 3 phải có flags cảnh báo")
        has_diarization = any("DIARIZATION" in f for f in flags)
        self.assertTrue(has_diarization, "Phải có DIARIZATION_WARNING flag")


# ─────────────────────────────────────────────────────────────
# TEST 3: merge_stt_and_diarization
# ─────────────────────────────────────────────────────────────

class TestMergeSTTAndDiarization(unittest.TestCase):

    def _make_mock_diarization(self, segments):
        """
        Tạo mock diarization object từ list segments.
        segments = [(start, end, speaker_label), ...]
        """
        mock_diar = MagicMock()
        track_list = []
        for start, end, label in segments:
            seg = MagicMock()
            seg.start = start
            seg.end = end
            track_list.append((seg, None, label))
        mock_diar.itertracks.return_value = track_list
        return mock_diar

    def test_basic_merge(self):
        """Merge cơ bản: 2 chunks, 2 speakers."""
        chunks = [
            {"text": "Chào bác sĩ", "timestamp": (0.0, 2.0)},
            {"text": "Anh bị sao?",  "timestamp": (2.5, 4.5)},
        ]
        diarization = self._make_mock_diarization([
            (0.0, 2.0, "SPEAKER_00"),
            (2.5, 4.5, "SPEAKER_01"),
        ])
        turns = sim.merge_stt_and_diarization(chunks, diarization)
        self.assertEqual(len(turns), 2)
        self.assertEqual(turns[0]["speaker"], "SPEAKER_00")
        self.assertEqual(turns[1]["speaker"], "SPEAKER_01")
        self.assertEqual(turns[0]["text"], "Chào bác sĩ")

    def test_skip_chunks_with_none_timestamp(self):
        """Chunk có timestamp None phải bị bỏ qua."""
        chunks = [
            {"text": "Câu có timestamp", "timestamp": (0.0, 2.0)},
            {"text": "Câu không có",     "timestamp": (None, None)},
        ]
        diarization = self._make_mock_diarization([(0.0, 2.0, "SPEAKER_00")])
        turns = sim.merge_stt_and_diarization(chunks, diarization)
        self.assertEqual(len(turns), 1)

    def test_dominant_speaker_by_overlap(self):
        """Speaker chiếm nhiều thời gian hơn phải được chọn."""
        chunks = [{"text": "Test overlap", "timestamp": (0.0, 4.0)}]
        # SPEAKER_00 chiếm 3s, SPEAKER_01 chiếm 1s → SPEAKER_00 thắng
        diarization = self._make_mock_diarization([
            (0.0, 3.0, "SPEAKER_00"),
            (3.0, 4.0, "SPEAKER_01"),
        ])
        turns = sim.merge_stt_and_diarization(chunks, diarization)
        self.assertEqual(turns[0]["speaker"], "SPEAKER_00")

    def test_unknown_speaker_when_no_overlap(self):
        """Khi không có diarization segment overlap, speaker = 'unknown'."""
        chunks = [{"text": "Không ai nói", "timestamp": (10.0, 12.0)}]
        diarization = self._make_mock_diarization([
            (0.0, 5.0, "SPEAKER_00"),  # không overlap với chunk
        ])
        turns = sim.merge_stt_and_diarization(chunks, diarization)
        self.assertEqual(turns[0]["speaker"], "unknown")

    def test_output_has_required_fields(self):
        """Mỗi turn output phải có speaker, text, start, end."""
        chunks = [{"text": "Hello", "timestamp": (0.0, 1.0)}]
        diarization = self._make_mock_diarization([(0.0, 1.0, "SPEAKER_00")])
        turns = sim.merge_stt_and_diarization(chunks, diarization)
        self.assertIn("speaker", turns[0])
        self.assertIn("text",    turns[0])
        self.assertIn("start",   turns[0])
        self.assertIn("end",     turns[0])


# ─────────────────────────────────────────────────────────────
# TEST 4: map_speaker_labels (mock user input)
# ─────────────────────────────────────────────────────────────

class TestMapSpeakerLabels(unittest.TestCase):

    def test_map_to_valid_roles(self):
        """Mapping hợp lệ phải được áp dụng đúng."""
        turns = [
            {"speaker": "SPEAKER_00", "text": "Xin chào"},
            {"speaker": "SPEAKER_01", "text": "Dạ chào"},
        ]
        # Giả lập user nhập: SPEAKER_00 → doctor, SPEAKER_01 → patient
        with patch("builtins.input", side_effect=["doctor", "patient"]):
            result = sim.map_speaker_labels(turns)

        self.assertEqual(result[0]["speaker"], "doctor")
        self.assertEqual(result[1]["speaker"], "patient")

    def test_invalid_input_defaults_to_other(self):
        """Input không hợp lệ phải fallback về 'other'."""
        turns = [{"speaker": "SPEAKER_00", "text": "Test"}]
        with patch("builtins.input", return_value="invalid_role"):
            result = sim.map_speaker_labels(turns)
        self.assertEqual(result[0]["speaker"], "other")

    def test_multiple_turns_same_speaker(self):
        """Nhiều turns cùng 1 speaker đều được map đúng."""
        turns = [
            {"speaker": "SPEAKER_00", "text": "Câu 1"},
            {"speaker": "SPEAKER_00", "text": "Câu 2"},
            {"speaker": "SPEAKER_01", "text": "Câu 3"},
        ]
        with patch("builtins.input", side_effect=["doctor", "patient"]):
            result = sim.map_speaker_labels(turns)
        self.assertEqual(result[0]["speaker"], "doctor")
        self.assertEqual(result[1]["speaker"], "doctor")
        self.assertEqual(result[2]["speaker"], "patient")


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("   Audio Simulation Pipeline — Unit Tests")
    print("=" * 60)
    unittest.main(verbosity=2)
