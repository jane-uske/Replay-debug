# Replay Debug

Replay Debug 是一个 Chrome 浏览器扩展，用来录制网页操作过程，并在回放页里还原现场。它适合用在前端问题排查、Bug 复现、客服反馈分析、测试记录等场景。

你可以把它理解成一个更偏开发者视角的“网页操作录屏”：除了页面回放，它还会记录点击、输入、滚动、页面跳转、网络请求、控制台日志和 JS 错误，帮助你更快判断问题发生在什么时间、哪个页面、哪个请求或哪段脚本附近。

## 功能特性

- 页面操作回放：基于 rrweb 记录 DOM 变化，并使用 rrweb-player 回放。
- 用户行为记录：点击、输入、滚动、按键、页面跳转。
- 网络请求记录：拦截 fetch 和 XMLHttpRequest，记录 URL、Method、状态码、耗时、请求/响应头和大小。
- 控制台记录：记录 `log`、`warn`、`error`、`info`。
- 错误记录：记录 JS 错误、Promise 未处理异常和资源加载错误。
- 跨页面录制：页面刷新、普通跳转、SPA 路由变化、新标签页切换都能记录到同一个会话里。
- 截图辅助：发生操作或错误时，会保存少量页面截图，方便定位上下文。
- 本地历史：录制数据默认保存在浏览器本地。
- 导入导出：支持把录制数据导出为 JSON，也可以重新导入查看。

## 适合什么场景

- 用户说“我这里出错了”，但很难描述具体步骤。
- 测试同学需要把复现路径交给开发同学。
- 开发者希望同时看到页面回放、网络请求、控制台和错误信息。
- 需要排查偶发的前端问题、接口错误、资源加载失败或 SPA 路由问题。

它不适合替代完整的监控平台，也不适合长期、大规模、无人值守地采集用户行为。当前项目更像一个本地调试和问题复现工具。

## 安装使用

### 1. 安装依赖

```bash
npm install
```

### 2. 构建扩展

```bash
npm run build
```

构建完成后会生成 `dist/` 目录。

### 3. 在 Chrome 中加载扩展

1. 打开 `chrome://extensions/`。
2. 打开右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目里的 `dist/` 目录。

### 4. 开始录制

1. 打开你要排查的网页。
2. 点击浏览器工具栏里的 Replay Debug 图标。
3. 点击“开始录制”。
4. 在页面里复现问题。
5. 回到插件弹窗，点击“停止录制”。
6. 点击“打开回放”，查看录制结果。

## 开发命令

```bash
# 开发模式，监听文件变化并重新打包
npm run dev

# 生产构建
npm run build

# 清理构建产物
npm run clean
```

注意：Chrome 扩展不会因为 `npm run dev` 自动热更新。重新构建后，需要在 `chrome://extensions/` 页面手动刷新扩展。

## 回放页能看到什么

回放页主要包含这些信息：

- 时间线：把页面跳转、用户操作、网络请求、控制台日志、错误按时间合在一起。
- 操作记录：点击、输入、滚动、按键等用户行为。
- 网络请求：请求 URL、Method、状态码、耗时、Header、请求大小、响应大小。
- 控制台：页面运行时输出的 console 内容。
- 错误：JS 错误、Promise 错误、资源加载错误。
- 历史录制：查看、删除、批量导出、导入录制数据。

点击时间线或面板中的条目，可以跳到对应的回放时间点。

## 隐私和安全说明

这个扩展会记录比较敏感的调试数据，开源或实际使用时需要明确告知使用者。

默认会记录：

- 当前页面的 DOM 快照和 DOM 变化。
- 用户点击、滚动、特殊按键。
- 普通输入框的输入值。
- 当前页面 URL、页面标题和页面跳转。
- fetch / XHR 的请求元信息。
- console 输出和 JS 错误。
- 少量截图。

已经做的保护：

