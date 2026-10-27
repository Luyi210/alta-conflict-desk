#!/usr/bin/env python3
"""Build the v0.2 screenshot walkthrough draft, with no simulated UI interaction.

Reuses render-demo.py's installed Pillow/FFmpeg workflow. Original screenshots
and v1 deliverables are read-only inputs. Rendering is optional documentation
tooling and installs no dependencies. The application requires neither Python
nor FFmpeg. Every frame discloses that this is a rules-mode screenshot draft.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw

SPEC = importlib.util.spec_from_file_location("render_demo_base", Path(__file__).with_name("render-demo.py"))
assert SPEC and SPEC.loader
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
ROOT, DOCS, SHOTS = BASE.ROOT, BASE.DOCS, BASE.SHOTS
WIDTH, HEIGHT, FPS = BASE.WIDTH, BASE.HEIGHT, BASE.FPS
DISCLOSURE = "截图演示草稿 · 非连续录屏 · 规则预览"
LIMITATION = "内部委托数据虚构 · AI 待模型 API 实跑验证"
OUTPUT_STEM = "demo-v2-walkthrough"

STORY = [
    {"image": "v2-01-intake.jpg", "seconds": 9, "start": 580, "end": 1120,
     "title": "01  将每一方纳入核查范围", "caption": "同一案件记录拟委托人、交易对方和担保方。截图中 2 方已确认 LEI；未确认主体仍保留为身份缺口。"},
    {"image": "v2-02-case.jpg", "seconds": 8, "start": 190, "end": 610,
     "title": "02  聚合实际核查与覆盖缺口", "caption": "两方分别完成公开身份、母公司与虚构台账核查，各有 4 次真实 MCP 调用；6 条线索仍待人工复核。"},
    {"image": "v2-03-tasks.jpg", "seconds": 9, "start": 380, "end": 850,
     "title": "03  跨主体合并补证材料", "caption": "同一内部事项的补证合并为一项，关联两个主体。示例已保存核实说明和材料引用；引用不代表上传文件。"},
    {"image": "v2-03-tasks.jpg", "seconds": 5, "start": 1280, "end": 1370,
     "title": "04  单独核实既往保密义务", "caption": "既往事项继续生成保密义务待办；核实事项范围、相关义务与材料依据，不能用公司关联代替律师判断。"},
    {"image": "v2-04-review-blocked.jpg", "seconds": 8, "start": 370, "end": 560,
     "title": "05  有缺口，就保留阻塞", "caption": "身份、线索复核和补证尚未齐备，页面阻止标记“审查记录完备”。总意见由律师填写，不自动批准收案。"},
    {"image": "v2-05-tools.jpg", "seconds": 9, "start": 300, "end": 760,
     "title": "06  独立执行真实工具查询", "caption": "MCP 实际发现 5 项工具。律师可手动填写查询条件并调用；示例 search_entities 已返回，保留调用记录。"},
    {"image": "v2-06-permission.jpg", "seconds": 6, "start": 0, "end": 0,
     "title": "07  管理单项工具使用权限", "caption": "暂停“查找企业身份”后，执行按钮禁用。权限适用于后续手动、规则和模型调用；已发出的请求继续执行。"},
    {"image": "v2-07-trace.jpg", "seconds": 7, "start": 0, "end": 0,
     "title": "08  查看可追溯的调用凭证", "caption": "凭证展示真实请求参数、原始企业数据、来源与 2166 ms 耗时。这是手动 MCP 调用，尚未验证模型实跑。"},
]


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
    label(draw, "ALTA CONFLICT DESK · v0.2")
    if not ending:
        BASE.put(draw, (100, 235), "把每一方，都放进审查范围。", 56)
        BASE.put(draw, (103, 342), "多方核查  →  跨主体补证  →  律师总意见", 31, BASE.MUTED)
        draw.rounded_rectangle((100, 455, 1340, 680), radius=8, fill="#f8faf5", outline=BASE.LINE)
        BASE.put(draw, (133, 492), "实际浏览器操作截图串联 · 不是连续操作录屏", 28)
        BASE.put(draw, (133, 548), "真实 GLEIF MCP + 本机 SQLite MCP · 内部事项全部虚构", 25, BASE.MUTED)
        BASE.put(draw, (133, 608), "本片展示规则核查与手动工具调用；AI 仍待 API 实跑验证。", 24, BASE.MUTED)
    else:
        BASE.put(draw, (100, 235), "工具有凭证，审查有依据。", 57)
        BASE.put(draw, (103, 344), "案件、材料与人工意见串联；每次工具调用均可回溯。", 29)
        draw.rounded_rectangle((100, 448, 1340, 682), radius=8, fill="#f8faf5", outline=BASE.LINE)
        BASE.put(draw, (133, 486), "本次仍有身份、材料和线索待复核，未作出收案决定。", 26)
        BASE.put(draw, (133, 546), "已展示：多方核查 / 合并补证 / 阻塞守卫 / 手动调用 / 权限", 25, BASE.MUTED)
        BASE.put(draw, (133, 607), "后续补齐：模型 API 实跑与 AI 版连续操作录屏。", 25, BASE.MUTED)
    BASE.put(draw, (103, 790), "独立本机原型 · 截图原件保留 · 公司关联不等于法律利益冲突", 22, BASE.MUTED)
    im.save(path)


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    original_hashes = {}
    for item in STORY:
        path = SHOTS / item["image"]
        with Image.open(path) as im:
            if im.width != 1280 or im.height < 720:
                raise ValueError(f"Unexpected source dimensions: {path.name} {im.size}")
            if not 0 <= min(item["start"], item["end"]) <= max(item["start"], item["end"]) <= im.height - 720:
                raise ValueError(f"Pan exceeds source bounds: {path.name}")
        original_hashes[item["image"]] = checksum(path)
    captions = [(5, f"{DISCLOSURE}。{LIMITATION}。本片展示实际 UI 截图。")]
    captions += [(s["seconds"], s["caption"]) for s in STORY]
    captions += [(6, "截图草稿：展示多方核查、补证、阻塞和工具台。当前仍待人工复核；AI 待 API 实跑，不批准收案。")]
    srt, at = [], 0
    for index, (seconds, text) in enumerate(captions, 1):
        srt.append(f"{index}\n{BASE.stamp(at)} --> {BASE.stamp(at + seconds)}\n{text}\n")
        at += seconds
    subtitle = DOCS / f"{OUTPUT_STEM}.srt"
    subtitle.write_text("\n".join(srt), encoding="utf-8")
    output = DOCS / f"{OUTPUT_STEM}.mp4"
    with tempfile.TemporaryDirectory(prefix="alta-demo-v2-") as work_dir:
        work = Path(work_dir)
        title, ending = work / "title.png", work / "ending.png"
        card(title); card(ending, ending=True)
        shutil.copyfile(title, DOCS / f"{OUTPUT_STEM}-poster.png")
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
                filt = f"[0:v]crop=1280:720:0:'{pan}',pad={WIDTH}:{HEIGHT}:80:96:color=0xedf0e8[shot];[shot][1:v]overlay=0:0,setsar=1[v]"
                args += ["-filter_complex", filt, "-map", "[v]"]
            else:
                args += ["-vf", "setsar=1"]
            BASE.run(args + ["-t", str(seconds), "-an"] + common + [str(target)])
            segments.append(target)
            print(f"Rendered {index + 1}/{len(sequence)}: {image_path.name}", flush=True)
        concat = work / "concat.txt"
        concat.write_text("".join(f"file '{path.as_posix()}'\n" for path in segments), encoding="utf-8")
        BASE.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(subtitle), "-map", "0:v:0", "-map", "1:0", "-c:v", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=zho", "-metadata:s:s:0", "title=中文说明", "-disposition:s:0", "0", "-metadata", "title=Alta Conflict Desk v0.2 — Screenshot Walkthrough Draft", "-metadata", "comment=Actual interaction screenshots; not continuous recording. Rules and manual MCP mode. Synthetic engagements; AI not verified.", "-movflags", "+faststart", str(output)])
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate", "-of", "json", str(output)], text=True))
    duration = float(probe["format"]["duration"])
    assert abs(duration - at) <= 0.1 and 60 <= duration <= 80, duration
    assert any(s.get("codec_name") == "h264" and s.get("width") == WIDTH and s.get("height") == HEIGHT for s in probe["streams"])
    assert any(s.get("codec_name") == "mov_text" for s in probe["streams"])
    assert not any(s.get("codec_type") == "audio" for s in probe["streams"])
    for file, digest in original_hashes.items():
        assert checksum(SHOTS / file) == digest, f"Original screenshot changed: {file}"
    manifest = {
        "kind": "screenshot-walkthrough-draft", "version": "0.2", "continuousScreenRecording": False,
        "mode": "rules-and-manual-mcp", "aiVerified": False, "audio": False, "syntheticInternalData": True,
        "persistentDisclosure": DISCLOSURE, "persistentLimitation": LIMITATION, "originalScreenshotsUnmodified": True,
        "method": "Original screenshots cropped and vertically panned; title/caption overlays outside the screenshot viewport. No synthetic click or cursor animation.",
        "sourceScreenshots": [{"file": file, "sha256": digest, "dimensions": list(Image.open(SHOTS / file).size)} for file, digest in original_hashes.items()],
        "chapters": STORY, "probe": probe,
    }
    (DOCS / f"{OUTPUT_STEM}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "duration": duration, "sizeBytes": output.stat().st_size, "continuousScreenRecording": False, "aiVerified": False}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
