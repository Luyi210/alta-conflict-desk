# 依赖与复用范围

以下是本次实际安装版本（2026-10-31），精确依赖树见 `package-lock.json`，各包许可证原文保留在 npm 分发包内。

| 依赖 | 版本 | 许可证 | 使用范围 |
| --- | --- | --- | --- |
| @modelcontextprotocol/sdk | 1.32.2 | MIT | 实际 MCP 客户端、服务端、stdio、工具发现与调用 |
| React / React DOM | 19.3.1 | MIT | 页面渲染与交互 |
| Express | 5.3.0 | MIT | 本地 API 与静态页面服务 |
| Zod | 4.6.7 | MIT | 服务端输入校验与工具 schema |
| pdfjs-dist（Mozilla PDF.js） | 6.4.299 | Apache-2.0 | 服务端逐页提取和浏览器 PDF 原文渲染，复用公开 npm 库，无源码移植 |
| diff（jsdiff） | 9.0.0 | BSD-3-Clause | 提取文本的行级增删比较，非法律语义判断 |
| docx | 9.15.0 | MIT | 本地生成可编辑 OOXML Word 备忘录 |
| fflate | 0.8.3 | MIT | 开发测试中解压并检查 Word XML；也是 docx 的传递依赖 |
| lucide-react | 0.468.0 | ISC | 界面图标 |
| Vite | 6.4.5 | MIT | 开发与生产构建 |
| @vitejs/plugin-react | 4.7.0 | MIT | React 构建插件 |
| TypeScript | 5.9.3 | Apache-2.0 | 共享类型与静态检查 |
| tsx | 4.23.15 | MIT | 服务端 TypeScript 运行 |
| Prettier | 3.6.2 | MIT | 源码格式化（开发工具） |
| concurrently | 9.2.5 | MIT | 同时启动前后端 |

`@types/*` 开发依赖来源于 DefinitelyTyped（MIT）。SQLite 使用 Node.js 内置模块；不另行打包数据库服务。网页字体使用本机可用字体，没有外部字体请求。图文说明书的 PDF 使用 [Droid Sans Fallback](https://android.googlesource.com/platform/frameworks/base/+/android10-release/data/fonts/) 的字符子集；该字体元数据声明 Apache-2.0。来源、修改范围和[许可证全文](../assets/fonts/LICENSE-DroidSansFallback.txt)保存在 `assets/fonts/`。视频生成可选使用本机 FFmpeg 与 Pillow，运行原型不依赖视频制作工具。

业务代码为本次原型独立编写。Dify、MCP Inspector、OpenContracts 和 yente 只作为产品组织、证据审阅与主体匹配方法参考，没有移植它们的业务源码、图片或界面组件。研究和各自许可区别见 [RESEARCH.md](RESEARCH.md)。未接入或分发 OpenSanctions 数据。

GLEIF 公共 API 的主体与关系信息是运行时外部来源。所有律所委托、合伙人姓名与事项关系均为虚构演示记录。Alta Lex 仅作为测试题的目标产品背景，不代表本原型获其官方认可，也未复用其产品源码或下载的视觉资产。

两份内置 PDF 为本项目生成的虚构示例，使用 ReportLab 制作；ReportLab 不属于应用运行依赖。PDF.js 项目：[mozilla/pdf.js](https://github.com/mozilla/pdf.js)。Zod 升级至 4.6.7 后已验证 MCP schema 与既有流程兼容。
