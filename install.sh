#!/usr/bin/env bash
# dsh-balance 插件一键安装：
#   1. 复制本包到 ~/.dsh/plugins/dsh-balance
#   2. 安装进当前运行时 node_modules + profile 回退符号链接（调用 reinstall.sh）
#   3. 自动把插件行写入 ~/.dsh/cordis.patch.yml（已有则跳过）
# 用法：./install.sh
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$HOME/.dsh/plugins/dsh-balance"

if [ "$SOURCE_DIR" != "$PLUGIN_DIR" ]; then
  mkdir -p "$(dirname "$PLUGIN_DIR")"
  rm -rf "$PLUGIN_DIR"
  cp -R "$SOURCE_DIR" "$PLUGIN_DIR"
  echo "已复制插件到 $PLUGIN_DIR"
fi

"$PLUGIN_DIR/reinstall.sh"

echo ""
echo "完成：刷新 DSH 页面（或重启 DSH）后，输入框下方出现余额徽标。"
