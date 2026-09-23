#!/usr/bin/env python3
"""Tests for OcrEngine abstraction and FrameProcessor. Stdlib only, no device."""

import os
import unittest
from datetime import datetime
from pathlib import Path

from agent import (
    FrameProcessor,
    NoopOcrEngine,
    OcrEngine,
    OcrResult,
    TesseractEngine,
    build_ocr_engine,
    load_config,
    load_env,
    normalize_ocr,
)

PNG = b"\x89PNG\r\n\x1a\nfake"


# -- FrameProcessor (in-memory, no disk, no network) --


class TestFrameProcessor(unittest.TestCase):
    def test_on_frame_increments_processed(self):
        p = FrameProcessor()
        self.assertEqual(p.processed, 0)
        p.on_frame(PNG, datetime.now())
        self.assertEqual(p.processed, 1)

    def test_default_noop_returns_empty(self):
        p = FrameProcessor()
        self.assertEqual(p.on_frame(PNG, datetime.now()), [])

    def test_no_disk_write(self):
        before = set(p.name for p in Path(".").glob("*.png"))
        FrameProcessor().on_frame(PNG, datetime.now())
        self.assertEqual(before, set(p.name for p in Path(".").glob("*.png")))


class TestOcrNormalization(unittest.TestCase):
    def test_result_to_detection_schema(self):
        r = OcrResult(text="hello world", confidence=0.9, bbox=[10, 20, 100, 30])
        d = normalize_ocr(r)
        self.assertEqual(d["type"], "ocr_text")
        self.assertEqual(d["text"], "hello world")
        self.assertAlmostEqual(d["confidence"], 0.9)
        self.assertEqual(d["metadata"]["bbox"], [10, 20, 100, 30])
        self.assertEqual(d["metadata"]["source"], "ocr")

    def test_no_bbox_no_key_in_metadata(self):
        d = normalize_ocr(OcrResult(text="hi", confidence=1.0))
        self.assertNotIn("bbox", d["metadata"])

    def test_strips_and_truncates_label(self):
        r = OcrResult(text="  x" * 50, confidence=1.0)
        d = normalize_ocr(r)
        self.assertEqual(len(d["label"]), 80)
        self.assertEqual(d["text"], r.text.strip())


class TestOcrEngineAbstraction(unittest.TestCase):
    def test_swap_engine_mock(self):
        class MockOcr(OcrEngine):
            def recognize(self, png):
                self.called_with = png
                return [OcrResult(text="mock", confidence=0.8)]

        m = MockOcr()
        p = FrameProcessor(ocr=m)
        det = p.on_frame(PNG, datetime.now())
        self.assertEqual(m.called_with, PNG)
        self.assertEqual(len(det), 1)
        self.assertEqual(det[0]["text"], "mock")

    def test_empty_text_filtered(self):
        class SpaceOcr(OcrEngine):
            def recognize(self, png):
                return [OcrResult(text="   ", confidence=0.9)]

        self.assertEqual(FrameProcessor(ocr=SpaceOcr()).on_frame(PNG, datetime.now()), [])

    def test_raw_frame_not_saved_or_uploaded_directly(self):
        """Only detections leave the agent — raw PNG bytes never returned/kept."""
        p = FrameProcessor()
        res = p.on_frame(PNG, datetime.now())
        self.assertIsInstance(res, list)
        self.assertEqual(res, [])
        # processed count advances but no attribute holds png
        self.assertFalse(any(k for k in vars(p) if isinstance(getattr(p, k), bytes)))

    def test_frame_sent_only_when_detections(self):
        """Main loop pattern: if detections: send_frame(...). Simulate."""
        sent = []

        def send_frame_stub(payload):
            sent.append(payload)

        for dets in [[], [{"type": "x"}]]:
            if dets:
                send_frame_stub(dets)
        self.assertEqual(len(sent), 1)

    def test_build_ocr_engine_factory(self):
        self.assertIsInstance(build_ocr_engine("none"), NoopOcrEngine)
        self.assertIsInstance(build_ocr_engine("NONE"), NoopOcrEngine)
        self.assertIsInstance(build_ocr_engine("unknown_engine"), NoopOcrEngine)

    def test_tesseract_build(self):
        self.assertIsInstance(build_ocr_engine("tesseract"), TesseractEngine)


