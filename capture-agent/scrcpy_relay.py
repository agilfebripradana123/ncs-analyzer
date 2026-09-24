#!/usr/bin/env python3
"""scrcpy H.264 -> WebSocket relay for browser live preview."""

import argparse
import asyncio
import base64
import shutil
import struct
import subprocess
import sys
import time
from pathlib import Path

try:
    import websockets
except ImportError:
    print("✗ websockets not installed. Run: pip install websockets")
    sys.exit(1)

SCRCPY_SERVER_DEVICE = "/data/local/tmp/scrcpy-server.jar"
DEFAULT_SCRCPY_DIR = Path(__file__).resolve().parent.parent / "scrcpy-win64-v3.3.4" / "scrcpy-win64-v3.3.4"


def find_adb() -> str:
    bundled = DEFAULT_SCRCPY_DIR / "adb.exe"
    if bundled.is_file():
        return str(bundled)
    found = shutil.which("adb")
    if found:
        return found
    print("✗ ADB not found")
    sys.exit(1)


def push_scrcpy_server(adb: str, device: str, scrcpy_dir: Path) -> None:
    server_jar = scrcpy_dir / "scrcpy-server"
    if not server_jar.is_file():
        print(f"✗ scrcpy-server not found at {server_jar}")
        sys.exit(1)
    print("Pushing scrcpy-server to device...")
    subprocess.run([adb, "-s", device, "push", str(server_jar), SCRCPY_SERVER_DEVICE], capture_output=True, check=True)
    print("✓ scrcpy-server pushed")


