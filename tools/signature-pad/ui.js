/**
 * SignaturePad - UI交互层
 * 基于 CanvasEngine，提供全屏弹窗签名面板
 * 包含遮罩层、工具栏、状态栏、上传功能
 *
 * 依赖: SignatureConfig, SignatureUtils, CanvasEngine
 */
;(function (global) {
  'use strict'

  var Config = global.SignatureConfig
  var Utils = global.SignatureUtils
  var Toast = global.SignatureToast
  var CanvasEngine = global.CanvasEngine

  /**
   * SignaturePad - 全屏弹窗签名面板
   * @param {Object} options - 配置项
   */
  function SignaturePad(options) {
    if (!(this instanceof SignaturePad)) {
      return new SignaturePad(options)
    }

    this.options = Utils.extend({}, Config.ENGINE, Config.UI, options)
    this._init()
  }

  SignaturePad.prototype = {
    constructor: SignaturePad,

    _init: function () {
      this._isUploading = false

      this._createDOM()
      this._initEngine()
      this._bindUIEvents()
    },

    // ============================================
    // DOM 创建
    // ============================================
    _createDOM: function () {
      var self = this
      var opts = this.options

      // 遮罩层
      var overlay = document.createElement('div')
      overlay.className = 'signature-overlay'
      overlay.style.display = 'none'
      document.body.appendChild(overlay)
      self._overlay = overlay

      // 面板
      var panel = document.createElement('div')
      panel.className = 'signature-panel'
      overlay.appendChild(panel)
      self._panel = panel

      // 头部
      var header = document.createElement('div')
      header.className = 'signature-header'
      panel.appendChild(header)

      var title = document.createElement('h3')
      title.textContent = opts.title
      header.appendChild(title)

      var headerActions = document.createElement('div')
      headerActions.className = 'signature-header-actions'
      header.appendChild(headerActions)

      // 撤销按钮
      if (opts.showUndo) {
        var undoBtn = Utils.createButton('撤销', 'signature-btn-undo', function (e) {
          e.stopPropagation()
          self.undo()
        })
        headerActions.appendChild(undoBtn)
        self._undoBtn = undoBtn
      }

      // 清空按钮
      var clearBtn = Utils.createButton('清空', 'signature-btn-clear', function (e) {
        e.stopPropagation()
        self.clear()
      })
      headerActions.appendChild(clearBtn)
      self._clearBtn = clearBtn

      // 保存按钮
      var saveBtn = Utils.createButton('保存', 'signature-btn-save', function (e) {
        e.stopPropagation()
        self.save()
      })
      headerActions.appendChild(saveBtn)
      self._saveBtn = saveBtn

      // 关闭按钮
      var closeBtn = document.createElement('button')
      closeBtn.className = 'signature-btn signature-btn-close'
      closeBtn.innerHTML = '&times;'
      closeBtn.type = 'button'
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        self.close()
      })
      headerActions.appendChild(closeBtn)

      // 画布容器
      var canvasWrapper = document.createElement('div')
      canvasWrapper.className = 'signature-canvas-wrapper'
      panel.appendChild(canvasWrapper)
      self._canvasWrapper = canvasWrapper

      // 占位文字
      var placeholder = document.createElement('div')
      placeholder.className = 'signature-placeholder'
      placeholder.textContent = opts.placeholder
      canvasWrapper.appendChild(placeholder)
      self._placeholder = placeholder

      // 画布
      var canvas = document.createElement('canvas')
      canvasWrapper.appendChild(canvas)
      self._canvas = canvas

      // 底部状态栏
      var footer = document.createElement('div')
      footer.className = 'signature-footer'
      panel.appendChild(footer)

      var status = document.createElement('div')
      status.className = 'signature-status'
      footer.appendChild(status)

      var statusDot = document.createElement('span')
      statusDot.className = 'signature-status-dot inactive'
      status.appendChild(statusDot)
      self._statusDot = statusDot

      var statusText = document.createElement('span')
      statusText.textContent = '等待签名...'
      status.appendChild(statusText)
      self._statusText = statusText

      var footerHint = document.createElement('div')
      footerHint.textContent = '支持鼠标 / 手写笔'
      footer.appendChild(footerHint)
    },

    // ============================================
    // 初始化引擎
    // ============================================
    _initEngine: function () {
      var self = this
      var opts = this.options

      this._engine = new CanvasEngine(this._canvas, {
        penColor: opts.penColor,
        penWidth: opts.penWidth,
        bgColor: opts.bgColor,
        maxUndoSteps: opts.maxUndoSteps,
        velocitySensitive: opts.velocitySensitive,
        minWidth: opts.minWidth,
        maxWidth: opts.maxWidth,
        taperEffect: opts.taperEffect,
        taperLength: opts.taperLength,
        opacityEffect: opts.opacityEffect,
        minOpacity: opts.minOpacity,
        maxOpacity: opts.maxOpacity,
      })

      // 监听引擎事件
      this._engine.on('drawStart', function () {
        self._hidePlaceholder()
        self._updateStatus(true)
      })

      this._engine.on('drawEnd', function () {
        self._updateStatus(false)
      })

      this._engine.on('contentChange', function (hasContent) {
        if (hasContent) {
          self._hidePlaceholder()
        } else {
          self._showPlaceholder()
        }
        self._updateStatus(false)
      })

      this._engine.on('clear', function () {
        self._showPlaceholder()
        self._updateStatus(false)
        if (typeof opts.onClear === 'function') opts.onClear()
      })
    },

    // ============================================
    // UI 事件绑定
    // ============================================
    _bindUIEvents: function () {
      var self = this
      var opts = this.options

      document.addEventListener('keydown', function (e) {
        if (!self._isVisible()) return

        if (e.key === 'Escape') self.close()
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault()
          self.undo()
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault()
          self.save()
        }
      })

      if (opts.responsive) {
        var resizeTimer
        window.addEventListener('resize', function () {
          clearTimeout(resizeTimer)
          resizeTimer = setTimeout(function () {
            if (self._isVisible()) self._updateCanvasSize()
          }, 200)
        })
      }
    },

    // ============================================
    // 尺寸更新
    // ============================================
    _updateCanvasSize: function () {
      var canvas = this._canvas
      var wrapper = this._canvasWrapper
      var opts = this.options

      var wrapperWidth = wrapper.clientWidth - 40
      var wrapperHeight = wrapper.clientHeight - 40

      var width = Math.min(opts.width, wrapperWidth)
      var height = Math.min(opts.height, wrapperHeight)

      if (width < opts.width) {
        height = (opts.height / opts.width) * width
      }
      if (height > wrapperHeight) {
        height = wrapperHeight
        width = (opts.width / opts.height) * height
      }

      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'

      this._engine.resize()
    },

    // ============================================
    // UI 辅助方法
    // ============================================
    _hidePlaceholder: function () {
      if (this._placeholder) this._placeholder.style.opacity = '0'
    },

    _showPlaceholder: function () {
      if (this._placeholder) this._placeholder.style.opacity = '1'
    },

    _updateStatus: function (isDrawing) {
      if (isDrawing) {
        this._statusDot.className = 'signature-status-dot'
        this._statusText.textContent = '签名中...'
      } else if (!this._engine.isEmpty()) {
        this._statusDot.className = 'signature-status-dot'
        this._statusText.textContent = '已签名'
      } else {
        this._statusDot.className = 'signature-status-dot inactive'
        this._statusText.textContent = '等待签名...'
      }
    },

    _isVisible: function () {
      return this._overlay && this._overlay.style.display !== 'none'
    },

    // ============================================
    // 公开 API
    // ============================================

    /** 打开签名面板 */
    open: function () {
      this._overlay.style.display = 'flex'
      document.body.style.overflow = 'hidden'

      var self = this
      setTimeout(function () {
        self._updateCanvasSize()
      }, 50)
    },

    /** 关闭签名面板 */
    close: function () {
      this._overlay.style.display = 'none'
      document.body.style.overflow = ''

      if (typeof this.options.onClose === 'function') {
        this.options.onClose()
      }
    },

    /** 清空画布 */
    clear: function () {
      this._engine.clear()
    },

    /** 撤销上一步 */
    undo: function () {
      this._engine.undo()
    },

    /** 保存签名 */
    save: function () {
      if (this._engine.isEmpty()) {
        Toast.warning('请先完成签名')
        return
      }

      var opts = this.options
      var base64DataURL = this._engine.getSignatureData()
      var file = this._engine.getSignatureFile()

      if (typeof opts.onSave === 'function') {
        opts.onSave(base64DataURL, file)
      }

      if (opts.autoUpload && opts.uploadUrl) {
        this._upload(base64DataURL, file)
      } else {
        Toast.success('签名已保存')
        this.close()
      }
    },

    /** 获取 base64 */
    getSignatureData: function () {
      return this._engine.getSignatureData()
    },

    /** 获取 File */
    getSignatureFile: function () {
      return this._engine.getSignatureFile()
    },

    /** 判断是否为空 */
    isEmpty: function () {
      return this._engine.isEmpty()
    },

    /** 获取底层引擎实例 */
    getEngine: function () {
      return this._engine
    },

    /** 销毁 */
    destroy: function () {
      if (this._overlay && this._overlay.parentNode) {
        this._overlay.parentNode.removeChild(this._overlay)
      }
      if (this._engine) {
        this._engine.destroy()
      }
      this._engine = null
      this._canvas = null
      this._overlay = null
      this._panel = null
    },

    // ============================================
    // 上传
    // ============================================
    _upload: function (base64DataURL, file) {
      if (this._isUploading) return

      var self = this
      var opts = this.options

      self._isUploading = true
      self._setUploadingState(true)

      var formData = new FormData()
      formData.append(opts.uploadFieldName, file, 'signature.png')

      if (opts.uploadExtraData) {
        for (var key in opts.uploadExtraData) {
          if (opts.uploadExtraData.hasOwnProperty(key)) {
            formData.append(key, opts.uploadExtraData[key])
          }
        }
      }

      var xhr = new XMLHttpRequest()
      xhr.open('POST', opts.uploadUrl, true)

      if (opts.uploadHeaders) {
        for (var headerKey in opts.uploadHeaders) {
          if (opts.uploadHeaders.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, opts.uploadHeaders[headerKey])
          }
        }
      }

      xhr.onload = function () {
        self._isUploading = false
        self._setUploadingState(false)

        if (xhr.status >= 200 && xhr.status < 300) {
          var response
          try { response = JSON.parse(xhr.responseText) } catch (e) { response = xhr.responseText }

          Toast.success('上传成功')
          if (typeof opts.onUpload === 'function') opts.onUpload(response, base64DataURL, file)
          self.close()
        } else {
          var error = new Error('上传失败: HTTP ' + xhr.status)
          Toast.error('上传失败')
          if (typeof opts.onUploadError === 'function') opts.onUploadError(error, xhr)
        }
      }

      xhr.onerror = function () {
        self._isUploading = false
        self._setUploadingState(false)
        var error = new Error('网络错误，上传失败')
        Toast.error('网络错误，上传失败')
        if (typeof opts.onUploadError === 'function') opts.onUploadError(error, xhr)
      }

      xhr.ontimeout = function () {
        self._isUploading = false
        self._setUploadingState(false)
        var error = new Error('上传超时')
        Toast.error('上传超时')
        if (typeof opts.onUploadError === 'function') opts.onUploadError(error, xhr)
      }

      xhr.timeout = 30000
      xhr.send(formData)
    },

    _setUploadingState: function (isUploading) {
      if (isUploading) {
        this._saveBtn.disabled = true
        this._saveBtn.innerHTML = '<span class="signature-loading">上传中...</span>'
        this._saveBtn.style.opacity = '0.7'
        this._saveBtn.style.cursor = 'not-allowed'
      } else {
        this._saveBtn.disabled = false
        this._saveBtn.textContent = '保存'
        this._saveBtn.style.opacity = '1'
        this._saveBtn.style.cursor = 'pointer'
      }
    }
  }

  // 暴露到全局
  global.SignaturePad = SignaturePad

})(typeof window !== 'undefined' ? window : this)