# 🛠️ Web 小工具合集

> 原生无依赖 · 即开即用 · 纯前端实现

一个轻量级的 Web 前端小工具集合，所有工具均为原生 JavaScript 实现，零外部依赖。

## 工具列表

| 工具 | 说明 | 状态 |
|------|------|------|
| ✍️ [手写签名插件](tools/signature-pad/) | 支持鼠标 + 手写笔签名，速度感知仿真笔迹，收笔笔锋效果，可保存为 PNG base64 并自动上传 | ✅ 已完成 |
| 📱 [二维码生成 & 解码](tools/qrcode-generator/) | 纯前端 QR 码生成与解码，支持自定义颜色/Logo/样式，可下载 PNG/SVG，支持图片上传解码、摄像头扫描 | ✅ 已完成 |
| 📅 [日期时间计算器](tools/date-calculator/) | 日期差计算、时间戳互转、时区转换、节假日查询、年龄计算 | ✅ 已完成 |
| 🔐 [文本加密/编码工具箱](tools/text-encoder/) | Base64/URL/HTML 编解码、MD5/SHA 哈希、文本统计 | ✅ 已完成 |
| 📐 [单位换算工具](tools/unit-converter/) | 12 类别 100+ 单位实时换算，支持智能识别 | ✅ 已完成 |
| 🎨 [颜色选择器 & 调色板](tools/color-picker/) | 颜色拾取器（HSL/RGB/HEX/HSV）、配色方案生成、图片取色、对比度检测 | ✅ 已完成 |
| 🔄 [JSON 格式化 & 对比](tools/json-formatter/) | JSON 格式化/压缩/校验、语法高亮、差异对比、路径查询、JSON/CSV 互转 | ✅ 已完成 |
| ⏱️ [正则表达式测试工具](tools/regex-tester/) | 正则实时匹配与高亮、捕获组展示、替换测试、常用模板库、语法速查表 | ✅ 已完成 |
| 🖼️ [图片压缩 & 格式转换](tools/image-tool/) | 图片压缩、PNG/JPEG/WebP/BMP 格式互转、尺寸调整、批量处理 | ✅ 已完成 |
| 📝 [Markdown 预览 & 编辑](tools/markdown-editor/) | 实时 Markdown 预览、工具栏快捷插入、常用模板、深色主题、导出 HTML | ✅ 已完成 |
| 🌐 [IP / 网络信息查询](tools/ip-tool/) | IP 地址查询与验证、CIDR 计算、子网划分、本机网络信息、参考速查表 | ✅ 已完成 |

## 快速开始

### 方式一：直接打开

用浏览器打开根目录的 [`index.html`](index.html) 即可进入工具合集首页，选择需要的工具使用。

### 方式二：单独使用某个工具

每个工具都是独立的，可以直接打开对应目录下的 `index.html`。

例如签名插件：`tools/signature-pad/index.html`

## 项目结构

```
├── index.html                          # 工具合集首页
├── README.md                           # 本文件
└── tools/
    ├── signature-pad/                  # 手写签名插件
    │   ├── config.js                   # 配置模块
    │   ├── utils.js                    # 工具函数
    │   ├── toast.js                    # Toast 提示
    │   ├── engine.js                   # CanvasEngine 画布引擎
    │   ├── ui.js                       # SignaturePad UI 交互层
    │   ├── signature-pad.css           # 样式文件
    │   ├── index.html                  # 演示页面
    │   └── USAGE.md                    # 使用文档
    ├── qrcode-generator/               # 二维码生成 & 解码
    │   ├── config.js                   # 配置模块
    │   ├── qrcode-lib.js               # QR 码生成库（编码 + 矩阵生成）
    │   ├── qrcode-decoder.js           # QR 码解码库（图像识别 + 解码）
    │   ├── app.js                      # 主应用逻辑（UI 交互 + 生成 + 解码）
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    ├── date-calculator/                # 日期时间计算器
    │   ├── config.js                   # 配置模块
    │   ├── date-engine.js              # 日期计算引擎
    │   ├── holiday-data.js             # 节假日数据
    │   ├── app.js                      # 主应用逻辑
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    ├── text-encoder/                   # 文本加密/编码工具箱
    │   ├── config.js                   # 配置模块
    │   ├── encode-engine.js            # 编解码引擎
    │   ├── hash-engine.js              # 哈希计算引擎
    │   ├── stats-engine.js             # 文本统计引擎
    │   ├── app.js                      # 主应用逻辑
    │   └── index.html                  # 工具页面
    ├── unit-converter/                 # 单位换算工具
    │   ├── config.js                   # 配置模块
    │   ├── conversion-data.js          # 换算数据
    │   ├── converter-engine.js         # 换算引擎
    │   ├── app.js                      # 主应用逻辑
    │   └── index.html                  # 工具页面
    ├── color-picker/                   # 颜色选择器 & 调色板
    │   ├── config.js                   # 配置模块
    │   ├── color-utils.js              # 颜色转换/计算引擎
    │   ├── palette-engine.js           # 调色板生成引擎
    │   ├── app.js                      # UI 交互层
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    ├── json-formatter/                 # JSON 格式化 & 对比
    │   ├── config.js                   # 配置模块
    │   ├── json-engine.js              # JSON 解析/格式化引擎
    │   ├── diff-engine.js              # 差异对比引擎
    │   ├── app.js                      # UI 交互层
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    └── regex-tester/                   # 正则表达式测试工具
        ├── config.js                   # 配置模块
        ├── regex-engine.js             # 正则匹配/替换引擎
        ├── app.js                      # UI 交互层
        ├── index.html                  # 工具页面
        └── USAGE.md                    # 使用文档
    ├── image-tool/                     # 图片压缩 & 格式转换
    │   ├── config.js                   # 配置模块
    │   ├── image-engine.js             # 图片处理引擎
    │   ├── app.js                      # UI 交互层
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    ├── markdown-editor/                # Markdown 预览 & 编辑
    │   ├── config.js                   # 配置模块
    │   ├── markdown-engine.js          # Markdown 解析引擎
    │   ├── app.js                      # UI 交互层
    │   ├── index.html                  # 工具页面
    │   └── USAGE.md                    # 使用文档
    └── ip-tool/                        # IP / 网络信息查询
        ├── config.js                   # 配置模块
        ├── network-engine.js           # 网络计算引擎
        ├── app.js                      # UI 交互层
        ├── index.html                  # 工具页面
        └── USAGE.md                    # 使用文档
```

## 开发指南

### 添加新工具

1. 在 `tools/` 下创建新目录，例如 `tools/json-formatter/`
2. 在该目录下创建 `index.html` 作为工具入口
3. 在根目录 `index.html` 的 `tools-grid` 中添加工具卡片

### 代码规范

- 所有工具使用原生 JavaScript，零外部依赖
- 每个工具独立目录，不互相依赖
- 使用 `'use strict'` 严格模式
- 兼容 IE 10+ / Chrome / Firefox / Safari / Edge

## 许可证

MIT