#!/usr/bin/env python3
"""Render the verified AI run as an explicitly labelled screenshot walkthrough.

Uses installed Pillow/FFmpeg helpers from render-demo.py. Reads only the saved
AI verification JSON and the five named screenshots: no credentials, network,
model requests, or sparse raw capture frames. Original files and old videos
are never modified. Screenshot content is only cropped and vertically panned.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("render_demo_base", Path(__file__).with_name("render-demo.py"))
assert SPEC and SPEC.loader
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
ROOT, DOCS, SHOTS, MEDIA = BASE.ROOT, BASE.DOCS, BASE.SHOTS, BASE.MEDIA
WIDTH, HEIGHT, FPS = BASE.WIDTH, BASE.HEIGHT, BASE.FPS
DISCLOSURE = "真实 AI 验收 · 截图演示 · 非连续录屏"
LIMITATION = "内部委托数据虚构 · 单主体核查完成，案件仍待补证与复核"
OUTPUT_STEM = "demo-ai-walkthrough"
VERIFICATION = DOCS / "AI-LIVE-VERIFICATION.json"

STORY = [
    {"image": "ai-01-confirmed.jpg", "seconds": 8, "start": 480, "end": 710,
     "title": "01  确认 AI 核查的主体范围", "caption": "执行方式为 AI 工具调用。仅 HSBC BANK PLC 已确认 LEI；拟委托人身份缺失，仍作为案件缺口保留。"},
    {"image": "ai-02-completed.jpg", "seconds": 8, "start": 180, "end": 410,
     "title": "02  单主体 AI 调用链路完成", "caption": "已确认主体核查完成：模型执行 2 轮、发起 4 次工具调用，连同 4 次规则调用共 8 次真实 MCP 请求。"},
    {"image": "ai-03-summary.jpg", "seconds": 9, "start": 280, "end": 530,
     "title": "03  将返回证据整理为辅助说明", "caption": "deepseek-flash 根据真实返回整理主体、母公司与虚构台账线索，附调用编号；3 条线索仍须律师复核。"},
    {"image": "ai-04-model-calls.jpg", "seconds": 9, "start": 610, "end": 750,
     "title": "04  区分规则与模型发起的调用", "caption": "记录逐项标记发起方。模型实际调用 GLEIF 身份、母公司关系及两次本地事项查询，4 次均成功返回。"},
    {"image": "ai-05-trace.jpg", "seconds": 7, "start": 120, "end": 140,
     "title": "05  查看模型调用的原始凭证", "caption": "模型发起的 get_entity 耗时 867 ms：请求 LEI、返回名称、法域、来源链接与获取时间均可追溯。"},
]


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def label(draw, chapter):
    BASE.put(draw, (80, 23), chapter, 28)
    BASE.put(draw, (815, 29), DISCLOSURE, 19, BASE.MUTED)
    BASE.put(draw, (80, 64), LIMITATION, 15, BASE.MUTED)
    draw.line((80, 88, 1360, 88), fill=BASE.LINE, width=1)


def overlay(path, chapter, caption, number):
    im = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, WIDTH, 95), fill=BASE.BG)
    draw.rectangle((0, 816, WIDTH, HEIGHT), fill=BASE.BG)
    label(draw, chapter)
    lines = BASE.wrapped(draw, caption, 1190, 23)
    if len(lines) > 2:
        raise ValueError("Caption exceeds the two-line overlay")
    for index, line in enumerate(lines):
        BASE.put(draw, (80, 828 + index * 30), line, 23)
    BASE.put(draw, (1325, 845), f"{number:02d}", 18, BASE.MUTED)
    im.save(path)


def card(path, ending=False):
    im = Image.new("RGB", (WIDTH, HEIGHT), BASE.BG)
    draw = ImageDraw.Draw(im)
    label(draw, "ALTA CONFLICT DESK · AI")
    if not ending:
        BASE.put(draw, (100, 235), "一个主体，跑通真实 AI 核查。", 55)
        BASE.put(draw, (103, 342), "deepseek-flash · 2 轮 · 4 次模型发起的 MCP 调用", 29, BASE.MUTED)
        draw.rounded_rectangle((100, 455, 1340, 685), radius=8, fill="#f8faf5", outline=BASE.LINE)
        BASE.put(draw, (133, 492), "真实 GLEIF + 本机 SQLite MCP；内部事项与委托关系虚构。", 25)
        BASE.put(draw, (133, 548), "1 个已确认主体核查完成；未确认拟委托人仍阻塞案件意见。", 25, BASE.MUTED)
        BASE.put(draw, (133, 608), "本片串联真实操作截图，展示结果与凭证，非连续录屏。", 25, BASE.MUTED)
    else:
        BASE.put(draw, (100, 235), "工具调用通过，案件仍待复核。", 55)
        BASE.put(draw, (103, 342), "已完成：HSBC BANK PLC 及其公开母公司的限定核查。", 28)
        draw.rounded_rectangle((100, 448, 1340, 685), radius=8, fill="#f8faf5", outline=BASE.LINE)
        BASE.put(draw, (133, 486), "仍待处理：拟委托人身份、3 条线索、4 项范围或保密补证。", 25)
        BASE.put(draw, (133, 546), "案件总意见保留阻塞；本次没有作出接受委托的决定。", 26, BASE.MUTED)
        BASE.put(draw, (133, 608), "最终是否收案，仍由有权律师结合完整材料判断。", 26, BASE.MUTED)
    BASE.put(draw, (103, 790), "独立本机原型 · 真实 AI 执行记录已验证 · 公司关联不自动构成法律冲突", 21, BASE.MUTED)
    im.save(path)


def validate_evidence():
    evidence = json.loads(VERIFICATION.read_text(encoding="utf-8"))
    assert evidence.get("aiVerified") is True and evidence.get("actualModel") is True
    runs = evidence["runs"]
    assert len(runs) == 1
    run = runs[0]
    assert run["status"] == "completed" and run["mode"] == "ai" and run["model"] == "deepseek-flash"
    assert run["modelExecution"] == {"status": "completed", "model": "deepseek-flash", "toolCallCount": 4, "rounds": 2}
    assert len(run["calls"]) == 8 and all(call["status"] == "success" for call in run["calls"])
    assert sum(call["initiator"] == "model" for call in run["calls"]) == 4
    assert sum(call["initiator"] == "rules" for call in run["calls"]) == 4
    assert evidence["case"]["status"] == "needs-attention" and evidence["case"]["unconfirmedParties"]
    assert any(call["initiator"] == "model" and call["tool"] == "get_entity" and call["durationMs"] == 867 for call in run["calls"])
    return evidence, run


def main():
    MEDIA.mkdir(parents=True, exist_ok=True)
    evidence, verified_run = validate_evidence()
    source_metadata = []
    for item in STORY:
        path = SHOTS / item["image"]
        with Image.open(path) as im:
            size = im.size
            if im.width != 1065 or im.height < 720:
                raise ValueError(f"Unexpected source dimensions: {path.name} {im.size}")
            if not 0 <= min(item["start"], item["end"]) <= max(item["start"], item["end"]) <= im.height - 720:
                raise ValueError(f"Pan exceeds source bounds: {path.name}")
        stat = path.stat()
        source_metadata.append({"file": item["image"], "sha256": checksum(path), "dimensions": list(size),
                                "capturedAt": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                                "captureTimestampBasis": "Source screenshot capture/save file modification time, observed before rendering", "mtimeNs": stat.st_mtime_ns})
    captions = [(5, f"{DISCLOSURE}。deepseek-flash 实际执行 2 轮、4 次模型工具调用；内部委托数据虚构。")]
    captions += [(s["seconds"], s["caption"]) for s in STORY]
    captions += [(6, "单主体 AI 核查完成；拟委托人身份、3 条线索、4 项范围或保密补证仍待处理。案件保留阻塞，没有批准收案。")]
    srt, at = [], 0
    for index, (seconds, text) in enumerate(captions, 1):
        srt.append(f"{index}\n{BASE.stamp(at)} --> {BASE.stamp(at + seconds)}\n{text}\n")
        at += seconds
    subtitle = MEDIA / f"{OUTPUT_STEM}.srt"
    subtitle.write_text("\n".join(srt), encoding="utf-8")
    output = MEDIA / f"{OUTPUT_STEM}.mp4"
    with tempfile.TemporaryDirectory(prefix="alta-demo-ai-") as work_dir:
        work = Path(work_dir)
        title, ending = work / "title.png", work / "ending.png"
        card(title); card(ending, ending=True)
        shutil.copyfile(title, MEDIA / f"{OUTPUT_STEM}-poster.png")
        segments = []
        sequence = [(title, 5, None)] + [(SHOTS / s["image"], s["seconds"], s) for s in STORY] + [(ending, 6, None)]
        common = ["-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS), "-video_track_timescale", "24000"]
        for index, (image_path, seconds, item) in enumerate(sequence):
            target = work / f"segment-{index:02d}.mp4"
            args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-i", str(image_path)]
            if item:
                overlay_path = work / f"overlay-{index:02d}.png"
                overlay(overlay_path, item["title"], item["caption"], index)
                args += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay_path)]
                fraction = f"min(max((t-1)/{max(seconds - 2, 1)},0),1)"
                pan = f"{item['start']}+({item['end']}-{item['start']})*({fraction})"
                # Keep native screenshot pixels. Remove only its final column for even-width H.264/YUV420 alignment.
                filt = f"[0:v]crop=1064:720:0:'{pan}',pad={WIDTH}:{HEIGHT}:188:96:color=0xedf0e8[shot];[shot][1:v]overlay=0:0,setsar=1[v]"
                args += ["-filter_complex", filt, "-map", "[v]"]
            else:
                args += ["-vf", "setsar=1"]
            BASE.run(args + ["-t", str(seconds), "-an"] + common + [str(target)])
            segments.append(target)
            print(f"Rendered {index + 1}/{len(sequence)}: {image_path.name}", flush=True)
        concat = work / "concat.txt"
        concat.write_text("".join(f"file '{path.as_posix()}'\n" for path in segments), encoding="utf-8")
        BASE.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(subtitle), "-map", "0:v:0", "-map", "1:0", "-c:v", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=zho", "-metadata:s:s:0", "title=中文说明", "-disposition:s:0", "0", "-metadata", "title=Alta Conflict Desk — Verified AI Screenshot Walkthrough", "-metadata", "comment=Verified real AI run: deepseek-flash, 2 rounds, 4 model-initiated MCP calls. Screenshot walkthrough, not continuous recording. Synthetic engagements; case remains blocked.", "-movflags", "+faststart", str(output)])
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate", "-of", "json", str(output)], text=True))
    duration = float(probe["format"]["duration"])
    assert abs(duration - at) <= 0.1 and 45 <= duration <= 55, duration
    assert any(s.get("codec_name") == "h264" and s.get("width") == WIDTH and s.get("height") == HEIGHT for s in probe["streams"])
    assert any(s.get("codec_name") == "mov_text" for s in probe["streams"])
    assert not any(s.get("codec_type") == "audio" for s in probe["streams"])
    for source in source_metadata:
        path = SHOTS / source["file"]
        assert checksum(path) == source["sha256"] and path.stat().st_mtime_ns == source["mtimeNs"], f"Original screenshot changed: {path.name}"
    manifest = {
        "kind": "verified-ai-screenshot-walkthrough", "continuousScreenRecording": False,
        "mode": "ai", "aiVerified": True, "audio": False, "syntheticInternalData": True, "modelRequestsByRenderer": 0,
        "persistentDisclosure": DISCLOSURE, "persistentLimitation": LIMITATION, "originalScreenshotsUnmodified": True,
        "singlePartyScreeningCompleted": True, "acceptedMatter": False, "caseHasBlockers": True, "caseBlockers": evidence["case"]["blockers"],
        "evidence": {"file": VERIFICATION.name, "sha256": checksum(VERIFICATION), "verifiedAt": evidence["verifiedAt"], "caseId": evidence["case"]["id"], "runId": verified_run["id"],
                     "model": verified_run["model"], "rounds": verified_run["modelExecution"]["rounds"], "modelToolCalls": 4, "ruleToolCalls": 4, "totalMcpCalls": 8,
                     "verificationBasis": evidence["verificationBasis"]},
        "method": "Native screenshot pixels, final one-pixel column removed for even-width encoding, then vertical crop/pan and external captions. No synthetic click, cursor animation, or sparse raw capture frames.",
        "sourceScreenshots": source_metadata, "chapters": STORY, "probe": probe,
    }
    (MEDIA / f"{OUTPUT_STEM}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "duration": duration, "sizeBytes": output.stat().st_size, "continuousScreenRecording": False, "aiVerified": True, "caseHasBlockers": True}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
