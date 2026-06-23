# 手写签名插件使用文档

## 目录结构

```
signature-pad/
├── config.js               # 配置模块 - 所有默认配置
├── utils.js                # 工具模块 - 坐标计算、对象合并、base64转换
├── toast.js                # Toast 提示模块 - 消息提示
├── engine.js               # CanvasEngine - 纯画布签名引擎
├── ui.js                   # SignaturePad - 全屏弹窗交互层
├── signature-pad.css       # 样式文件
├── index.html              # 演示页面
└── USAGE.md                # 本使用文档
```

## 引入方式

```html
<!-- 样式 -->
<link rel="stylesheet" href="./signature-pad.css">

<!-- JS 模块（顺序固定，不可调换） -->
<script src="./config.js"></script>
<script src="./utils.js"></script>
<script src="./toast.js"></script>
<script src="./engine.js"></script>
<script src="./ui.js"></script>
```

---

## 方式一：CanvasEngine（直接绑定 canvas）

适合已有自定义 UI 的项目，只需传入一个 `<canvas>` 元素即可获得完整签名能力。

### 基本用法

```html
<canvas id="myCanvas" style="width:100%;height:250px;border:1px solid #ccc;"></canvas>

<script>
  var engine = new CanvasEngine(document.getElementById('myCanvas'), {
    penColor: '#1a1a1a',       // 笔触颜色
    penWidth: 2,               // 基础线宽
    bgColor: '#ffffff',        // 背景色（transparent 为透明）
    velocitySensitive: true,   // 速度感知线宽
    minWidth: 0.5,             // 最细线宽
    maxWidth: 6,               // 最粗线宽
    taperEffect: true,         // 收笔笔锋
    opacityEffect: true,       // 墨迹浓淡
    maxUndoSteps: 20,          // 最大撤销步数
  })
</script>
```

### API 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `engine.getSignatureData()` | `String` 或 `null` | 获取签名 PNG base64 数据 |
| `engine.getSignatureFile()` | `File` 或 `null` | 获取签名 File 对象 |
| `engine.isEmpty()` | `Boolean` | 判断是否有签名内容 |
| `engine.clear()` | `void` | 清空画布 |
| `engine.undo()` | `void` | 撤销上一步 |
| `engine.resize()` | `void` | 重新计算尺寸（响应式） |
| `engine.destroy()` | `void` | 销毁实例 |

### 事件监听

```javascript
engine.on('drawStart', function(pos) {
  console.log('开始绘制', pos)
})

engine.on('draw', function(pos) {
  console.log('绘制中', pos)
})

engine.on('drawEnd', function() {
  console.log('绘制结束')
})

engine.on('contentChange', function(hasContent) {
  console.log('内容变化:', hasContent)
})

engine.on('clear', function() {
  console.log('已清空')
})

// 移除事件
engine.off('drawStart')
engine.off('drawStart', handlerFn)
```

### 完整示例

```html
<canvas id="sig" style="width:100%;height:200px;border:2px dashed #ddd;border-radius:8px;cursor:crosshair;"></canvas>
<div>
  <button onclick="getData()">获取 Base64</button>
  <button onclick="doClear()">清空</button>
  <button onclick="doUndo()">撤销</button>
</div>
<img id="preview" style="display:none;max-width:100%;margin-top:10px;">

<script>
  var engine = new CanvasEngine(document.getElementById('sig'), {
    penColor: '#1a1a1a',
    penWidth: 2,
    bgColor: '#ffffff',
    velocitySensitive: true,
    taperEffect: true,
    opacityEffect: true
  })

  function getData() {
    var data = engine.getSignatureData()
    if (!data) { alert('请先签名'); return }
    var img = document.getElementById('preview')
    img.src = data
    img.style.display = 'block'
  }

  function doClear() { engine.clear() }
  function doUndo() { engine.undo() }
</script>
```

---

## 方式二：SignaturePad（全屏弹窗面板）

开箱即用的完整签名解决方案，包含遮罩层、工具栏、状态栏、上传功能。

### 基本用法

```javascript
var pad = new SignaturePad({
  // 画布尺寸
  width: 700,
  height: 300,

  // 笔触样式
  penColor: '#1a1a1a',
  penWidth: 2,
  bgColor: '#ffffff',

  // 界面文字
  placeholder: '请在此处签名',
  title: '手写签名',

  // 上传配置
  uploadUrl: 'https://api.example.com/upload',
  uploadFieldName: 'signature',
  uploadHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  uploadExtraData: { type: 'signature', userId: '123' },

  // 自动上传
  autoUpload: true,

  // 显示撤销按钮
  showUndo: true,

  // 手写仿真
  velocitySensitive: true,
  minWidth: 0.5,
  maxWidth: 6,
  taperEffect: true,
  opacityEffect: true,

  // 回调
  onSave: function(base64DataURL, file) {
    console.log('签名已保存', file)
  },
  onUpload: function(response, base64DataURL, file) {
    console.log('上传成功', response)
  },
  onUploadError: function(error, xhr) {
    console.error('上传失败', error)
  },
  onClose: function() {
    console.log('面板已关闭')
  },
  onClear: function() {
    console.log('已清空')
  }
})

// 打开签名面板
pad.open()
```