def start_scrcpy_server(adb: str, device: str) -> None:
    cmd = (
        f"CLASSPATH={SCRCPY_SERVER_DEVICE} app_process / "
        f"com.genymobile.scrcpy.Server 3.3.4 "
        f"log_level=info video=true audio=false "
        f"video_codec=h264 max_size=1024 video_bit_rate=2000000 "
        f"max_fps=15 tunnel_forward=true control=false display_id=0 cleanup=true"
    )
    proc = subprocess.Popen([adb, "-s", device, "shell", cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(1.5)
    if proc.poll() is not None:
        err = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
        print(f"✗ scrcpy-server failed: {err}")
        sys.exit(1)
    print("✓ scrcpy-server started on device")


def setup_adb_forward(adb: str, device: str, port: int = 27183) -> None:
    subprocess.run([adb, "-s", device, "forward", f"tcp:{port}", "localabstract:scrcpy"], capture_output=True, check=True)
    print(f"✓ ADB forward tcp:{port} -> localabstract:scrcpy")


def build_avcc(sps: bytes, pps: bytes) -> bytes:
    # sps/pps include NAL header (0x67 / 0x68)
    avcc = bytearray()
    avcc.append(0x01)  # configurationVersion
    avcc.append(sps[1])  # AVCProfileIndication
    avcc.append(sps[2])  # profile_compatibility
    avcc.append(sps[3])  # AVCLevelIndication
    avcc.append(0xFF)  # lengthSizeMinusOne (4 bytes)
    avcc.append(0xE1)  # numOfSPS = 1
    avcc.extend(struct.pack(">H", len(sps)))
    avcc.extend(sps)
    avcc.append(0x01)  # numOfPPS = 1
    avcc.extend(struct.pack(">H", len(pps)))
    avcc.extend(pps)
    return bytes(avcc)


def codec_string_from_sps(sps: bytes) -> str:
    return f"avc1.{sps[1]:02X}{sps[2]:02X}{sps[3]:02X}"


def annexb_to_avc_frame(nals: list[bytes]) -> bytes:
    out = bytearray()
    for nal in nals:
        out.extend(struct.pack(">I", len(nal)))
        out.extend(nal)
    return bytes(out)


async def read_h264_stream(port: int, clients: set, state: dict):
    reader, writer = await asyncio.open_connection("127.0.0.1", port)
    print("✓ Connected to scrcpy stream")
    try:
        header = await reader.readexactly(69)
        name = header[1:].split(b"\x00")[0].decode("utf-8", errors="replace")
        print(f"  Device: {name}")
    except Exception as e:
        print(f"  Header read failed: {e}")
        writer.close()
        await writer.wait_closed()
        return

    buf = bytearray()
    try:
        while True:
            chunk = await reader.read(65536)
            if not chunk:
                print("  Stream EOF")
                break
            buf.extend(chunk)

            # scan Annex B start codes, extract NALs
            # process only when we have at least 2 start codes worth
            nals: list[bytes] = []
            # find all start code positions
            positions: list[int] = []
            i = 0
            while i < len(buf) - 3:
                if buf[i] == 0 and buf[i + 1] == 0 and buf[i + 2] == 0 and buf[i + 3] == 1:
                    positions.append(i)
                    i += 4
                elif buf[i] == 0 and buf[i + 1] == 0 and buf[i + 2] == 1:
                    positions.append(i)
                    i += 3
                else:
                    i += 1

            if len(positions) < 1:
                # no start code yet, keep buffering (cap at 256k)
                if len(buf) > 512 * 1024:
                    buf = buf[-256 * 1024 :]
                continue

            # we have at least one NAL, but the last NAL is incomplete (no next start code)
            # so process all except last
            if len(positions) == 1:
                # need more data to know NAL boundary
                if len(buf) > 512 * 1024:
                    buf = buf[-256 * 1024 :]
                continue

            for idx in range(len(positions) - 1):
                start = positions[idx]
                # skip start code
                sc_len = 4 if buf[start + 2] == 0 else 3
                nal_start = start + sc_len
                nal_end = positions[idx + 1]
                nal = bytes(buf[nal_start:nal_end])
                if nal:
                    nals.append(nal)

            # keep tail from last start code onward
            buf = buf[positions[-1] :]

            if not nals:
                continue

            # inspect NAL types, capture SPS/PPS
            frame_nals: list[bytes] = []
            for nal in nals:
                nal_type = nal[0] & 0x1F
                if nal_type == 7:  # SPS
                    state["sps"] = nal
                elif nal_type == 8:  # PPS
                    state["pps"] = nal
                frame_nals.append(nal)

            # build avcc on first SPS+PPS
            if state["sps"] and state["pps"] and state["avcc"] is None:
                try:
                    avcc = build_avcc(state["sps"], state["pps"])
                    codec = codec_string_from_sps(state["sps"])
                    state["avcc"] = avcc
                    state["codec"] = codec
                    msg = '{"type":"config","codec":"' + codec + '","desc":"' + base64.b64encode(avcc).decode() + '"}'
                    dead = set()
                    for ws in list(clients):
                        try:
                            await ws.send(msg)
                        except Exception:
                            dead.add(ws)
                    for d in dead:
                        clients.discard(d)
                    print(f"  SPS/PPS captured codec={codec} avcc={len(avcc)}B, sent config to {len(clients)} clients")
                except Exception as e:
                    print(f"  avcc build failed: {e}")

            if state["avcc"] is None:
                continue  # wait for config before streaming

            # send frame as AVC (length-prefixed)
            avc = annexb_to_avc_frame(frame_nals)
            # NAL type 5 = IDR keyframe
            is_key = any((n[0] & 0x1F) == 5 for n in frame_nals)
            # prefix 1 byte key flag + 4 byte timestamp? keep simple: 1 byte type
            # Instead send binary as-is; frontend treats all as decodable, but mark key via first byte?
            # We send 1-byte header (0x00 = delta, 0x01 = key) + avc payload so frontend can set EncodedVideoChunk type
            payload = (b"\x01" if is_key else b"\x00") + avc
            dead = set()
            for ws in list(clients):
                try:
                    await ws.send(payload)
                except Exception:
                    dead.add(ws)
            for d in dead:
                clients.discard(d)

    except asyncio.IncompleteReadError:
        print("  Stream ended (device disconnected)")
    except asyncio.CancelledError:
        raise
    except Exception as e:
        print(f"  Stream reader error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass


async def ws_handler(websocket, clients: set, state: dict):
    clients.add(websocket)
    print(f"  Client connected ({len(clients)} total)")
    # send config immediately if available
    if state.get("avcc"):
        try:
            msg = '{"type":"config","codec":"' + state["codec"] + '","desc":"' + base64.b64encode(state["avcc"]).decode() + '"}'
            await websocket.send(msg)
        except Exception:
            pass
    try:
        async for _ in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"  Client disconnected ({len(clients)} total)")


async def run_relay(device_port: int, ws_port: int):
    clients: set = set()
    state: dict = {"sps": None, "pps": None, "avcc": None, "codec": None}

    async def handler(ws):
        await ws_handler(ws, clients, state)

    async with websockets.serve(handler, "127.0.0.1", ws_port, max_size=None):
        print(f"\nWebSocket relay: ws://127.0.0.1:{ws_port}")
        print("(Browser connects here for live screen)\n")
        while True:
            try:
                await read_h264_stream(device_port, clients, state)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"  Relay error: {e}, retrying in 2s...")
            await asyncio.sleep(2)
            # reset state on reconnect so SPS/PPS recaptured
            state["sps"] = state["pps"] = state["avcc"] = state["codec"] = None


def main():
    parser = argparse.ArgumentParser(description="scrcpy H.264 -> WebSocket relay")
    parser.add_argument("--device", required=True)
    parser.add_argument("--ws-port", type=int, default=8091)
    parser.add_argument("--device-port", type=int, default=27183)
    parser.add_argument("--scrcpy-dir", type=str, default=None)
    args = parser.parse_args()
    scrcpy_dir = Path(args.scrcpy_dir) if args.scrcpy_dir else DEFAULT_SCRCPY_DIR
    adb = find_adb()
    push_scrcpy_server(adb, args.device, scrcpy_dir)
    start_scrcpy_server(adb, args.device)
    setup_adb_forward(adb, args.device, args.device_port)
    try:
        asyncio.run(run_relay(args.device_port, args.ws_port))
    except KeyboardInterrupt:
        print("\nShutting down relay...")
    finally:
        subprocess.run([adb, "-s", args.device, "forward", "--remove", f"tcp:{args.device_port}"], capture_output=True)
        print("Relay stopped.")


if __name__ == "__main__":
    main()