- `password`、`email`、`tel` 类型输入框会被标记为 `[masked]`。
- 网络请求默认不读取响应体，只记录元信息和大小。
- 常见敏感字段会脱敏，例如 `authorization`、`cookie`、`token`、`password`、`apiKey`、`session` 等。
- console 和错误信息会做敏感字段脱敏和长度截断。
- 录制数据默认保存在浏览器本地的 `chrome.storage.local`，没有上传到远程服务器。

仍然需要注意：

- 普通文本输入框仍可能包含敏感内容，比如身份证号、地址、备注、搜索关键词。
- DOM 快照里可能包含页面上已经展示出来的敏感信息。
- 截图会保存页面画面，可能包含用户隐私。
- 导出的 JSON 文件包含完整录制数据，请不要随意公开。

如果你要把它用于真实用户环境，建议先增加更严格的脱敏规则、域名白名单、采集开关和用户授权提示。

## rrweb 的已知限制

Replay Debug 的页面回放能力来自 rrweb。rrweb 很适合记录 DOM 变化，但它不是视频录屏，也不是浏览器虚拟机，所以有一些天然限制：

- 不会保存真正的视频流或音频流。
- 播放回放时，`video` / `audio` 内容通常无法还原。
- 某些 canvas、WebGL、第三方 iframe、跨域资源、受权限保护的媒体内容可能无法完整回放。
- 动态资源如果依赖登录态、临时 URL、blob URL 或服务端状态，回放时可能不可用。

当前项目会在录制和回放时尽量避开媒体元素，避免 rrweb-player 在播放历史视频状态时抛出 `NotSupportedError: The element has no supported sources`。

## 权限说明

`public/manifest.json` 中声明了以下权限：

- `activeTab`：获取当前用户正在录制的标签页。
- `storage`：保存录制会话和历史记录。
- `tabs`：读取标签页信息，处理页面跳转和新标签页。
- `scripting`：向当前页面注入 content script。
- `webNavigation`：辅助记录新标签页和页面导航。
- `unlimitedStorage`：降低录制数据较大时触发存储限制的概率。
- `<all_urls>`：允许在不同网页上录制和注入脚本。

当前核心网络采集通过页面主世界里的 fetch / XHR 包装实现。`webRequest` 权限不是核心路径，后续可以评估移除，进一步收窄权限范围。

## 项目结构

```text
.
├── public/
│   ├── manifest.json       # Chrome 扩展声明
│   ├── popup.html          # 插件弹窗页面
│   └── replay.html         # 回放页面
├── src/
│   ├── background/         # Service Worker，负责录制状态、存储、标签页协调
│   ├── content/            # Content Script，负责 rrweb 录制和用户行为采集
│   ├── inject/             # 注入页面主世界，拦截网络、console、路由变化
│   ├── popup/              # 插件弹窗逻辑
│   ├── replay/             # React 回放应用
│   └── types/              # 共享类型定义
├── webpack.config.js       # 打包配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

## 技术栈

- Chrome Extension Manifest V3
- TypeScript
- React
- rrweb
- rrweb-player
- webpack

## 数据大致长什么样

导出的 JSON 大致包含多个录制会话：

```json
{
  "version": 1,
  "sessions": [
    {
      "id": "example",
      "url": "https://example.com",
      "title": "Example",
      "startTime": 1730000000000,
      "endTime": 1730000010000,
      "rrwebEvents": [],
      "actions": [],
      "networkRequests": [],
      "consoleLogs": [],
      "errors": [],
      "screenshots": [],
      "pages": []
    }
  ]
}
```

实际文件会比这个例子大很多，因为 `rrwebEvents` 里包含页面快照和 DOM 变化。

## 后续可以优化的方向

- 增加域名白名单和录制前确认页。
- 增加更细的隐私规则，比如按选择器屏蔽 DOM、输入框和截图区域。
- 限制单次录制时长、事件数量、截图数量和导入文件大小。
- 压缩或分片保存大型录制数据。
- 减少扩展权限，移除暂时不需要的权限。
- 增加自动化测试和示例页面。
- 补充贡献指南和问题反馈模板。

## License

本项目使用 ISC License，详见 [LICENSE](./LICENSE)。
