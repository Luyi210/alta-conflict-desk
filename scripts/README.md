# 辅助脚本

日常启动请用仓库根目录的 `npm run dev`；这里的脚本用于验收和生成文档。

| 文件 | 用途 |
| --- | --- |
| `live-smoke.ts`、`case-live-smoke.ts`、`tool-live-smoke.ts` | 实跑核查并将结果写入 `docs/history/evidence/`；会访问本机服务或外网，请勿用来覆盖当前交付凭证 |
| `verify-ai-run.ts`、`verify-*.ts` | 核对已保存的 AI 与审查记录；前者会写入历史验收文件 |
| `build_user_guide_pdf.py`、`build_guide_font.py` | 由文字说明和项目截图生成图文 PDF；字体来源与许可见 `assets/fonts/README.md` |
| `render-*.py` | 旧版截图视频制作脚本，保留历史用途；当前版本的连续演示视频尚未录制 |

当前交付与历史材料的入口见 [资料索引](../docs/README.md)。
