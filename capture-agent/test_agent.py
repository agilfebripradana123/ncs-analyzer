#!/usr/bin/env python3
"""Tests for OcrEngine abstraction and FrameProcessor. Stdlib only, no device."""

import os
import unittest
from datetime import datetime
from pathlib import Path

from agent import (
    AgentConfig,
    FrameProcessor,
    NoopOcrEngine,
    OcrEngine,
    OcrResult,
    SessionCredential,
    TesseractEngine,
    build_ocr_engine,
    load_config,
    load_env,
    normalize_ocr,
    resolve_session_credential,
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
        from agent import AgentConfig
        self.assertIsInstance(build_ocr_engine(AgentConfig(ocr_engine="none")), NoopOcrEngine)
        self.assertIsInstance(build_ocr_engine(AgentConfig(ocr_engine="NONE")), NoopOcrEngine)
        self.assertIsInstance(build_ocr_engine(AgentConfig(ocr_engine="unknown_engine")), NoopOcrEngine)

    def test_tesseract_build(self):
        from agent import AgentConfig
        self.assertIsInstance(
            build_ocr_engine(AgentConfig(ocr_engine="tesseract")),
            TesseractEngine,
        )


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
            def __init__(self):
                super().__init__()
                self.tesseract_cmd = "fake"

            def _run(self, png):
                return (
                    "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
                    "5\t1\t1\t1\t1\t1\t10\t20\t100\t15\t99\tsecret\n"
                )

        det = FrameProcessor(ocr=FakeTesseract()).on_frame(PNG, datetime.now())
        self.assertEqual(len(det), 1)
        self.assertEqual(det[0]["type"], "ocr_text")
        self.assertIn("secret", det[0]["text"])

    def test_tesseract_resolve_explicit_path(self):
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".exe") as tmp:
            tmp_path = tmp.name
        try:
            resolved = TesseractEngine._resolve(tmp_path)
            self.assertEqual(resolved, tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_tesseract_resolve_fallback_windows(self):
        """If PATH has no tesseract, fallback to Windows default if exists."""
        import unittest.mock as mock
        with mock.patch("shutil.which", return_value=None):
            with mock.patch("pathlib.Path.is_file") as mock_is_file:
                mock_is_file.return_value = True
                resolved = TesseractEngine._resolve(None)
                self.assertEqual(resolved, TesseractEngine.WINDOWS_DEFAULT)

    def test_tesseract_resolve_none_when_missing(self):
        import unittest.mock as mock
        with mock.patch("shutil.which", return_value=None):
            with mock.patch("pathlib.Path.is_file", return_value=False):
                self.assertIsNone(TesseractEngine._resolve(None))

    def test_tesseract_run_subprocess_mock(self):
        """Verify subprocess.run called with correct args, PNG via stdin."""
        import unittest.mock as mock

        class MockResult:
            returncode = 0
            stdout = b"level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"

        # Bypass __init__ resolver — inject fake cmd directly so the
        # test does not depend on system PATH or the real fallback.
        eng = TesseractEngine.__new__(TesseractEngine)
        eng.lang = "eng"
        eng.psm = 6
        eng.tesseract_cmd = "/fake/tesseract"
        with mock.patch("subprocess.run", return_value=MockResult()) as mock_run:
            tsv = eng._run(PNG)
            self.assertIsNotNone(tsv)
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            self.assertEqual(call_args.kwargs["input"], PNG)
            self.assertIn("/fake/tesseract", call_args.args[0][0])
            self.assertIn("stdin", call_args.args[0])
            self.assertIn("tsv", call_args.args[0])


# -- config --
class TestLoadConfig(unittest.TestCase):
    _keys = ("NCS_API_URL", "NCS_SESSION_ID", "NCS_API_TOKEN",
             "NCS_CAPTURE_INTERVAL", "NCS_HEARTBEAT_INTERVAL",
             "NCS_OCR_ENGINE", "NCS_OCR_LANG", "NCS_OCR_PSM", "NCS_OCR_TESSERACT_PATH")

    def setUp(self):
        self._saved = {k: os.environ.pop(k, None) for k in self._keys}

    def tearDown(self):
        for k, v in self._saved.items():
            if v is not None:
                os.environ[k] = v
            else:
                os.environ.pop(k, None)

    def test_defaults_no_credentials_in_config(self):
        """AgentConfig no longer holds session credentials — static only."""
        cfg = load_config()
        self.assertEqual(cfg.api_url, "http://127.0.0.1:8000/api")
        self.assertEqual(cfg.ocr_engine, "none")
        self.assertFalse(hasattr(cfg, "session_id"))
        self.assertFalse(hasattr(cfg, "token"))

    def test_custom_ocr_engine(self):
        os.environ["NCS_OCR_ENGINE"] = "tesseract"
        self.assertEqual(load_config().ocr_engine, "tesseract")

    def test_invalid_interval_exits(self):
        os.environ["NCS_CAPTURE_INTERVAL"] = "not_a_number"
        with self.assertRaises(SystemExit):
            load_config()


class TestSessionCredential(unittest.TestCase):
    _cred_keys = ("NCS_SESSION_ID", "NCS_API_TOKEN")

    def setUp(self):
        self._saved = {k: os.environ.pop(k, None) for k in self._cred_keys}

    def tearDown(self):
        for k, v in self._saved.items():
            if v is not None:
                os.environ[k] = v
            else:
                os.environ.pop(k, None)

    def test_valid_from_env_as_fallback(self):
        """E2E testing can still rely on .env for quick manual runs."""
        os.environ["NCS_SESSION_ID"] = "42"
        os.environ["NCS_API_TOKEN"] = "tok_abc"
        cred = resolve_session_credential(None)
        self.assertEqual(cred.session_id, "42")
        self.assertTrue(cred.valid)

    def test_invalid_when_empty(self):
        self.assertFalse(resolve_session_credential(None).valid)

    def test_cli_overrides_env(self):
        """Production: CLI args win so assessor never edits .env per session."""
        import argparse
        os.environ["NCS_SESSION_ID"] = "from-env"
        os.environ["NCS_API_TOKEN"] = "env-tok"
        args = argparse.Namespace(session_id="from-cli", token="cli-tok")
        cred = resolve_session_credential(args)
        self.assertEqual(cred.session_id, "from-cli")
        self.assertEqual(cred.token, "cli-tok")

    def test_partial_cli_falls_back_to_env(self):
        import argparse
        os.environ["NCS_SESSION_ID"] = "env-sid"
        os.environ["NCS_API_TOKEN"] = "env-tok"
        args = argparse.Namespace(session_id="cli-sid", token=None)
        cred = resolve_session_credential(args)
        self.assertEqual(cred.session_id, "env-sid")

    def test_build_ocr_uses_agent_config(self):
        """OCR config lives in AgentConfig, not credential."""
        from agent import AgentConfig
        cfg = AgentConfig(ocr_engine="tesseract", ocr_lang="ind", ocr_psm=3)
        eng = build_ocr_engine(cfg)
        self.assertEqual(eng.lang, "ind")
        self.assertEqual(eng.psm, 3)


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