### API 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `pad.open()` | `void` | 打开签名面板 |
| `pad.close()` | `void` | 关闭签名面板 |
| `pad.save()` | `void` | 保存签名（触发回调 + 自动上传） |
| `pad.clear()` | `void` | 清空画布 |
| `pad.undo()` | `void` | 撤销上一步 |
| `pad.getSignatureData()` | `String` 或 `null` | 获取 base64 数据 |
| `pad.getSignatureFile()` | `File` 或 `null` | 获取 File 对象 |
| `pad.isEmpty()` | `Boolean` | 判断是否有签名内容 |
| `pad.getEngine()` | `CanvasEngine` | 获取底层引擎实例 |
| `pad.destroy()` | `void` | 销毁实例 |

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Esc` | 关闭面板 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + S` | 保存 |

---

## 配置项参考

### CanvasEngine 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `penColor` | String | `'#1a1a1a'` | 笔触颜色 |
| `penWidth` | Number | `2` | 基础线宽 |
| `bgColor` | String | `'transparent'` | 背景色 |
| `maxUndoSteps` | Number | `20` | 最大撤销步数 |
| `velocitySensitive` | Boolean | `true` | 速度感知线宽 |
| `minWidth` | Number | `0.5` | 最细线宽（快速移动） |
| `maxWidth` | Number | `6` | 最粗线宽（慢速移动） |
| `taperEffect` | Boolean | `true` | 收笔笔锋 |
| `taperLength` | Number | `8` | 笔锋长度（像素） |
| `opacityEffect` | Boolean | `true` | 墨迹浓淡 |
| `minOpacity` | Number | `0.6` | 最淡墨迹 |
| `maxOpacity` | Number | `1.0` | 最浓墨迹 |

### SignaturePad 额外配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | Number | `700` | 画布逻辑宽度 |
| `height` | Number | `300` | 画布逻辑高度 |
| `placeholder` | String | `'请在此处签名'` | 占位提示文字 |
| `title` | String | `'手写签名'` | 面板标题 |
| `uploadUrl` | String | `''` | 上传接口地址 |
| `uploadFieldName` | String | `'file'` | 上传字段名 |
| `uploadHeaders` | Object | `{}` | 上传自定义请求头 |
| `uploadExtraData` | Object | `{}` | 上传额外参数 |
| `autoUpload` | Boolean | `true` | 是否自动上传 |
| `showUndo` | Boolean | `true` | 是否显示撤销按钮 |
| `responsive` | Boolean | `true` | 是否响应式适配 |
| `onSave` | Function | `null` | 保存回调 |
| `onUpload` | Function | `null` | 上传成功回调 |
| `onUploadError` | Function | `null` | 上传失败回调 |
| `onClose` | Function | `null` | 关闭回调 |
| `onClear` | Function | `null` | 清空回调 |

---

## 独立模块使用

每个模块都可以独立使用：

### SignatureToast（消息提示）

```javascript
SignatureToast.success('操作成功')
SignatureToast.error('操作失败')
SignatureToast.warning('请先完成签名')
SignatureToast.info('提示信息')
```

### SignatureUtils（工具函数）

```javascript
// 坐标计算
var pos = SignatureUtils.getMousePos(canvas, event)
var pos = SignatureUtils.getTouchPos(canvas, touch)
var pos = SignatureUtils.getPointerPos(canvas, event)

// 对象合并
var obj = SignatureUtils.extend({a:1}, {b:2}, {c:3})

// 数值限定
var n = SignatureUtils.clamp(value, 0, 100)

// base64 转 File
var file = SignatureUtils.dataURLToFile(dataURL, 'image.png')

// 创建按钮
var btn = SignatureUtils.createButton('保存', 'my-btn-class', function() {})
```

### SignatureConfig（配置常量）

```javascript
// 引擎默认配置
SignatureConfig.ENGINE.penColor     // '#1a1a1a'
SignatureConfig.ENGINE.penWidth     // 2

// UI 默认配置
SignatureConfig.UI.width            // 700
SignatureConfig.UI.placeholder      // '请在此处签名'
```

---

## 浏览器兼容性

| 特性 | 兼容性 |
|------|--------|
| Canvas API | IE 9+ |
| Pointer Events | IE 11+, Edge, Chrome, Firefox, Safari 13+ |
| Touch Events | iOS Safari, Android Chrome |
| File API | IE 10+ |
| UMD 模块 | 所有现代浏览器 |

---

## 许可证

MIT