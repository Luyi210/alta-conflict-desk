#!/bin/zsh
set -e
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 24 或以上，再重新打开此文件。"
  read -r "?按回车退出"
  exit 1
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) { console.error("需要 Node.js 24 或以上"); process.exit(1); }'
if [[ ! -d node_modules ]]; then
  npm ci
fi
echo "浏览器打开 http://127.0.0.1:5178 ；保持此窗口运行，按 Control+C 停止。"
exec npm run dev
