/**
 * QRCode Generator - 主应用逻辑
 * 处理 UI 交互、二维码生成、下载等功能
 *
 * 依赖: QRConfig, QRCode
 */
;(function (global) {
  'use strict'

  var Config = global.QRConfig
  var QRCode = global.QRCode

  // ============================================
  // Toast 提示
  // ============================================
  var QRToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'qr-toast qr-toast-' + type
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
    _key: 'qrcode_history',
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
      } catch (e) {
        // 存储空间不足时忽略
      }
    },

    add: function (text, dataURL) {
      this.load()
      // 检查是否已存在相同内容
      var exists = this._items.some(function (item) { return item.text === text })
      if (exists) return

      this._items.unshift({ text: text, dataURL: dataURL, time: Date.now() })
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
  // 二维码生成器主类
  // ============================================
  function QRGenerator() {
    this._qr = null
    this._currentDataURL = null
    this._currentSVG = null
    this._logoDataURL = null

    this._init()
  }

  QRGenerator.prototype = {
    constructor: QRGenerator,

    _init: function () {
      this._cacheDOM()
      this._initPresetColors()
      this._bindEvents()
      this._loadHistory()
      this._generate()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        input: document.getElementById('qrInput'),
        canvas: document.getElementById('qrCanvas'),
        placeholder: document.getElementById('qrPlaceholder'),
        eccSelect: document.getElementById('eccSelect'),
        sizeSlider: document.getElementById('sizeSlider'),
        sizeValue: document.getElementById('sizeValue'),
        fgColor: document.getElementById('fgColor'),
        fgColorText: document.getElementById('fgColorText'),
        bgColor: document.getElementById('bgColor'),
        bgColorText: document.getElementById('bgColorText'),
        presetColors: document.getElementById('presetColors'),
        logoUpload: document.getElementById('logoUpload'),
        logoUploadArea: document.getElementById('logoUploadArea'),
        logoPreview: document.getElementById('logoPreview'),
        logoRemoveBtn: document.getElementById('logoRemoveBtn'),
        downloadActions: document.getElementById('downloadActions'),
        downloadPng: document.getElementById('downloadPngBtn'),
        downloadSvg: document.getElementById('downloadSvgBtn'),
        copyBase64: document.getElementById('copyBase64Btn'),
        qrInfo: document.getElementById('qrInfo'),
        qrVersion: document.getElementById('qrVersion'),
        qrEcc: document.getElementById('qrEcc'),
        qrSize: document.getElementById('qrSize'),
        qrSize2: document.getElementById('qrSize2'),
        advancedToggle: document.getElementById('advancedToggle'),
        advancedOptions: document.getElementById('advancedOptions'),
        dotStyle: document.getElementById('dotStyle'),
        cornerStyle: document.getElementById('cornerStyle'),
        gradientToggle: document.getElementById('gradientToggle'),
        gradientColors: document.getElementById('gradientColors'),
        gradientStart: document.getElementById('gradientStart'),
        gradientStartText: document.getElementById('gradientStartText'),
        gradientEnd: document.getElementById('gradientEnd'),
        gradientEndText: document.getElementById('gradientEndText'),
        historyList: document.getElementById('historyList')
      }
    },

    // ============================================
    // 预设颜色
    // ============================================
    _initPresetColors: function () {
      var container = this.$.presetColors
      var self = this

      Config.PRESET_COLORS.forEach(function (preset, index) {
        var btn = document.createElement('button')
        btn.className = 'preset-color-btn' + (index === 0 ? ' active' : '')
        btn.style.background = 'linear-gradient(135deg, ' + preset.fg + ' 50%, ' + preset.bg + ' 50%)'
        btn.title = preset.name
        btn.dataset.index = index

        var label = document.createElement('span')
        label.className = 'color-label'
        label.textContent = preset.name
        btn.appendChild(label)

        btn.addEventListener('click', function () {
          self.$.fgColor.value = preset.fg
          self.$.fgColorText.value = preset.fg
          self.$.bgColor.value = preset.bg
          self.$.bgColorText.value = preset.bg

          container.querySelectorAll('.preset-color-btn').forEach(function (b) {
            b.classList.remove('active')
          })
          btn.classList.add('active')

          self._generate()
        })

        container.appendChild(btn)
      })
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // 输入内容 - 防抖
      var inputTimer
      this.$.input.addEventListener('input', function () {
        clearTimeout(inputTimer)
        inputTimer = setTimeout(function () { self._generate() }, 300)
      })

      // 纠错等级
      this.$.eccSelect.addEventListener('change', function () { self._generate() })

      // 尺寸滑块
      this.$.sizeSlider.addEventListener('input', function () {
        self.$.sizeValue.textContent = this.value
        self._generate()
      })

      // 前景色
      this.$.fgColor.addEventListener('input', function () {
        self.$.fgColorText.value = this.value
        self._clearPresetActive()
        self._generate()
      })
      this.$.fgColorText.addEventListener('change', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
          self.$.fgColor.value = this.value
          self._clearPresetActive()
          self._generate()
        }
      })

      // 背景色
      this.$.bgColor.addEventListener('input', function () {
        self.$.bgColorText.value = this.value
        self._clearPresetActive()
        self._generate()
      })
      this.$.bgColorText.addEventListener('change', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
          self.$.bgColor.value = this.value
          self._clearPresetActive()
          self._generate()
        }
      })

      // Logo 上传
      this.$.logoUpload.addEventListener('change', function (e) {
        var file = e.target.files[0]
        if (!file) return

        var reader = new FileReader()
        reader.onload = function (ev) {
          self._logoDataURL = ev.target.result
          self.$.logoPreview.src = self._logoDataURL
          self.$.logoUploadArea.classList.add('has-logo')
          self._generate()
        }
        reader.readAsDataURL(file)
      })

      // Logo 移除
      this.$.logoRemoveBtn.addEventListener('click', function () {
        self._logoDataURL = null
        self.$.logoUpload.value = ''
        self.$.logoUploadArea.classList.remove('has-logo')
        self.$.logoPreview.src = ''
        self._generate()
      })

      // 下载 PNG
      this.$.downloadPng.addEventListener('click', function () {
        self._downloadPNG()
      })

      // 下载 SVG
      this.$.downloadSvg.addEventListener('click', function () {
        self._downloadSVG()
      })

      // 复制 Base64
      this.$.copyBase64.addEventListener('click', function () {
        self._copyBase64()
      })

      // 高级选项切换
      this.$.advancedToggle.addEventListener('click', function () {
        var isShow = self.$.advancedOptions.classList.toggle('show')
        self.$.advancedToggle.querySelector('span:last-child').style.transform = isShow ? 'rotate(180deg)' : ''
      })

      // 渐变色切换
      this.$.gradientToggle.addEventListener('change', function () {
        self.$.gradientColors.style.display = this.checked ? 'block' : 'none'
        self._generate()
      })

      this.$.gradientStart.addEventListener('input', function () {
        self.$.gradientStartText.value = this.value
        self._generate()
      })
      this.$.gradientStartText.addEventListener('change', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
          self.$.gradientStart.value = this.value
          self._generate()
        }
      })

      this.$.gradientEnd.addEventListener('input', function () {
        self.$.gradientEndText.value = this.value
        self._generate()
      })
      this.$.gradientEndText.addEventListener('change', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
          self.$.gradientEnd.value = this.value
          self._generate()
        }
      })

      // 点样式 / 角样式
      this.$.dotStyle.addEventListener('change', function () { self._generate() })
      this.$.cornerStyle.addEventListener('change', function () { self._generate() })
    },

    // ============================================
    // 清除预设选中状态
    // ============================================
    _clearPresetActive: function () {
      this.$.presetColors.querySelectorAll('.preset-color-btn').forEach(function (b) {
        b.classList.remove('active')
      })
    },

    // ============================================
    // 生成二维码
    // ============================================
    _generate: function () {
      var text = this.$.input.value.trim()
      if (!text) {
        this.$.placeholder.style.display = 'block'
        this.$.canvas.style.display = 'none'
        this.$.downloadActions.style.display = 'none'
        this.$.qrInfo.classList.remove('show')
        return
      }

      try {
        var eccLevel = Config.ECC_MAP[this.$.eccSelect.value]
        var size = parseInt(this.$.sizeSlider.value)
        var fgColor = this.$.fgColor.value
        var bgColor = this.$.bgColor.value

        // 生成二维码矩阵
        this._qr = new QRCode()
        this._qr.generate(text, eccLevel)

        var matrix = this._qr.getMatrix()
        var matrixSize = this._qr.getSize()

        // 渲染到 Canvas
        var canvas = this.$.canvas
        var moduleSize = Math.floor((size - 20) / matrixSize)
        var margin = Math.floor((size - matrixSize * moduleSize) / 2)

        // 计算实际尺寸
        var actualSize = matrixSize * moduleSize + margin * 2
        canvas.width = actualSize
        canvas.height = actualSize

        var ctx = canvas.getContext('2d')

        // 背景
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, actualSize, actualSize)

        // 前景 - 支持渐变
        var useGradient = this.$.gradientToggle.checked
        var fillStyle = fgColor

        if (useGradient) {
          var grad = ctx.createLinearGradient(0, 0, actualSize, actualSize)
          grad.addColorStop(0, this.$.gradientStart.value)
          grad.addColorStop(1, this.$.gradientEnd.value)
          fillStyle = grad
        }

        ctx.fillStyle = fillStyle

        // 点样式
        var dotStyle = this.$.dotStyle.value
        var cornerStyle = this.$.cornerStyle.value

        for (var y = 0; y < matrixSize; y++) {
          for (var x = 0; x < matrixSize; x++) {
            if (matrix[y][x] === 1) {
              var px = margin + x * moduleSize
              var py = margin + y * moduleSize

              // 检查是否是角部探测图形区域
              var isCorner = (y < 7 && x < 7) ||
                             (y < 7 && x >= matrixSize - 7) ||
                             (y >= matrixSize - 7 && x < 7)

              if (isCorner) {
                // 角部使用方形
                ctx.fillRect(px, py, moduleSize, moduleSize)
              } else {
                switch (dotStyle) {
                  case 'rounded':
                    var r = moduleSize * 0.3
                    this._roundRect(ctx, px, py, moduleSize, moduleSize, r)
                    ctx.fill()
                    break
                  case 'diamond':
                    ctx.beginPath()
                    ctx.moveTo(px + moduleSize / 2, py)
                    ctx.lineTo(px + moduleSize, py + moduleSize / 2)
                    ctx.lineTo(px + moduleSize / 2, py + moduleSize)
                    ctx.lineTo(px, py + moduleSize / 2)
                    ctx.closePath()
                    ctx.fill()
                    break
                  default:
                    ctx.fillRect(px, py, moduleSize, moduleSize)
                }
              }
            }
          }
        }

        // 绘制 Logo（同步绘制，因为 dataURL 已加载）
        if (this._logoDataURL) {
          this._drawLogoSync(ctx, actualSize, moduleSize)
        }

        // 显示 Canvas
        canvas.style.display = 'block'
        this.$.placeholder.style.display = 'none'
        this.$.downloadActions.style.display = 'flex'

        // 更新信息
        this.$.qrInfo.classList.add('show')
        this.$.qrVersion.textContent = this._qr.getVersion()
        this.$.qrEcc.textContent = this.$.eccSelect.options[this.$.eccSelect.selectedIndex].text
        this.$.qrSize.textContent = matrixSize
        this.$.qrSize2.textContent = matrixSize

        // 保存数据 URL（在 Logo 绘制之后）
        this._currentDataURL = canvas.toDataURL('image/png')

        // 生成 SVG
        this._currentSVG = this._generateSVG(matrix, matrixSize, moduleSize, margin, fgColor, bgColor, useGradient)

        // 添加到历史记录
        HistoryManager.add(text, this._currentDataURL)
        this._loadHistory()

      } catch (e) {
        console.error('QR 生成失败:', e)
        QRToast.error('生成失败: ' + e.message)
      }
    },

    // ============================================
    // 圆角矩形
    // ============================================
    _roundRect: function (ctx, x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    },

    // ============================================
    // 绘制 Logo（同步方式，使用已加载的 dataURL）
    // ============================================
    _drawLogoSync: function (ctx, canvasSize, moduleSize) {
      var logoSize = Math.min(moduleSize * 6, canvasSize * 0.3)
      var logoX = (canvasSize - logoSize) / 2
      var logoY = (canvasSize - logoSize) / 2

      // 绘制白色背景
      var padding = 4
      ctx.fillStyle = '#ffffff'
      this._roundRect(ctx, logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, 6)
      ctx.fill()

      // 使用 Image 同步绘制
      var img = new Image()
      img.src = this._logoDataURL
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
    },

    // ============================================
    // 生成 SVG
    // ============================================
    _generateSVG: function (matrix, matrixSize, moduleSize, margin, fgColor, bgColor, useGradient) {
      var totalSize = matrixSize * moduleSize + margin * 2

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalSize + '" height="' + totalSize + '" viewBox="0 0 ' + totalSize + ' ' + totalSize + '">'

      // 背景
      svg += '<rect width="100%" height="100%" fill="' + this._escapeXML(bgColor) + '"/>'

      // 前景
      var fill = fgColor
      if (useGradient) {
        var gradId = 'qr-gradient-' + Date.now()
        svg += '<defs><linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">'
        svg += '<stop offset="0%" stop-color="' + this._escapeXML(this.$.gradientStart.value) + '"/>'
        svg += '<stop offset="100%" stop-color="' + this._escapeXML(this.$.gradientEnd.value) + '"/>'
        svg += '</linearGradient></defs>'
        fill = 'url(#' + gradId + ')'
      }

      var dotStyle = this.$.dotStyle.value

      for (var y = 0; y < matrixSize; y++) {
        for (var x = 0; x < matrixSize; x++) {
          if (matrix[y][x] === 1) {
            var px = margin + x * moduleSize
            var py = margin + y * moduleSize

            var isCorner = (y < 7 && x < 7) ||
                           (y < 7 && x >= matrixSize - 7) ||
                           (y >= matrixSize - 7 && x < 7)

            if (isCorner || dotStyle === 'square') {
              svg += '<rect x="' + px + '" y="' + py + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="' + this._escapeXML(fill) + '"/>'
            } else if (dotStyle === 'rounded') {
              var r = moduleSize * 0.3
              svg += '<rect x="' + px + '" y="' + py + '" width="' + moduleSize + '" height="' + moduleSize + '" rx="' + r + '" ry="' + r + '" fill="' + this._escapeXML(fill) + '"/>'
            } else if (dotStyle === 'diamond') {
              var cx = px + moduleSize / 2
              var cy = py + moduleSize / 2
              var hw = moduleSize / 2
              svg += '<polygon points="' + cx + ',' + (cy - hw) + ' ' + (cx + hw) + ',' + cy + ' ' + cx + ',' + (cy + hw) + ' ' + (cx - hw) + ',' + cy + '" fill="' + this._escapeXML(fill) + '"/>'
            }
          }
        }
      }

      // Logo
      if (this._logoDataURL) {
        var logoSize = Math.min(moduleSize * 6, totalSize * 0.3)
        var logoX = (totalSize - logoSize) / 2
        var logoY = (totalSize - logoSize) / 2
        var padding = 4

        svg += '<rect x="' + (logoX - padding) + '" y="' + (logoY - padding) + '" width="' + (logoSize + padding * 2) + '" height="' + (logoSize + padding * 2) + '" rx="6" ry="6" fill="#ffffff"/>'
        svg += '<image x="' + logoX + '" y="' + logoY + '" width="' + logoSize + '" height="' + logoSize + '" href="' + this._escapeXML(this._logoDataURL) + '"/>'
      }

      svg += '</svg>'
      return svg
    },

    // ============================================
    // XML 转义
    // ============================================
    _escapeXML: function (str) {
      return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
    },

    // ============================================
    // 下载 PNG
    // ============================================
    _downloadPNG: function () {
      if (!this._currentDataURL) {
        QRToast.warning('请先生成二维码')
        return
      }

      var link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = this._currentDataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      QRToast.success('PNG 已下载')
    },

    // ============================================
    // 下载 SVG
    // ============================================
    _downloadSVG: function () {
      if (!this._currentSVG) {
        QRToast.warning('请先生成二维码')
        return
      }

      var blob = new Blob([this._currentSVG], { type: 'image/svg+xml;charset=utf-8' })
      var url = URL.createObjectURL(blob)

      var link = document.createElement('a')
      link.download = 'qrcode.svg'
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(function () { URL.revokeObjectURL(url) }, 100)
      QRToast.success('SVG 已下载')
    },

    // ============================================
    // 复制 Base64
    // ============================================
    _copyBase64: function () {
      if (!this._currentDataURL) {
        QRToast.warning('请先生成二维码')
        return
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this._currentDataURL).then(function () {
          QRToast.success('Base64 已复制到剪贴板')
        }).catch(function () {
          QRToast.error('复制失败，请手动复制')
        })
      } else {
        // 降级方案
        var textarea = document.createElement('textarea')
        textarea.value = this._currentDataURL
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          QRToast.success('Base64 已复制到剪贴板')
        } catch (e) {
          QRToast.error('复制失败，请手动复制')
        }
        document.body.removeChild(textarea)
      }
    },

    // ============================================
    // 历史记录
    // ============================================
    _loadHistory: function () {
      var items = HistoryManager.getAll()
      var container = this.$.historyList
      var self = this

      if (items.length === 0) {
        container.innerHTML = '<span class="history-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'history-item'
        div.title = item.text

        var img = document.createElement('img')
        img.src = item.dataURL
        img.alt = item.text
        div.appendChild(img)

        var removeBtn = document.createElement('button')
        removeBtn.className = 'remove-history'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          HistoryManager.remove(index)
          self._loadHistory()
        })
        div.appendChild(removeBtn)

        div.addEventListener('click', function () {
          self.$.input.value = item.text
          self._generate()
        })

        container.appendChild(div)
      })
    }
  }

  // ============================================
  // 二维码解码器
  // ============================================
  function QRCodeDecoder() {
    this._decoder = new QRDecoder()
    this._cameraStream = null
    this._scanTimer = null
    this._scanCanvas = null
    this._currentResult = null

    this._init()
  }

  QRCodeDecoder.prototype = {
    constructor: QRCodeDecoder,

    _init: function () {
      this._cacheDOM()
      this._bindEvents()
    },

    _cacheDOM: function () {
      this.$ = {
        uploadArea: document.getElementById('decoderUploadArea'),
        fileInput: document.getElementById('decoderFileInput'),
        preview: document.getElementById('decoderPreview'),
        previewWrapper: document.getElementById('decoderPreviewWrapper'),
        result: document.getElementById('decoderResult'),
        resultContent: document.getElementById('decoderResultContent'),
        error: document.getElementById('decoderError'),
        errorText: document.getElementById('decoderErrorText'),
        copyBtn: document.getElementById('copyDecodeResultBtn'),
        useBtn: document.getElementById('useDecodeResultBtn'),
        video: document.getElementById('decoderVideo'),
        startCamera: document.getElementById('startCameraBtn'),
        stopCamera: document.getElementById('stopCameraBtn'),
        captureFrame: document.getElementById('captureFrameBtn'),
        status: document.getElementById('decoderStatus')
      }
    },

    _bindEvents: function () {
      var self = this

      // 上传区域点击
      this.$.uploadArea.addEventListener('click', function () {
        self.$.fileInput.click()
      })

      // 文件选择
      this.$.fileInput.addEventListener('change', function (e) {
        var file = e.target.files[0]
        if (file) {
          self._decodeFile(file)
        }
      })

      // 拖拽上传
      this.$.uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault()
        this.style.borderColor = '#1677ff'
        this.style.background = 'rgba(22, 119, 255, 0.02)'
      })

      this.$.uploadArea.addEventListener('dragleave', function (e) {
        e.preventDefault()
        this.style.borderColor = '#d9d9d9'
        this.style.background = ''
      })

      this.$.uploadArea.addEventListener('drop', function (e) {
        e.preventDefault()
        this.style.borderColor = '#d9d9d9'
        this.style.background = ''
        var file = e.dataTransfer.files[0]
        if (file && file.type.match(/image\//)) {
          self._decodeFile(file)
        } else {
          QRToast.warning('请拖入图片文件')
        }
      })

      // 复制结果
      this.$.copyBtn.addEventListener('click', function () {
        if (self._currentResult) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(self._currentResult).then(function () {
              QRToast.success('已复制到剪贴板')
            }).catch(function () {
              self._fallbackCopy(self._currentResult)
            })
          } else {
            self._fallbackCopy(self._currentResult)
          }
        }
      })

      // 填入生成器
      this.$.useBtn.addEventListener('click', function () {
        if (self._currentResult) {
          var input = document.getElementById('qrInput')
          if (input) {
            input.value = self._currentResult
            // 切换到生成器标签
            document.querySelector('[data-tab="generator"]').click()
            // 触发生成
            var event = new Event('input', { bubbles: true })
            input.dispatchEvent(event)
            QRToast.success('已填入生成器')
          }
        }
      })

      // 摄像头
      this.$.startCamera.addEventListener('click', function () {
        self._startCamera()
      })

      this.$.stopCamera.addEventListener('click', function () {
        self._stopCamera()
      })

      this.$.captureFrame.addEventListener('click', function () {
        self._captureFrame()
      })
    },

    _decodeFile: function (file) {
      var self = this

      // 显示预览
      var reader = new FileReader()
      reader.onload = function (e) {
        var dataURL = e.target.result
        self.$.preview.src = dataURL
        self.$.previewWrapper.classList.add('show')
        self.$.result.classList.remove('show')
        self.$.error.classList.remove('show')
        self.$.status.textContent = '正在解码...'

        // 解码
        self._decoder.decodeFromDataURL(dataURL, function (result, error) {
          if (result) {
            self._showResult(result)
          } else {
            self._showError(error || '未能识别二维码')
          }
        })
      }
      reader.readAsDataURL(file)
    },

    _showResult: function (text) {
      this._currentResult = text
      this.$.resultContent.textContent = text
      this.$.result.classList.add('show')
      this.$.error.classList.remove('show')
      this.$.status.textContent = '✅ 解码成功'
      QRToast.success('二维码解码成功')
    },

    _showError: function (message) {
      this._currentResult = null
      this.$.errorText.textContent = message
      this.$.error.classList.add('show')
      this.$.result.classList.remove('show')
      this.$.status.textContent = '❌ ' + message
      QRToast.error(message)
    },

    _fallbackCopy: function (text) {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        QRToast.success('已复制到剪贴板')
      } catch (e) {
        QRToast.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    },

    _startCamera: function () {
      var self = this

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        QRToast.error('您的浏览器不支持摄像头访问')
        return
      }

      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      }).then(function (stream) {
        self._cameraStream = stream
        self.$.video.srcObject = stream
        self.$.video.classList.add('show')
        self.$.startCamera.style.display = 'none'
        self.$.stopCamera.style.display = 'block'
        self.$.captureFrame.style.display = 'block'

        // 创建扫描 Canvas
        self._scanCanvas = document.createElement('canvas')
        self.$.status.textContent = '📷 摄像头已开启，点击拍照扫描'

      }).catch(function (err) {
        QRToast.error('无法访问摄像头: ' + err.message)
      })
    },

    _stopCamera: function () {
      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach(function (track) { track.stop() })
        this._cameraStream = null
      }

      if (this._scanTimer) {
        clearInterval(this._scanTimer)
        this._scanTimer = null
      }

      this.$.video.classList.remove('show')
      this.$.video.srcObject = null
      this.$.startCamera.style.display = 'block'
      this.$.stopCamera.style.display = 'none'
      this.$.captureFrame.style.display = 'none'
      this.$.status.textContent = '摄像头已关闭'
    },

    _captureFrame: function () {
      var video = this.$.video
      var canvas = this._scanCanvas

      if (!video || !canvas) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      var ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 显示捕获的帧
      var dataURL = canvas.toDataURL('image/jpeg')
      this.$.preview.src = dataURL
      this.$.previewWrapper.classList.add('show')
      this.$.result.classList.remove('show')
      this.$.error.classList.remove('show')
      this.$.status.textContent = '正在解码...'

      // 解码
      var self = this
      this._decoder.decodeFromDataURL(dataURL, function (result, error) {
        if (result) {
          self._showResult(result)
        } else {
          self._showError(error || '未能识别二维码')
        }
      })
    }
  }

  // ============================================
  // 标签切换
  // ============================================
  function initTabs() {
    var tabs = document.querySelectorAll('.tab-btn')

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.dataset.tab

        // 更新标签状态
        tabs.forEach(function (t) { t.classList.remove('active') })
        this.classList.add('active')

        // 切换生成器/解码器
        var genSections = document.querySelectorAll('.generator-section')
        var decSections = document.querySelectorAll('.decoder-section')

        if (target === 'generator') {
          genSections.forEach(function (s) { s.classList.remove('hidden') })
          decSections.forEach(function (s) { s.classList.remove('active') })
        } else {
          genSections.forEach(function (s) { s.classList.add('hidden') })
          decSections.forEach(function (s) { s.classList.add('active') })
        }
      })
    })
  }

  // ============================================
  // 初始化
  // ============================================
  global.QRGenerator = QRGenerator
  global.QRCodeDecoder = QRCodeDecoder

  document.addEventListener('DOMContentLoaded', function () {
    initTabs()
    global._qrGenerator = new QRGenerator()
    global._qrDecoder = new QRCodeDecoder()
  })

})(typeof window !== 'undefined' ? window : this)