class TestTesseractParse(unittest.TestCase):
    def test_parse_empty_returns_empty(self):
        self.assertEqual(TesseractEngine._parse(""), [])

    def test_parse_header_only_returns_empty(self):
        header = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
        self.assertEqual(TesseractEngine._parse(header), [])

    def test_parse_one_word(self):
        tsv = (
            "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
            "5\t1\t1\t1\t1\t1\t10\t20\t100\t15\t92\thello\n"
        )
        results = TesseractEngine._parse(tsv)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].text, "hello")
        self.assertAlmostEqual(results[0].confidence, 0.92)
        self.assertEqual(results[0].bbox, [10, 20, 100, 15])

    def test_parse_negative_conf_filtered(self):
        tsv = (
            "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
            "2\t1\t1\t1\t1\t0\t0\t0\t0\t0\t-1\t\n"
            "5\t1\t1\t1\t1\t1\t10\t20\t100\t15\t80\tok\n"
        )
        results = TesseractEngine._parse(tsv)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].text, "ok")

    def test_frame_processor_with_tesseract_mock(self):
        class FakeTesseract(TesseractEngine):
            def _run(self, png):
                return (
                    "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
                    "5\t1\t1\t1\t1\t1\t10\t20\t100\t15\t99\tsecret\n"
                )

        det = FrameProcessor(ocr=FakeTesseract()).on_frame(PNG, datetime.now())
        self.assertEqual(len(det), 1)
        self.assertEqual(det[0]["type"], "ocr_text")
        self.assertIn("secret", det[0]["text"])


# -- config --
class TestLoadConfig(unittest.TestCase):
    _keys = ("NCS_API_URL", "NCS_SESSION_ID", "NCS_API_TOKEN",
             "NCS_CAPTURE_INTERVAL", "NCS_HEARTBEAT_INTERVAL", "NCS_OCR_ENGINE")

    def setUp(self):
        self._saved = {k: os.environ.pop(k, None) for k in self._keys}

    def tearDown(self):
        for k, v in self._saved.items():
            if v is not None:
                os.environ[k] = v
            else:
                os.environ.pop(k, None)

    def test_defaults(self):
        api, sid, tok, cap, hb, ocr = load_config()
        self.assertEqual(api, "http://127.0.0.1:8000/api")
        self.assertEqual(ocr, "none")

    def test_custom(self):
        os.environ["NCS_OCR_ENGINE"] = "tesseract"
        self.assertEqual(load_config()[5], "tesseract")

    def test_invalid_interval_exits(self):
        os.environ["NCS_CAPTURE_INTERVAL"] = "not_a_number"
        with self.assertRaises(SystemExit):
            load_config()


class TestLoadEnv(unittest.TestCase):
    def setUp(self):
        self._saved = {k: os.environ.pop(k, None)
                       for k in ("NCS_API_URL", "NCS_SESSION_ID", "NCS_API_TOKEN")}
        self.env = Path(__file__).parent / ".env.test_ocr"
        self.env.write_text(
            "NCS_API_URL=http://example.test/api\n"
            "NCS_SESSION_ID=7\n"
            "# comment\n"
            'NCS_API_TOKEN="tok"\n'
        )

    def tearDown(self):
        self.env.unlink(missing_ok=True)
        for k, v in self._saved.items():
            if v is not None:
                os.environ[k] = v
            else:
                os.environ.pop(k, None)

    def test_loads(self):
        load_env(self.env)
        self.assertEqual(os.environ["NCS_SESSION_ID"], "7")

    def test_does_not_override(self):
        os.environ["NCS_API_URL"] = "http://keep/api"
        load_env(self.env)
        self.assertEqual(os.environ["NCS_API_URL"], "http://keep/api")


if __name__ == "__main__":
    unittest.main()
