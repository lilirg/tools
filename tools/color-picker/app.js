/**
 * Color Picker - UI 交互层
 * 处理所有 UI 交互、Canvas 绘制、事件绑定、历史记录管理
 *
 * 依赖: ColorConfig, ColorUtils, PaletteEngine
 */
;(function (global) {
  'use strict'

  var Config = global.ColorConfig
  var ColorUtils = global.ColorUtils
  var PaletteEngine = global.PaletteEngine

  // ============================================
  // Toast 提示
  // ============================================
  var CPToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'cp-toast cp-toast-' + type
      toast.textContent = message
      document.body.appendChild(toast)

      setTimeout(function () { toast.classList.add('show') }, 10)
      setTimeout(function () {
        toast.classList.remove('show')
        toast.classList.add('hide')
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast)
        }, 300)
      }, 2500)
    },
    success: function (msg) { this.show(msg, 'success') },
    error: function (msg) { this.show(msg, 'error') },
    warning: function (msg) { this.show(msg, 'warning') },
    info: function (msg) { this.show(msg, 'info') }
  }

  // ============================================
  // 历史记录管理
  // ============================================
  var HistoryManager = {
    _key: Config.STORAGE_KEYS.history,
    _items: [],

    load: function () {
      try {
        var data = localStorage.getItem(this._key)
        this._items = data ? JSON.parse(data) : []
      } catch (e) {
        this._items = []
      }
      return this._items
    },

    save: function () {
      try {
        localStorage.setItem(this._key, JSON.stringify(this._items))
      } catch (e) {}
    },

    add: function (record) {
      this.load()
      record.time = Date.now()
      this._items.unshift(record)
      if (this._items.length > Config.MAX_HISTORY) {
        this._items = this._items.slice(0, Config.MAX_HISTORY)
      }
      this.save()
    },

    remove: function (index) {
      this.load()
      if (index >= 0 && index < this._items.length) {
        this._items.splice(index, 1)
        this.save()
      }
    },

    getAll: function () {
      this.load()
      return this._items
    },

    clear: function () {
      this._items = []
      this.save()
    }
  }

  // ============================================
  // 收藏管理
  // ============================================
  var FavoriteManager = {
    _key: Config.STORAGE_KEYS.favorites,
    _items: [],

    load: function () {
      try {
        var data = localStorage.getItem(this._key)
        this._items = data ? JSON.parse(data) : []
      } catch (e) {
        this._items = []
      }
      return this._items
    },

    save: function () {
      try {
        localStorage.setItem(this._key, JSON.stringify(this._items))
      } catch (e) {}
    },

    add: function (color) {
      this.load()
      // 检查是否已存在
      for (var i = 0; i < this._items.length; i++) {
        if (this._items[i].hex === color.hex) {
          CPToast.warning('该颜色已在收藏中')
          return false
        }
      }
      if (this._items.length >= Config.MAX_FAVORITES) {
        CPToast.warning('收藏已满（最多 ' + Config.MAX_FAVORITES + ' 个）')
        return false
      }
      color.time = Date.now()
      this._items.unshift(color)
      this.save()
      return true
    },

    remove: function (index) {
      this.load()
      if (index >= 0 && index < this._items.length) {
        this._items.splice(index, 1)
        this.save()
      }
    },

    getAll: function () {
      this.load()
      return this._items
    },

    clear: function () {
      this._items = []
      this.save()
    }
  }

  // ============================================
  // 颜色选择器主应用
  // ============================================
  function ColorPickerApp() {
    this._init()
  }

  ColorPickerApp.prototype = {
    constructor: ColorPickerApp,

    // ===== 当前颜色状态 =====
    _currentColor: { r: 22, g: 119, b: 255 }, // 默认蓝色
    _currentHue: 217,
    _currentSaturation: 100,
    _currentValue: 100,
    _isDraggingHue: false,
    _isDraggingPanel: false,

    _init: function () {
      this._cacheDOM()
      this._initTabs()
      this._initCanvas()
      this._initPresetColors()
      this._initPaletteTypes()
      this._initColorFormats()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
      this._loadFavorites()
      this._updateAll()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // Tab 相关
        tabBtns: document.querySelectorAll('.cp-tab-btn'),
        tabContents: document.querySelectorAll('.cp-tab-content'),

        // Canvas
        hueCanvas: document.getElementById('hueCanvas'),
        panelCanvas: document.getElementById('panelCanvas'),

        // 颜色预览
        colorPreview: document.getElementById('colorPreview'),
        colorHex: document.getElementById('colorHex'),
        colorRgb: document.getElementById('colorRgb'),
        colorHsl: document.getElementById('colorHsl'),
        colorHsv: document.getElementById('colorHsv'),

        // 颜色格式选择
        formatSelect: document.getElementById('formatSelect'),

        // 颜色值输入
        colorInput: document.getElementById('colorInput'),
        applyColorBtn: document.getElementById('applyColorBtn'),

        // 预设颜色
        presetColors: document.getElementById('presetColors'),

        // 调色板
        paletteType: document.getElementById('paletteType'),
        paletteCount: document.getElementById('paletteCount'),
        paletteGrid: document.getElementById('paletteGrid'),

        // 对比度检测
        contrastColor1: document.getElementById('contrastColor1'),
        contrastColor2: document.getElementById('contrastColor2'),
        contrastRatio: document.getElementById('contrastRatio'),
        contrastResult: document.getElementById('contrastResult'),

        // 图片取色
        imageUpload: document.getElementById('imageUpload'),
        imageCanvas: document.getElementById('imageCanvas'),
        imageColors: document.getElementById('imageColors'),
        extractColorsBtn: document.getElementById('extractColorsBtn'),

        // 收藏
        favoriteBtn: document.getElementById('favoriteBtn'),
        favoritesList: document.getElementById('favoritesList'),
        clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // Tab 切换
    // ============================================
    _initTabs: function () {
      var self = this
      var tabs = this.$.tabBtns
      var contents = this.$.tabContents

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) { t.classList.remove('active') })
          contents.forEach(function (c) { c.classList.remove('active') })

          tab.classList.add('active')
          if (contents[index]) contents[index].classList.add('active')
        })
      })
    },

    // ============================================
    // Canvas 初始化
    // ============================================
    _initCanvas: function () {
      this._initHueBar()
      this._initSaturationPanel()
    },

    _initHueBar: function () {
      var canvas = this.$.hueCanvas
      if (!canvas) return

      var ctx = canvas.getContext('2d')
      var width = canvas.width
      var height = canvas.height

      // 绘制色相渐变条
      var gradient = ctx.createLinearGradient(0, 0, width, 0)
      var hueColors = Config.HUE_GRADIENT_COLORS
      var step = 1 / (hueColors.length - 1)

      for (var i = 0; i < hueColors.length; i++) {
        gradient.addColorStop(i * step, hueColors[i])
      }

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // 边框
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, width, height)
    },

    _initSaturationPanel: function () {
      this._drawSaturationPanel()
    },

    _drawSaturationPanel: function () {
      var canvas = this.$.panelCanvas
      if (!canvas) return

      var ctx = canvas.getContext('2d')
      var width = canvas.width
      var height = canvas.height
      var hue = this._currentHue

      // 水平渐变：白到纯色
      var hueRgb = ColorUtils.hsvToRgb(hue, 100, 100)
      var horizontalGradient = ctx.createLinearGradient(0, 0, width, 0)
      horizontalGradient.addColorStop(0, '#FFFFFF')
      horizontalGradient.addColorStop(1, ColorUtils.rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b))
      ctx.fillStyle = horizontalGradient
      ctx.fillRect(0, 0, width, height)

      // 垂直渐变：透明到黑
      var verticalGradient = ctx.createLinearGradient(0, 0, 0, height)
      verticalGradient.addColorStop(0, 'rgba(0,0,0,0)')
      verticalGradient.addColorStop(1, '#000000')
      ctx.fillStyle = verticalGradient
      ctx.fillRect(0, 0, width, height)

      // 边框
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, width, height)
    },

    _drawHueIndicator: function () {
      var canvas = this.$.hueCanvas
      if (!canvas) return

      var ctx = canvas.getContext('2d')
      var width = canvas.width
      var height = canvas.height
      var x = (this._currentHue / 360) * width

      // 清除之前的指示器
      this._initHueBar()

      // 绘制指示器
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      // 白色描边
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    },

    _drawPanelIndicator: function () {
      var canvas = this.$.panelCanvas
      if (!canvas) return

      var ctx = canvas.getContext('2d')
      var width = canvas.width
      var height = canvas.height
      var x = (this._currentSaturation / 100) * width
      var y = (1 - this._currentValue / 100) * height

      // 重绘面板
      this._drawSaturationPanel()

      // 绘制指示器（圆形）
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.stroke()
    },

    // ============================================
    // 预设颜色
    // ============================================
    _initPresetColors: function () {
      var container = this.$.presetColors
      if (!container) return

      container.innerHTML = ''
      var self = this

      Config.PRESET_COLORS.forEach(function (hex) {
        var swatch = document.createElement('span')
        swatch.className = 'cp-swatch'
        swatch.style.backgroundColor = hex
        swatch.dataset.color = hex
        swatch.title = hex
        swatch.addEventListener('click', function () {
          self._setColorFromHex(hex)
        })
        container.appendChild(swatch)
      })
    },

    // ============================================
    // 调色板类型
    // ============================================
    _initPaletteTypes: function () {
      var select = this.$.paletteType
      if (!select) return

      select.innerHTML = ''
      Config.PALETTE_TYPES.forEach(function (type) {
        var option = document.createElement('option')
        option.value = type.value
        option.textContent = type.icon + ' ' + type.label
        select.appendChild(option)
      })
    },

    // ============================================
    // 颜色格式
    // ============================================
    _initColorFormats: function () {
      var select = this.$.formatSelect
      if (!select) return

      select.innerHTML = ''
      Config.COLOR_FORMATS.forEach(function (fmt) {
        var option = document.createElement('option')
        option.value = fmt.value
        option.textContent = fmt.label
        select.appendChild(option)
      })
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        var lastColor = localStorage.getItem(Config.STORAGE_KEYS.lastColor)
        if (lastColor) {
          this._setColorFromHex(lastColor)
        }

        var lastFormat = localStorage.getItem(Config.STORAGE_KEYS.lastFormat)
        if (lastFormat && this.$.formatSelect) {
          this.$.formatSelect.value = lastFormat
        }

        var lastPaletteType = localStorage.getItem(Config.STORAGE_KEYS.lastPaletteType)
        if (lastPaletteType && this.$.paletteType) {
          this.$.paletteType.value = lastPaletteType
        }
      } catch (e) {}
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 色相条拖拽 =====
      if (this.$.hueCanvas) {
        this.$.hueCanvas.addEventListener('mousedown', function (e) {
          self._isDraggingHue = true
          self._updateHueFromEvent(e)
        })

        document.addEventListener('mousemove', function (e) {
          if (self._isDraggingHue) {
            self._updateHueFromEvent(e)
          }
          if (self._isDraggingPanel) {
            self._updatePanelFromEvent(e)
          }
        })

        document.addEventListener('mouseup', function () {
          self._isDraggingHue = false
          self._isDraggingPanel = false
        })

        // 触控支持
        this.$.hueCanvas.addEventListener('touchstart', function (e) {
          e.preventDefault()
          self._isDraggingHue = true
          self._updateHueFromEvent(e.touches[0])
        })

        this.$.hueCanvas.addEventListener('touchmove', function (e) {
          e.preventDefault()
          if (self._isDraggingHue) {
            self._updateHueFromEvent(e.touches[0])
          }
        })

        this.$.hueCanvas.addEventListener('touchend', function () {
          self._isDraggingHue = false
        })
      }

      // ===== 饱和度/亮度面板拖拽 =====
      if (this.$.panelCanvas) {
        this.$.panelCanvas.addEventListener('mousedown', function (e) {
          self._isDraggingPanel = true
          self._updatePanelFromEvent(e)
        })

        // 触控支持
        this.$.panelCanvas.addEventListener('touchstart', function (e) {
          e.preventDefault()
          self._isDraggingPanel = true
          self._updatePanelFromEvent(e.touches[0])
        })

        this.$.panelCanvas.addEventListener('touchmove', function (e) {
          e.preventDefault()
          if (self._isDraggingPanel) {
            self._updatePanelFromEvent(e.touches[0])
          }
        })

        this.$.panelCanvas.addEventListener('touchend', function () {
          self._isDraggingPanel = false
        })
      }

      // ===== 颜色值输入 =====
      if (this.$.colorInput) {
        this.$.colorInput.addEventListener('change', function () {
          self._applyColorInput()
        })
        this.$.colorInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            self._applyColorInput()
          }
        })
      }

      if (this.$.applyColorBtn) {
        this.$.applyColorBtn.addEventListener('click', function () {
          self._applyColorInput()
        })
      }

      // ===== 格式切换 =====
      if (this.$.formatSelect) {
        this.$.formatSelect.addEventListener('change', function () {
          self._updateColorInput()
          self._saveState()
        })
      }

      // ===== 调色板类型切换 =====
      if (this.$.paletteType) {
        this.$.paletteType.addEventListener('change', function () {
          self._generatePalette()
          self._saveState()
        })
      }

      // ===== 调色板数量 =====
      if (this.$.paletteCount) {
        this.$.paletteCount.addEventListener('change', function () {
          self._generatePalette()
        })
      }

      // ===== 收藏按钮 =====
      if (this.$.favoriteBtn) {
        this.$.favoriteBtn.addEventListener('click', function () {
          self._toggleFavorite()
        })
      }

      // ===== 清空收藏 =====
      if (this.$.clearFavoritesBtn) {
        this.$.clearFavoritesBtn.addEventListener('click', function () {
          FavoriteManager.clear()
          self._loadFavorites()
          CPToast.success('收藏已清空')
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          CPToast.success('历史记录已清空')
        })
      }

      // ===== 对比度检测 =====
      if (this.$.contrastColor1) {
        this.$.contrastColor1.addEventListener('input', function () {
          self._updateContrast()
        })
      }
      if (this.$.contrastColor2) {
        this.$.contrastColor2.addEventListener('input', function () {
          self._updateContrast()
        })
      }

      // ===== 图片取色 =====
      if (this.$.extractColorsBtn) {
        this.$.extractColorsBtn.addEventListener('click', function () {
          self.$.imageUpload.click()
        })
      }
      if (this.$.imageUpload) {
        this.$.imageUpload.addEventListener('change', function (e) {
          self._extractColorsFromImage(e)
        })
      }
    },

    // ============================================
    // 色相更新
    // ============================================
    _updateHueFromEvent: function (e) {
      var canvas = this.$.hueCanvas
      var rect = canvas.getBoundingClientRect()
      var x = e.clientX - rect.left
      var width = canvas.width

      x = ColorUtils.clamp(x, 0, width)
      this._currentHue = Math.round((x / width) * 360)

      this._drawHueIndicator()
      this._drawSaturationPanel()
      this._updateColorFromHSV()
    },

    // ============================================
    // 面板更新
    // ============================================
    _updatePanelFromEvent: function (e) {
      var canvas = this.$.panelCanvas
      var rect = canvas.getBoundingClientRect()
      var x = e.clientX - rect.left
      var y = e.clientY - rect.top
      var width = canvas.width
      var height = canvas.height

      x = ColorUtils.clamp(x, 0, width)
      y = ColorUtils.clamp(y, 0, height)

      this._currentSaturation = Math.round((x / width) * 100)
      this._currentValue = Math.round((1 - y / height) * 100)

      this._drawPanelIndicator()
      this._updateColorFromHSV()
    },

    // ============================================
    // 从 HSV 更新颜色
    // ============================================
    _updateColorFromHSV: function () {
      var rgb = ColorUtils.hsvToRgb(
        this._currentHue,
        this._currentSaturation,
        this._currentValue
      )

      this._currentColor = rgb
      this._updateAll()
    },

    // ============================================
    // 从 HEX 设置颜色
    // ============================================
    _setColorFromHex: function (hex) {
      var rgb = ColorUtils.hexToRgb(hex)
      if (!rgb) return

      this._currentColor = rgb
      var hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b)
      this._currentHue = hsv.h
      this._currentSaturation = hsv.s
      this._currentValue = hsv.v

      this._drawHueIndicator()
      this._drawSaturationPanel()
      this._drawPanelIndicator()
      this._updateAll()
    },

    // ============================================
    // 应用颜色输入
    // ============================================
    _applyColorInput: function () {
      var input = this.$.colorInput.value.trim()
      if (!input) return

      var rgb = ColorUtils.parseColor(input)
      if (rgb) {
        this._setColorFromHex(ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b))
        CPToast.success('颜色已应用')
      } else {
        CPToast.error('无法识别颜色格式')
      }
    },

    // ============================================
    // 更新所有 UI
    // ============================================
    _updateAll: function () {
      var c = this._currentColor
      var hex = ColorUtils.rgbToHex(c.r, c.g, c.b)

      // 更新预览
      if (this.$.colorPreview) {
        this.$.colorPreview.style.backgroundColor = hex
      }

      // 更新颜色值显示
      if (this.$.colorHex) this.$.colorHex.textContent = hex
      if (this.$.colorRgb) {
        this.$.colorRgb.textContent = 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'
      }

      var hsl = ColorUtils.rgbToHsl(c.r, c.g, c.b)
      if (this.$.colorHsl) {
        this.$.colorHsl.textContent = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
      }

      if (this.$.colorHsv) {
        this.$.colorHsv.textContent = 'hsv(' + this._currentHue + ', ' + this._currentSaturation + '%, ' + this._currentValue + '%)'
      }

      // 更新输入框
      this._updateColorInput()

      // 更新调色板
      this._generatePalette()

      // 更新对比度
      this._updateContrast()

      // 保存状态
      this._saveState()
    },

    // ============================================
    // 更新颜色输入框
    // ============================================
    _updateColorInput: function () {
      if (!this.$.colorInput || !this.$.formatSelect) return

      var format = this.$.formatSelect.value
      var c = this._currentColor
      this.$.colorInput.value = ColorUtils.formatColor(c.r, c.g, c.b, format)
    },

    // ============================================
    // 生成调色板
    // ============================================
    _generatePalette: function () {
      var grid = this.$.paletteGrid
      if (!grid) return

      var type = this.$.paletteType ? this.$.paletteType.value : 'complementary'
      var count = this.$.paletteCount ? parseInt(this.$.paletteCount.value, 10) : 5
      var hex = ColorUtils.rgbToHex(this._currentColor.r, this._currentColor.g, this._currentColor.b)

      var colors = PaletteEngine.generatePalette(type, hex, count)
      var self = this

      grid.innerHTML = ''
      colors.forEach(function (color) {
        var item = document.createElement('div')
        item.className = 'cp-palette-item'

        var swatch = document.createElement('div')
        swatch.className = 'cp-palette-swatch'
        swatch.style.backgroundColor = color.hex
        swatch.title = color.hex + ' (点击复制)'
        swatch.addEventListener('click', function () {
          self._copyText(color.hex, '颜色 ' + color.hex + ' 已复制')
        })

        var label = document.createElement('div')
        label.className = 'cp-palette-label'
        label.textContent = color.name

        var value = document.createElement('div')
        value.className = 'cp-palette-value'
        value.textContent = color.hex

        item.appendChild(swatch)
        item.appendChild(label)
        item.appendChild(value)
        grid.appendChild(item)
      })
    },

    // ============================================
    // 对比度检测
    // ============================================
    _updateContrast: function () {
      if (!this.$.contrastColor1 || !this.$.contrastColor2) return

      var hex1 = this.$.contrastColor1.value
      var hex2 = this.$.contrastColor2.value

      if (!ColorUtils.isValidHex(hex1) || !ColorUtils.isValidHex(hex2)) {
        if (this.$.contrastRatio) this.$.contrastRatio.textContent = '—'
        if (this.$.contrastResult) this.$.contrastResult.innerHTML = '请输入有效的 HEX 颜色值'
        return
      }

      var ratio = ColorUtils.getContrastRatio(hex1, hex2)
      var wcag = ColorUtils.checkWCAG(ratio)

      if (this.$.contrastRatio) {
        this.$.contrastRatio.textContent = ratio.toFixed(2) + ':1'
      }

      if (this.$.contrastResult) {
        var html = ''
        html += '<div class="' + (wcag.AA ? 'pass' : 'fail') + '">AA 标准（普通文本）: ' + (wcag.AA ? '✅ 通过' : '❌ 未通过') + ' (≥4.5:1)</div>'
        html += '<div class="' + (wcag.AAA ? 'pass' : 'fail') + '">AAA 标准（增强文本）: ' + (wcag.AAA ? '✅ 通过' : '❌ 未通过') + ' (≥7:1)</div>'
        html += '<div class="' + (wcag.AALarge ? 'pass' : 'fail') + '">AA 标准（大文本）: ' + (wcag.AALarge ? '✅ 通过' : '❌ 未通过') + ' (≥3:1)</div>'
        this.$.contrastResult.innerHTML = html
      }
    },

    // ============================================
    // 图片取色
    // ============================================
    _extractColorsFromImage: function (e) {
      var self = this
      var file = e.target.files[0]
      if (!file) return

      var reader = new FileReader()
      reader.onload = function (event) {
        var img = new Image()
        img.onload = function () {
          var canvas = self.$.imageCanvas
          if (!canvas) return

          var ctx = canvas.getContext('2d')
          var maxWidth = 300
          var scale = Math.min(1, maxWidth / img.width)
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          var colors = ColorUtils.extractColorsFromImage(imageData, 8)

          self._renderImageColors(colors)
          CPToast.success('颜色提取完成')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    },

    _renderImageColors: function (colors) {
      var container = this.$.imageColors
      if (!container) return

      var self = this
      container.innerHTML = ''

      colors.forEach(function (color) {
        var item = document.createElement('div')
        item.className = 'cp-extracted-color'

        var swatch = document.createElement('div')
        swatch.className = 'cp-extracted-swatch'
        swatch.style.backgroundColor = color.hex
        swatch.title = color.hex + ' (' + Math.round(color.ratio * 100) + '%)'
        swatch.addEventListener('click', function () {
          self._setColorFromHex(color.hex)
          CPToast.success('已切换到颜色 ' + color.hex)
        })

        var info = document.createElement('div')
        info.className = 'cp-extracted-info'
        info.innerHTML = '<span class="cp-extracted-hex">' + color.hex + '</span>' +
          '<span class="cp-extracted-ratio">' + Math.round(color.ratio * 100) + '%</span>'

        item.appendChild(swatch)
        item.appendChild(info)
        container.appendChild(item)
      })
    },

    // ============================================
    // 收藏功能
    // ============================================
    _toggleFavorite: function () {
      var hex = ColorUtils.rgbToHex(
        this._currentColor.r,
        this._currentColor.g,
        this._currentColor.b
      )

      var success = FavoriteManager.add({
        hex: hex,
        name: '颜色 ' + hex
      })

      if (success) {
        this._loadFavorites()
        CPToast.success('已收藏 ' + hex)
      }
    },

    _loadFavorites: function () {
      var container = this.$.favoritesList
      if (!container) return

      var items = FavoriteManager.getAll()
      var self = this

      if (items.length === 0) {
        container.innerHTML = '<span class="cp-empty">暂无收藏</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'cp-fav-item'

        var swatch = document.createElement('span')
        swatch.className = 'cp-fav-swatch'
        swatch.style.backgroundColor = item.hex
        swatch.title = item.hex + ' (点击使用)'
        swatch.addEventListener('click', function () {
          self._setColorFromHex(item.hex)
        })

        var label = document.createElement('span')
        label.className = 'cp-fav-label'
        label.textContent = item.hex

        var removeBtn = document.createElement('button')
        removeBtn.className = 'cp-fav-remove'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          FavoriteManager.remove(index)
          self._loadFavorites()
        })

        div.appendChild(swatch)
        div.appendChild(label)
        div.appendChild(removeBtn)
        container.appendChild(div)
      })
    },

    // ============================================
    // 复制文本
    // ============================================
    _copyText: function (text, successMsg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          CPToast.success(successMsg || '已复制到剪贴板')
        }).catch(function () {
          this._fallbackCopy(text, successMsg)
        }.bind(this))
      } else {
        this._fallbackCopy(text, successMsg)
      }
    },

    _fallbackCopy: function (text, successMsg) {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        CPToast.success(successMsg || '已复制到剪贴板')
      } catch (e) {
        CPToast.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    },

    // ============================================
    // 保存状态
    // ============================================
    _saveState: function () {
      try {
        var hex = ColorUtils.rgbToHex(
          this._currentColor.r,
          this._currentColor.g,
          this._currentColor.b
        )
        localStorage.setItem(Config.STORAGE_KEYS.lastColor, hex)
        if (this.$.formatSelect) {
          localStorage.setItem(Config.STORAGE_KEYS.lastFormat, this.$.formatSelect.value)
        }
        if (this.$.paletteType) {
          localStorage.setItem(Config.STORAGE_KEYS.lastPaletteType, this.$.paletteType.value)
        }
      } catch (e) {}
    },

    // ============================================
    // 历史记录
    // ============================================
    _loadHistory: function () {
      var items = HistoryManager.getAll()
      var container = this.$.historyList
      var self = this

      if (!container) return

      if (items.length === 0) {
        container.innerHTML = '<span class="cp-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'cp-history-item'

        var swatch = document.createElement('span')
        swatch.className = 'cp-history-swatch'
        swatch.style.backgroundColor = item.hex
        swatch.addEventListener('click', function () {
          self._setColorFromHex(item.hex)
        })

        var label = document.createElement('span')
        label.className = 'cp-history-label'
        label.textContent = item.hex

        var removeBtn = document.createElement('button')
        removeBtn.className = 'cp-history-remove'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          HistoryManager.remove(index)
          self._loadHistory()
        })

        div.appendChild(swatch)
        div.appendChild(label)
        div.appendChild(removeBtn)
        container.appendChild(div)
      })
    }
  }

  // ============================================
  // 初始化
  // ============================================
  global.ColorPickerApp = ColorPickerApp

  document.addEventListener('DOMContentLoaded', function () {
    global._colorPickerApp = new ColorPickerApp()
  })

})(typeof window !== 'undefined' ? window : this)