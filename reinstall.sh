#!/usr/bin/env bash
# 把 dsh-balance 插件安装到当前 DSH 运行时的 node_modules，并在 profile 回退目录建立符号链接。
# 用法：./reinstall.sh    （DSH 升级后重新运行一次）
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

detect_runtime() {
  if [ -n "${DSH_BALANCE_RUNTIME:-}" ]; then
    echo "$DSH_BALANCE_RUNTIME"
    return
  fi
  local candidates=(
    "$HOME/Library/Application Support/DeepSeek Harness Glass/runtime"
    "$HOME/.dsh/runtime"
    "$HOME/AppData/Local/DeepSeek Harness Glass/runtime"
    "$HOME/.local/share/deepseek-harness/runtime"
  )
  local dir
  for dir in "${candidates[@]}"; do
    if [ -e "$dir/current" ] || [ -d "$dir/versions" ]; then
      echo "$dir"
      return
    fi
  done
  echo ""
}

RUNTIME_ROOT="$(detect_runtime)"
if [ -z "$RUNTIME_ROOT" ]; then
  echo "未找到 DSH 运行时目录，请用 DSH_BALANCE_RUNTIME 环境变量指定：" >&2
  echo "  DSH_BALANCE_RUNTIME=\"/path/to/runtime\" ./reinstall.sh" >&2
  exit 1
fi
CURRENT="$(readlink "$RUNTIME_ROOT/current" || true)"
if [ -z "$CURRENT" ]; then
  echo "未找到运行时 current 链接：$RUNTIME_ROOT/current" >&2
  exit 1
fi
VERSION="${CURRENT#versions/}"

TARGET="$RUNTIME_ROOT/versions/$VERSION/node_modules/@etony668/dsh-balance"
mkdir -p "$(dirname "$TARGET")"
rm -rf "$TARGET"
cp -R "$SOURCE_DIR" "$TARGET"
echo "已安装到 $TARGET"

PROFILES_NM="$HOME/.dsh/profiles/node_modules/@etony668"
mkdir -p "$PROFILES_NM"
ln -sfn "$TARGET" "$PROFILES_NM/dsh-balance"
echo "已链接 $PROFILES_NM/dsh-balance -> $TARGET"

PATCH="$HOME/.dsh/cordis.patch.yml"
if ! grep -q "name: '@etony668/dsh-balance'" "$PATCH" 2>/dev/null; then
  TMP="$PATCH.tmp.$$"
  {
    if [ -f "$PATCH" ]; then cat "$PATCH"; else echo "# DSH 用户级补丁层：\$DSH_HOME/cordis.patch.yml"; fi
    echo "- insert:"
    echo "    - id: dsh-balance"
    echo "      name: '@etony668/dsh-balance'"
    echo ""
  } > "$TMP"
  mv "$TMP" "$PATCH"
  echo "已写入 $PATCH"
else
  echo "cordis.patch.yml 已包含插件条目，跳过。"
fi
echo ""
echo "完成：刷新 DSH 页面（或重启 DSH）后，输入框下方出现余额徽标。"
