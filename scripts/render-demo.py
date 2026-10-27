#!/usr/bin/env python3
"""Render an explicitly labelled screenshot walkthrough, not a screen recording.

Optional documentation tooling only: Python 3 + Pillow + ffmpeg/ffprobe.
The application itself does not require these packages. Source screenshots are
not changed. Long screenshots are cropped/panned into a 1280x720 viewport.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SHOTS = DOCS / "screenshots"
WIDTH, HEIGHT, FPS = 1440, 900, 24
BG, INK, MUTED, LINE = "#edf0e8", "#243e34", "#67735f", "#ced6c7"
FONT_CANDIDATES = [
    os.environ.get("DEMO_FONT", ""),
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "C:/Windows/Fonts/msyh.ttc",
]
FONT = next((p for p in FONT_CANDIDATES if p and Path(p).exists()), None)
if FONT is None:
    raise SystemExit("Set DEMO_FONT to an installed Chinese font file; no system packages are installed by this script.")
for command in ("ffmpeg", "ffprobe"):
    if not shutil.which(command):
        raise SystemExit(f"Missing optional video-rendering dependency: {command}")


def font(size: int):
    return ImageFont.truetype(FONT, size)


def put(draw, xy, text, size=24, fill=INK):
    draw.text(xy, text, font=font(size), fill=fill)


def wrapped(draw, text, width, size=23):
    lines, line = [], ""
    for char in text:
        if char == "\n" or draw.textlength(line + char, font=font(size)) > width:
            lines.append(line)
            line = "" if char == "\n" else char
        else:
            line += char
    if line:
        lines.append(line)
    return lines


def overlay(path: Path, chapter: str, caption: str, number: int):
    im = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, WIDTH, 95), fill=BG)
    draw.rectangle((0, 816, WIDTH, HEIGHT), fill=BG)
    put(draw, (80, 30), chapter, 28)
    put(draw, (825, 39), "截图演示草稿 · 非连续录屏 · 规则预览", 19, MUTED)
    draw.line((80, 82, 1360, 82), fill=LINE, width=1)
    for i, line in enumerate(wrapped(draw, caption, 1190, 23)):
        put(draw, (80, 828 + i * 30), line, 23)
    put(draw, (1325, 845), f"{number:02d}", 18, MUTED)
    im.save(path)


def card(path: Path, ending=False):
    im = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(im)
    put(draw, (100, 85), "ALTA CONFLICT DESK", 26, MUTED)
    draw.line((100, 137, 1340, 137), fill=LINE, width=2)
    if not ending:
        put(draw, (100, 244), "收案前，先看清关系。", 65)
        put(draw, (103, 349), "主体确认  →  交叉核查  →  律师复核", 33, MUTED)
        draw.rounded_rectangle((100, 465, 1340, 681), radius=8, fill="#f8faf5", outline=LINE)
        put(draw, (133, 500), "本次真实操作截图串联 · 非连续录屏", 30)
        put(draw, (133, 554), "真实 GLEIF MCP + 真实 SQLite MCP · 内部委托数据虚构", 25, MUTED)
        put(draw, (133, 606), "规则预览模式：没有模型实际调用，不代表 AI 验收完成。", 25, MUTED)
    else:
        put(draw, (100, 235), "证据可回溯，判断留给律师。", 57)
        put(draw, (103, 353), "已验证：2 组真实 MCP · 3 类线索 · 人工复核 · 报告导出", 28)
        put(draw, (103, 416), "本片是截图演示草稿，不包含连续操作或鼠标点击录屏。", 25, MUTED)
        draw.rounded_rectangle((100, 506, 1340, 650), radius=8, fill="#f8faf5", outline=LINE)
        put(draw, (133, 536), "后续补齐：模型 API 实跑 → AI 版连续操作演示", 28)
        put(draw, (133, 590), "公司关联与名称命中均只是核查线索，不是利益冲突法律结论。", 24, MUTED)
    put(draw, (103, 790), "2026.10.27  /  独立本机原型  /  规则模式", 21, MUTED)
    im.save(path)


STORY = [
    {"image": "01-workspace.jpg", "seconds": 7, "start": 0, "end": 425,
     "title": "01  建立收案核查", "caption": "先确认交易对方，再检索公开关系与既有事项。拟委托人仅作背景，内部委托台账全部虚构。"},
    {"image": "02-connectors.jpg", "seconds": 7, "start": 160, "end": 366,
     "title": "02  连接两组 MCP 数据源", "caption": "GLEIF 提供公开企业身份；SQLite 台账在本机只读查询。连接状态、工具和访问范围均可查看。"},
    {"image": "03-identity.jpg", "seconds": 10, "start": 600, "end": 963,
     "title": "03  从候选中确认主体", "caption": "这次检索返回 5 个候选。核对法律名称、地区与 LEI 后，人工确认 HSBC BANK PLC。"},
    {"image": "04-findings.jpg", "seconds": 8, "start": 140, "end": 700,
     "title": "04  核查得到三类线索", "caption": "本次规则运行得到主体一致、关联主体、名称近似三类线索。命中不等于认定法律冲突。"},
    {"image": "05-related.jpg", "seconds": 9, "start": 590, "end": 992,
     "title": "05  展开关联证据", "caption": "真实公开母公司关系与虚构事项记录分别展示；来源链接与匹配路径支持后续人工判断。"},
    {"image": "06-trace.jpg", "seconds": 7, "start": 0, "end": 0,
     "title": "06  检查真实调用凭证", "caption": "展开 get_relationships 的请求参数、结果和耗时。该凭证来自真实 MCP 调用，不是预置回答。"},
    {"image": "07-review.jpg", "seconds": 8, "start": 530, "end": 720,
     "title": "07  保存律师复核理由", "caption": "对虚构近似名线索填写排除理由并保存；本次仍有 2 条待复核线索，没有自动批准收案。"},
    {"image": "08-audit.jpg", "seconds": 6, "start": 393, "end": 393,
     "title": "08  保留执行记录", "caption": "本次核心流程共有 4 次 MCP 调用，页面明确显示 0 次由模型发起：当前是规则预览。"},
    {"image": "09-history.jpg", "seconds": 6, "start": 0, "end": 0,
     "title": "09  归档与继续复核", "caption": "历史页保留本次核查及待复核数量。报告导出另已通过实际操作验证；本片不展示下载动画。"},
]


def run(args):
    subprocess.run(args, check=True, cwd=ROOT)


def stamp(seconds):
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main():
    captions = [(6, "本片基于实际浏览器操作截图串联。非连续录屏；规则模式，没有模型实际调用。")]
    captions += [(s["seconds"], s["caption"]) for s in STORY]
    captions += [(6, "当前已验证 UI 与两组真实 MCP。后续补齐模型 API 实跑与 AI 版连续操作演示。")]
    srt, at = [], 0
    for index, (seconds, text) in enumerate(captions, 1):
        srt.append(f"{index}\n{stamp(at)} --> {stamp(at + seconds)}\n{text}\n")
        at += seconds
    subtitle = DOCS / "demo-walkthrough.srt"
    subtitle.write_text("\n".join(srt), encoding="utf-8")
    output = DOCS / "demo-walkthrough.mp4"
    with tempfile.TemporaryDirectory(prefix="alta-demo-") as work:
        work = Path(work)
        title, ending = work / "title.png", work / "ending.png"
        card(title)
        card(ending, ending=True)
        shutil.copyfile(title, DOCS / "demo-poster.png")
        segments = []
        common = ["-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS), "-video_track_timescale", "24000"]
        for index, (image_path, seconds, item) in enumerate([(title, 6, None)] + [(SHOTS / s["image"], s["seconds"], s) for s in STORY] + [(ending, 6, None)]):
            target = work / f"segment-{index:02d}.mp4"
            args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-i", str(image_path)]
            if item:
                with Image.open(image_path) as im:
                    if im.width != 1280 or im.height < 720:
                        raise ValueError(f"Unexpected screenshot dimensions: {image_path.name}, {im.size}")
                    if item["end"] > im.height - 720:
                        raise ValueError("Pan would exceed screenshot bounds")
                overlay_path = work / f"overlay-{index:02d}.png"
                overlay(overlay_path, item["title"], item["caption"], index)
                args += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay_path)]
                # Hold briefly at each end; only pan the source screenshot.
                fraction = f"min(max((t-1)/{max(seconds - 2, 1)},0),1)"
                pan = f"{item['start']}+({item['end']}-{item['start']})*({fraction})"
                filt = f"[0:v]crop=1280:720:0:'{pan}',pad={WIDTH}:{HEIGHT}:80:96:color=0xedf0e8[shot];[shot][1:v]overlay=0:0,setsar=1[v]"
                args += ["-filter_complex", filt, "-map", "[v]"]
            else:
                args += ["-vf", "setsar=1"]
            args += ["-t", str(seconds), "-an"] + common + [str(target)]
            run(args)
            segments.append(target)
            print(f"Rendered {index + 1}/11: {image_path.name}", flush=True)
        concat = work / "concat.txt"
        concat.write_text("".join(f"file '{path.as_posix()}'\n" for path in segments), encoding="utf-8")
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(subtitle), "-map", "0:v:0", "-map", "1:0", "-c:v", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=zho", "-metadata:s:s:0", "title=中文说明", "-disposition:s:0", "0", "-metadata", "title=Alta Conflict Desk — Screenshot Walkthrough Draft", "-metadata", "comment=Actual interaction screenshots; not a continuous screen recording. Rules mode; no verified AI run.", "-movflags", "+faststart", str(output)])
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate", "-of", "json", str(output)], text=True))
    duration = float(probe["format"]["duration"])
    assert 79.9 <= duration <= 80.1, duration
    assert any(s.get("codec_name") == "h264" and s.get("width") == WIDTH and s.get("height") == HEIGHT for s in probe["streams"])
    assert any(s.get("codec_name") == "mov_text" for s in probe["streams"])
    manifest = {
        "kind": "screenshot-walkthrough-draft", "continuousScreenRecording": False,
        "mode": "rules", "aiVerified": False, "audio": False,
        "sourceScreenshots": [{"file": s["image"], "sha256": hashlib.sha256((SHOTS / s["image"]).read_bytes()).hexdigest(), "seconds": s["seconds"]} for s in STORY],
        "probe": probe,
    }
    (DOCS / "demo-walkthrough.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "duration": duration, "sizeBytes": output.stat().st_size, "continuousScreenRecording": False, "aiVerified": False}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
