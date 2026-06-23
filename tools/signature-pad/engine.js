/**
 * SignaturePad - 纯画布签名引擎
 * 绑定任意 <canvas> 元素，提供完整的签名绘制能力
 * 不依赖任何 UI 层，可独立使用
 *
 * 依赖: SignatureConfig, SignatureUtils
 */
;(function (global) {
  'use strict'

  var Config = global.SignatureConfig
  var Utils = global.SignatureUtils

  /**
   * CanvasEngine - 画布签名引擎
   * @param {HTMLCanvasElement} canvas - 目标 canvas 元素
   * @param {Object} options - 配置项（覆盖默认配置）
   */
  function CanvasEngine(canvas, options) {
    if (!(this instanceof CanvasEngine)) {
      return new CanvasEngine(canvas, options)
    }

    if (!canvas || !canvas.tagName || canvas.tagName !== 'CANVAS') {
      throw new Error('[CanvasEngine] 需要传入一个有效的 <canvas> 元素')
    }

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.options = Utils.extend({}, Config.ENGINE, options)

    this._init()
  }

  CanvasEngine.prototype = {
    constructor: CanvasEngine,

    // ============================================
    // 初始化
    // ============================================
    _init: function () {
      this._isDrawing = false
      this._hasContent = false
      this._points = []
      this._undoStack = []
      this._lastPoint = null

      // 手写仿真状态
      this._velocities = []
      this._strokePoints = []
      this._strokeWidths = []
      this._strokeOpacities = []

      // 离屏画布（用于撤销）
      this._offscreenCanvas = document.createElement('canvas')
      this._offscreenCtx = this._offscreenCanvas.getContext('2d')

      // 高清屏适配
      this._dpr = window.devicePixelRatio || 1

      // 事件系统
      this._events = {}

      // 绑定事件
      this._bindEvents()

      // 初始化尺寸
      this._syncSize()
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this
      var canvas = this.canvas

      // 鼠标事件
      canvas.addEventListener('mousedown', function (e) {
        e.preventDefault()
        self._startDrawing(Utils.getMousePos(canvas, e))
      })
      canvas.addEventListener('mousemove', function (e) {
        e.preventDefault()
        if (self._isDrawing) self._draw(Utils.getMousePos(canvas, e))
      })
      canvas.addEventListener('mouseup', function (e) {
        e.preventDefault()
        self._stopDrawing()
      })
      canvas.addEventListener('mouseleave', function () {
        if (self._isDrawing) self._stopDrawing()
      })

      // 触摸事件
      canvas.addEventListener('touchstart', function (e) {
        e.preventDefault()
        var touch = e.touches[0]
        self._startDrawing(Utils.getTouchPos(canvas, touch))
      }, { passive: false })
      canvas.addEventListener('touchmove', function (e) {
        e.preventDefault()
        if (self._isDrawing) {
          var touch = e.touches[0]
          self._draw(Utils.getTouchPos(canvas, touch))
        }
      }, { passive: false })
      canvas.addEventListener('touchend', function (e) {
        e.preventDefault()
        self._stopDrawing()
      }, { passive: false })
      canvas.addEventListener('touchcancel', function (e) {
        e.preventDefault()
        self._stopDrawing()
      }, { passive: false })

      // 指针事件（手写笔压感）
      if (window.PointerEvent) {
        canvas.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'touch') return
          e.preventDefault()
          self._startDrawing(Utils.getPointerPos(canvas, e), e.pressure)
        })
        canvas.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return
          e.preventDefault()
          if (self._isDrawing) self._draw(Utils.getPointerPos(canvas, e), e.pressure)
        })
        canvas.addEventListener('pointerup', function (e) {
          if (e.pointerType === 'touch') return
          e.preventDefault()
          self._stopDrawing()
        })
        canvas.addEventListener('pointerleave', function () {
          if (self._isDrawing) self._stopDrawing()
        })
      }
    },

    // ============================================
    // 绘制核心
    // ============================================
    _startDrawing: function (pos, pressure) {
      this._isDrawing = true
      this._points = [pos]

      // 保存撤销状态
      this._saveState()

      // 重置笔画数据
      this._strokePoints = [pos]
      this._strokeWidths = []
      this._strokeOpacities = []
      this._velocities = []

      var ctx = this.ctx
      var opts = this.options

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      var lineWidth = this._calcWidth(0, pressure)
      var opacity = this._calcOpacity(0, pressure)

      ctx.globalAlpha = opacity
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = opts.penColor
      ctx.fillStyle = opts.penColor

      // 起始点
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()

      this._strokeWidths.push(lineWidth)
      this._strokeOpacities.push(opacity)
      this._lastPoint = pos

      this._hasContent = true
      this._fire('drawStart', pos)
    },

    _draw: function (pos, pressure) {
      if (!this._isDrawing) return

      var ctx = this.ctx
      var opts = this.options
      var points = this._points

      points.push(pos)
      this._strokePoints.push(pos)

      // 计算速度
      var velocity = 0
      if (this._lastPoint) {
        var dx = pos.x - this._lastPoint.x
        var dy = pos.y - this._lastPoint.y
        velocity = Math.sqrt(dx * dx + dy * dy)
      }

      this._velocities.push(velocity)
      if (this._velocities.length > 5) this._velocities.shift()

      var avgVelocity = 0
      for (var v = 0; v < this._velocities.length; v++) {
        avgVelocity += this._velocities[v]
      }
      avgVelocity /= this._velocities.length

      var lineWidth = this._calcWidth(avgVelocity, pressure)
      var opacity = this._calcOpacity(avgVelocity, pressure)

      this._strokeWidths.push(lineWidth)
      this._strokeOpacities.push(opacity)

      // 贝塞尔曲线绘制
      if (points.length >= 3) {
        var p1 = points[points.length - 3]
        var p2 = points[points.length - 2]
        var p3 = points[points.length - 1]

        var mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
        var mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 }

        var w1 = this._strokeWidths[this._strokeWidths.length - 2] || lineWidth
        var w2 = lineWidth
        var o1 = this._strokeOpacities[this._strokeOpacities.length - 2] || opacity
        var o2 = opacity

        ctx.globalAlpha = (o1 + o2) / 2
        ctx.lineWidth = (w1 + w2) / 2
        ctx.strokeStyle = opts.penColor

        ctx.beginPath()
        ctx.moveTo(mid1.x, mid1.y)
        ctx.quadraticCurveTo(p2.x, p2.y, mid2.x, mid2.y)
        ctx.stroke()
      } else {
        ctx.globalAlpha = opacity
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = opts.penColor

        ctx.beginPath()
        ctx.moveTo(this._lastPoint.x, this._lastPoint.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }

      this._lastPoint = pos
      this._fire('draw', pos)
    },

    _stopDrawing: function () {
      if (!this._isDrawing) return

      if (this.options.taperEffect && this._strokePoints.length > 3) {
        this._applyTaper()
      }

      this._isDrawing = false
      this._points = []
      this._lastPoint = null
      this.ctx.globalAlpha = 1.0

      this._fire('drawEnd')
    },

    // ============================================
    // 手写仿真算法
    // ============================================
    _calcWidth: function (velocity, pressure) {
      var opts = this.options

      if (!opts.velocitySensitive) {
        var baseWidth = opts.penWidth
        if (pressure && pressure > 0) {
          baseWidth = opts.penWidth * (0.5 + pressure * 1.5)
        }
        return Utils.clamp(baseWidth, opts.minWidth, opts.maxWidth)
      }

      var speedFactor = Math.exp(-velocity * 0.08)
      var widthRange = opts.maxWidth - opts.minWidth

      var pressureFactor = 1.0
      if (pressure && pressure > 0) {
        pressureFactor = 0.6 + pressure * 0.4
      }

      return Utils.clamp(
        opts.minWidth + widthRange * speedFactor * pressureFactor,
        opts.minWidth,
        opts.maxWidth
      )
    },

    _calcOpacity: function (velocity, pressure) {
      var opts = this.options

      if (!opts.opacityEffect) return 1.0

      var speedFactor = Math.exp(-velocity * 0.05)
      var opacityRange = opts.maxOpacity - opts.minOpacity

      var pressureFactor = 1.0
      if (pressure && pressure > 0) {
        pressureFactor = 0.7 + pressure * 0.3
      }

      return Utils.clamp(
        opts.minOpacity + opacityRange * speedFactor * pressureFactor,
        opts.minOpacity,
        opts.maxOpacity
      )
    },

    _applyTaper: function () {
      var ctx = this.ctx
      var opts = this.options
      var points = this._strokePoints
      var widths = this._strokeWidths
      var opacities = this._strokeOpacities

      if (points.length < 3) return

      var taperCount = Math.min(opts.taperLength, Math.floor(points.length / 3))

      for (var i = 0; i < taperCount; i++) {
        var idx = points.length - 1 - i
        if (idx < 1) break

        var taperFactor = 1 - (i / taperCount) * 0.9

        var p1 = points[idx - 1]
        var p2 = points[idx]

        var baseWidth = widths[idx] || opts.penWidth
        var taperWidth = baseWidth * taperFactor

        var baseOpacity = opacities[idx] || 1.0
        var taperOpacity = baseOpacity * (0.3 + 0.7 * taperFactor)

        ctx.globalAlpha = taperOpacity
        ctx.lineWidth = Math.max(taperWidth, 0.3)
        ctx.strokeStyle = opts.penColor

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }

      ctx.globalAlpha = 1.0
    },

    // ============================================
    // 撤销
    // ============================================
    _saveState: function () {
      var canvas = this.canvas
      var offscreen = this._offscreenCanvas

      offscreen.width = canvas.width
      offscreen.height = canvas.height

      this._offscreenCtx.drawImage(canvas, 0, 0)
      this._undoStack.push(offscreen.toDataURL())

      if (this._undoStack.length > this.options.maxUndoSteps) {
        this._undoStack.shift()
      }
    },

    // ============================================
    // 尺寸同步
    // ============================================
    _syncSize: function () {
      var canvas = this.canvas
      var dpr = this._dpr

      var cssW = canvas.clientWidth || parseInt(canvas.style.width) || 300
      var cssH = canvas.clientHeight || parseInt(canvas.style.height) || 150

      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
      canvas.style.width = cssW + 'px'
      canvas.style.height = cssH + 'px'

      this.ctx.scale(dpr, dpr)

      if (this.options.bgColor && this.options.bgColor !== 'transparent') {
        this.ctx.fillStyle = this.options.bgColor
        this.ctx.fillRect(0, 0, cssW, cssH)
      }

      this._offscreenCanvas.width = canvas.width
      this._offscreenCanvas.height = canvas.height

      this._logicalWidth = cssW
      this._logicalHeight = cssH
    },

    // ============================================
    // 事件系统
    // ============================================
    on: function (event, handler) {
      if (!this._events[event]) this._events[event] = []
      this._events[event].push(handler)
      return this
    },

    off: function (event, handler) {
      if (!this._events[event]) return this
      if (!handler) {
        this._events[event] = []
      } else {
        this._events[event] = this._events[event].filter(function (h) { return h !== handler })
      }
      return this
    },

    _fire: function (event) {
      var args = Array.prototype.slice.call(arguments, 1)
      var handlers = this._events[event]
      if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
          handlers[i].apply(this, args)
        }
      }
    },

    // ============================================
    // 公开 API
    // ============================================

    /** 清空画布 */
    clear: function () {
      var canvas = this.canvas
      var ctx = this.ctx
      var dpr = this._dpr

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (this.options.bgColor && this.options.bgColor !== 'transparent') {
        ctx.fillStyle = this.options.bgColor
        ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight)
      }

      this._hasContent = false
      this._undoStack = []
      this._fire('clear')
    },

    /** 撤销上一步 */
    undo: function () {
      if (this._undoStack.length === 0) return

      var canvas = this.canvas
      var ctx = this.ctx
      var dpr = this._dpr
      var prevState = this._undoStack.pop()

      var img = new Image()
      var self = this

      img.onload = function () {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        self._checkHasContent()
      }

      img.src = prevState
    },

    /** 检查是否有内容 */
    _checkHasContent: function () {
      var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      var pixels = imageData.data
      this._hasContent = false

      for (var i = 3; i < pixels.length; i += 4) {
        if (pixels[i] !== 0) {
          this._hasContent = true
          break
        }
      }

      this._fire('contentChange', this._hasContent)
    },

    /** 获取 base64 数据 */
    getSignatureData: function () {
      if (!this._hasContent) return null
      return this.canvas.toDataURL('image/png')
    },

    /** 获取 File 对象 */
    getSignatureFile: function () {
      var dataURL = this.getSignatureData()
      if (!dataURL) return null
      return Utils.dataURLToFile(dataURL, 'signature.png')
    },

    /** 判断是否为空 */
    isEmpty: function () {
      return !this._hasContent
    },

    /** 重新计算尺寸（响应式调用） */
    resize: function () {
      this._syncSize()
    },

    /** 销毁 */
    destroy: function () {
      this._events = {}
      this.canvas = null
      this.ctx = null
      this._offscreenCanvas = null
      this._offscreenCtx = null
      this._undoStack = null
      this._points = null
    }
  }

  // 暴露到全局
  global.CanvasEngine = CanvasEngine

})(typeof window !== 'undefined' ? window : this)