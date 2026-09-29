[English](README.md) | 中文

# DSH 余额插件（dsh-balance）

在**侧边栏底部「设置」旁边**常驻显示 **DeepSeek API 余额**的小插件。

- **位置**：注册官方 `sidebar.footer.action` 槽位（侧边栏底部、设置行旁），
  自动适配 56px 折叠轨道（只显示圆点），始终保持在侧边栏内部。
- **实时余额**：读取 DSH 已保存在 `~/.dsh/.credentials.yaml` 的
  `DEEPSEEK_API_KEY`，调用官方 `api.deepseek.com/user/balance`，结果缓存 60 秒。
- **低余额提醒**：可用余额低于阈值（默认 **¥2**，可在代码中调整）时变红并显示 ⚠。
- **悬停看明细**：赠送 / 充值 / 币种 / 上次更新时间；**点击即可刷新**。
- **中英双语 + 深浅主题**：跟随系统语言，配色走 DSH 主题 token，深色模式自动适配。
- **本地优先**：密钥只在本机读取，余额仅在 DSH 后端与浏览器之间传递，
  不写盘、不上报任何第三方。

## 安装

> ⚠️ **请一律通过插件管理器安装与更新**（插件面板，或 `dsh plugin add <路径或包名>`）。
> **不要**手工编辑 profile 的 `package.json` 去添加 `link:` 依赖：当插件同时出现在
> `dsh.profile.bundles` 与 `dependencies` 里时，插件管理器会以 `ambiguous-install`
> 拒绝更新（DSH 0.20+）。若已手工加过，删掉那条手工声明后重装一次即可——管理器会
> 自己写入正确的依赖。

### 方式一：一条命令（推荐）

```sh
dsh plugin --profile web add @etony668/dsh-balance
```

### 方式二：从 GitHub 克隆（备选）

```bash
git clone https://github.com/etony668/dsh-balance.git
cd dsh-balance
./install.sh
```

然后刷新 DSH 页面（或重启 DSH），侧边栏底部「设置」旁即出现余额徽标。

## 前置条件

- DSH 需要已保存 DeepSeek 密钥（`~/.dsh/.credentials.yaml`，可在
  **设置 → 模型** 中配置）。没有密钥时徽标显示「余额不可用 · 未找到 API Key」。

## 目录结构

```
index.js        包根入口（loader 以 <pkg>/index.js 解析）
lib/index.js    host 端：读取凭证、查询余额接口、缓存
lib/client.js   浏览器端：注册 conversation.composer.dock 条目
cordis.patch.yml `dsh plugin add` 使用的 bundle 补丁
install.sh      一键安装（macOS/Linux bash）
reinstall.sh    重装到当前运行时 + profile 回退链接
```

## 许可证

[MIT](./LICENSE)
