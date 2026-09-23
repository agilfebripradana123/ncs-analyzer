#!/usr/bin/env python3
"""NCS Analyzer - Capture Agent PoC (read-only, capture-only).

Android → ADB → Capture Agent → Frame in Memory → FrameProcessor.

Config via environment (atau file `.env` di folder capture-agent, lihat `.env.example`):
  NCS_API_URL          - Laravel API base (default http://127.0.0.1:8000/api)
  NCS_SESSION_ID       - Assessment session ID (dari endpoint issueToken)
  NCS_API_TOKEN        - Agent token (plaintext dari endpoint issueToken)
  NCS_CAPTURE_INTERVAL - Sampling interval seconds (default 1.0)
  NCS_HEARTBEAT_INTERVAL - Heartbeat seconds (default 30.0)
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib import request as urlreq, error as urlerr

ADB_TIMEOUT = 10
CAPTURE_DIR = Path(__file__).parent / "captures"  # ponytail: unused when FrameProcessor in-memory, keep for DEBUG save


@dataclass
class OcrResult:
    """One OCR text block. bbox = [x, y, w, h] or None if engine has no layout."""

    text: str
    confidence: float = 1.0
    bbox: list | None = None


class OcrEngine:
    """Abstraction — swap impl without touching processor. Raise or return [] on failure."""

    def recognize(self, png: bytes) -> list[OcrResult]:
        raise NotImplementedError  # ponytail: replace with Tesseract/PaddleOCR impl later


class NoopOcrEngine(OcrEngine):
    """Default engine: no OCR, returns [] so no frame is sent."""

    def recognize(self, png: bytes) -> list[OcrResult]:
        return []


class TesseractEngine(OcrEngine):
    """Tesseract OCR via `tesseract` binary. Returns [] on any error.

    Binary resolution: explicit path > PATH > Windows default install path.
    Parses TSV output (`tesseract stdin stdout -l LANG --psm N tsv`) to
    extract word lines with bounding boxes and confidence.
    PNG passed via stdin — no frame saved to disk.
    """

    WINDOWS_DEFAULT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    def __init__(self, lang: str = "eng", psm: int = 6, tesseract_path: str | None = None) -> None:
        self.lang = lang
        self.psm = psm
        self.tesseract_cmd = self._resolve(tesseract_path)

    @classmethod
    def _resolve(cls, explicit: str | None) -> str | None:
        if explicit and Path(explicit).is_file():
            return explicit
        found = shutil.which("tesseract")
        if found:
            return found
        if Path(cls.WINDOWS_DEFAULT).is_file():
            return cls.WINDOWS_DEFAULT
        return None

    def recognize(self, png: bytes) -> list[OcrResult]:
        if not self.tesseract_cmd:
            return []
        tsv = self._run(png)
        if not tsv:
            return []
        return self._parse(tsv)

    def _run(self, png: bytes) -> str | None:
        try:
            result = subprocess.run(
                [self.tesseract_cmd, "stdin", "stdout",
                 "-l", self.lang, "--psm", str(self.psm), "tsv"],
                input=png, capture_output=True, timeout=30,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return None
        if result.returncode != 0:
            return None
        try:
            return result.stdout.decode("utf-8")
        except UnicodeDecodeError:
            return None

    @staticmethod
    def _parse(tsv: str) -> list[OcrResult]:
        out: list[OcrResult] = []
        lines = tsv.splitlines()
        if len(lines) < 2:
            return out
        for row in lines[1:]:  # skip header
            cols = row.split("\t")
            if len(cols) < 12 or not cols[-1].strip():
                continue
            try:
                conf = float(cols[10])
                x, y = int(cols[6]), int(cols[7])
                w, h = int(cols[8]), int(cols[9])
            except ValueError:
                continue
            if conf < 0:  # -1 = empty line in TSV
                continue
            out.append(OcrResult(
                text=cols[-1].strip(),
                confidence=conf / 100.0,
                bbox=[x, y, w, h],
            ))
        return out


def load_env(env_path: Path | None = None) -> None:
    """Simple .env loader (stdlib). Sets env vars that are not already set."""
    if env_path is None:
        env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def banner() -> None:
    print("=" * 33)
    print(" NCS Analyzer - Capture Agent")
    print("=" * 33)
    print()


def find_adb() -> Path:
    print("Checking ADB...")
    adb = shutil.which("adb")
    if not adb:
        print("✗ ADB tidak ditemukan. Pastikan ADB ada di PATH.")
        sys.exit(1)
    print(f"✓ ADB detected: {adb}")
    return Path(adb)


def detect_device(adb: Path) -> str:
    print("Checking Android device...")
    result = subprocess.run(
        [str(adb), "devices"],
        capture_output=True, text=True, timeout=ADB_TIMEOUT,
    )
    devices = []
    for line in result.stdout.strip().splitlines()[1:]:
        parts = line.split("\t")
        if len(parts) == 2 and parts[1].strip() == "device":
            devices.append(parts[0].strip())
    if not devices:
        print("✗ Tidak ada device Android terdeteksi. Pastikan device terhubung dan USB debugging aktif.")
        sys.exit(1)
    device_id = devices[0]
    print(f"✓ Device detected: {device_id}")
    return device_id


def _api_post(url: str, token: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }
    req = urlreq.Request(url, data=data, headers=headers, method="POST")
    with urlreq.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def register_agent(api_url: str, session_id: str, device_id: str, token: str) -> None:
    print(f"Registering agent to session {session_id}...")
    url = f"{api_url}/assessor/sessions/{session_id}/agent/register"
    try:
        data = _api_post(url, token, {"device_id": device_id})
        if data.get("success"):
            print(f"✓ Agent registered: {data.get('message')}")
        else:
            print(f"✗ Registration failed: {data.get('message')}")
            sys.exit(1)
    except urlerr.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            err = json.loads(body)
            msg = err.get("message", body)
        except Exception:
            msg = body
        print(f"✗ HTTP {e.code}: {msg}")
        sys.exit(1)
    except urlerr.URLError as e:
        print(f"✗ Connection error: {e.reason}")
        sys.exit(1)


def send_heartbeat(api_url: str, session_id: str, token: str) -> bool:
    url = f"{api_url}/assessor/sessions/{session_id}/agent/heartbeat"
    try:
        data = _api_post(url, token, {})
        return data.get("success", False)
    except Exception:
        return False


def send_frame(api_url: str, session_id: str, token: str, payload: dict) -> bool:
    """Upload frame metadata + detections (no raw PNG bytes)."""
    url = f"{api_url}/assessor/sessions/{session_id}/agent/frames"
    try:
        data = _api_post(url, token, payload)
        return data.get("success", False)
    except Exception:
        return False


def capture_frame(adb: Path, device_id: str) -> bytes:
    """Run screencap, return raw PNG bytes in memory. Read-only, no device control."""
    result = subprocess.run(
        [str(adb), "-s", device_id, "exec-out", "screencap", "-p"],
        capture_output=True, timeout=ADB_TIMEOUT,
    )
    if result.returncode != 0 or not result.stdout:
        raise RuntimeError(f"screencap gagal (rc={result.returncode})")
    return result.stdout


class FrameProcessor:
    """In-memory sink. OCR produces normalized detections.

    Returns list of detections — empty means no-op (frame not sent).
    Subclass: override on_frame or supply OcrEngine producing results.
    """

    def __init__(self, ocr: OcrEngine | None = None) -> None:
        self.processed = 0
        self.ocr = ocr or NoopOcrEngine()

    def on_frame(self, png: bytes, ts: datetime) -> list:
        """Accept raw PNG bytes in-memory, no disk write. Returns detections."""
        self.processed += 1
        results: list[OcrResult] = self.ocr.recognize(png)
        return [normalize_ocr(r) for r in results if r and r.text.strip()]

    @staticmethod
    def make_detection(type: str, label: str, text: str, confidence: float, metadata: dict | None = None) -> dict:
        """Detection schema sent to POST /agent/frames."""
        return {
            "type": type,
            "label": label,
            "text": text,
            "confidence": confidence,
            "metadata": metadata or {},
        }


def normalize_ocr(r: OcrResult) -> dict:
    """OCR result -> detection schema. bbox kept in metadata when present."""
    meta = {"source": "ocr"}
    if r.bbox is not None:
        meta["bbox"] = r.bbox
    return FrameProcessor.make_detection(
        type="ocr_text",
        label=r.text.strip()[:80],
        text=r.text.strip(),
        confidence=r.confidence,
        metadata=meta,
    )


def load_config() -> "AgentConfig":
    """Static config from .env — API URL, intervals, OCR. No credentials."""
    def _f(key: str, default: float) -> float:
        try:
            return float(os.getenv(key, str(default)))
        except ValueError:
            print(f"✗ {key} harus angka.")
            sys.exit(1)

    capture_interval = _f("NCS_CAPTURE_INTERVAL", 1.0)
    heartbeat_interval = _f("NCS_HEARTBEAT_INTERVAL", 30.0)
    if capture_interval <= 0 or heartbeat_interval <= 0:
        print("✗ Interval harus > 0.")
        sys.exit(1)

    return AgentConfig(
        api_url=os.getenv("NCS_API_URL", "http://127.0.0.1:8000/api"),
        capture_interval=capture_interval,
        heartbeat_interval=heartbeat_interval,
        ocr_engine=os.getenv("NCS_OCR_ENGINE", "none"),
        ocr_lang=os.getenv("NCS_OCR_LANG", "eng"),
        ocr_psm=int(os.getenv("NCS_OCR_PSM", "6")),
        tesseract_path=os.getenv("NCS_OCR_TESSERACT_PATH"),
    )


@dataclass
class AgentConfig:
    """Static agent settings — no session credentials here."""

    api_url: str = "http://127.0.0.1:8000/api"
    capture_interval: float = 1.0
    heartbeat_interval: float = 30.0
    ocr_engine: str = "none"
    ocr_lang: str = "eng"
    ocr_psm: int = 6
    tesseract_path: str | None = None


@dataclass
class SessionCredential:
    """Dynamic per-session credential. Supplied per run, never persisted."""

    session_id: str
    token: str

    @property
    def valid(self) -> bool:
        return bool(self.session_id and self.token)


def resolve_session_credential(args: argparse.Namespace | None = None) -> SessionCredential:
    """Priority: CLI args > env vars (.env support for E2E testing).

    Production: UI/API passes --session-id and --token per run, so assessor
    never edits .env per session.
    """
    if args and getattr(args, "session_id", None) and getattr(args, "token", None):
        return SessionCredential(session_id=args.session_id, token=args.token)
    return SessionCredential(
        session_id=os.getenv("NCS_SESSION_ID", ""),
        token=os.getenv("NCS_API_TOKEN", ""),
    )


def build_ocr_engine(config: AgentConfig) -> OcrEngine:
    """Factory — swap engine by name without editing main loop."""
    name = (config.ocr_engine or "none").lower()
    if name == "none":
        return NoopOcrEngine()
    if name == "tesseract":
        return TesseractEngine(
            lang=config.ocr_lang,
            psm=config.ocr_psm,
            tesseract_path=config.tesseract_path,
        )
    print(f"✗ OCR engine '{name}' belum tersedia, pakai noop.")
    return NoopOcrEngine()


def main() -> None:
    parser = argparse.ArgumentParser(description="NCS Analyzer Capture Agent")
    parser.add_argument("--session-id", help="Assessment session ID (overrides env)")
    parser.add_argument("--token", help="Agent token (overrides env)")
    args = parser.parse_args()

    banner()
    load_env()

    config = load_config()
    cred = resolve_session_credential(args)

    if not cred.valid:
        print("✗ Session ID dan token harus diset via --session-id/--token atau .env.")
        sys.exit(1)

    adb = find_adb()
    device_id = detect_device(adb)

    # Register agent
    register_agent(config.api_url, cred.session_id, device_id, cred.token)

    processor = FrameProcessor(ocr=build_ocr_engine(config))
    print(f"\nStarting capture (interval={config.capture_interval}s, ocr={config.ocr_engine}) in-memory...")
    print("(Tekan Ctrl+C untuk menghentikan agent.)\n")
    last_heartbeat = time.time()
    try:
        while True:
            try:
                # Send heartbeat
                now = time.time()
                if now - last_heartbeat >= config.heartbeat_interval:
                    if send_heartbeat(config.api_url, cred.session_id, cred.token):
                        ts = datetime.now().strftime("%H:%M:%S")
                        print(f"[{ts}] ♥ Heartbeat sent")
                    last_heartbeat = now

                # Capture frame -> in-memory -> FrameProcessor
                png = capture_frame(adb, device_id)
                detections = processor.on_frame(png, datetime.now())
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"[{ts}] Frame processed in-memory ({len(png)} bytes)")
                # Send frame only when processor produced detections
                if detections:
                    ok = send_frame(config.api_url, cred.session_id, cred.token, {
                        "device_id": device_id,
                        "frame_number": processor.processed,
                        "captured_at": datetime.now().isoformat(),
                        "detections": detections,
                    })
                    if ok:
                        print(f"[{ts}] ↑ Frame sent ({len(detections)} detections)")
            except subprocess.TimeoutExpired:
                print("✗ ADB timeout — device mungkin disconnected.")
                break
            except RuntimeError as e:
                print(f"✗ Capture gagal: {e}")
                break
            except FileNotFoundError:
                print("✗ ADB hilang selama running.")
                break
            time.sleep(config.capture_interval)
    except KeyboardInterrupt:
        print()
    finally:
        print(f"\nBerhenti. Total frame diproses: {processor.processed}")
        sys.exit(0)


if __name__ == "__main__":
    main()
