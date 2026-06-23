/**
 * Color Picker - 颜色转换/计算引擎
 * 纯数学计算，无外部依赖
 *
 * 依赖: ColorConfig
 */
;(function (global) {
  'use strict'

  var Config = global.ColorConfig

  var ColorUtils = {
    // ============================================
    // HEX ↔ RGB
    // ============================================

    /**
     * HEX 转 RGB
     * @param {string} hex - #RRGGBB 或 #RGB 格式
     * @returns {{r: number, g: number, b: number}|null}
     */
    hexToRgb: function (hex) {
      if (!hex) return null
      hex = hex.replace(/^#/, '')

      // 处理简写 #RGB
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      }

      if (hex.length !== 6) return null

      var num = parseInt(hex, 16)
      if (isNaN(num)) return null

      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      }
    },

    /**
     * RGB 转 HEX
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @returns {string} #RRGGBB
     */
    rgbToHex: function (r, g, b) {
      var toHex = function (n) {
        var h = Math.round(Math.max(0, Math.min(255, n))).toString(16)
        return h.length === 1 ? '0' + h : h
      }
      return '#' + toHex(r) + toHex(g) + toHex(b)
    },

    // ============================================
    // RGB ↔ HSL
    // ============================================

    /**
     * RGB 转 HSL
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @returns {{h: number, s: number, l: number}} h: 0-360, s: 0-100, l: 0-100
     */
    rgbToHsl: function (r, g, b) {
      r /= 255
      g /= 255
      b /= 255

      var max = Math.max(r, g, b)
      var min = Math.min(r, g, b)
      var h, s, l = (max + min) / 2

      if (max === min) {
        h = s = 0 // 灰色
      } else {
        var d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }

        h /= 6
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    },

    /**
     * HSL 转 RGB
     * @param {number} h - 0-360
     * @param {number} s - 0-100
     * @param {number} l - 0-100
     * @returns {{r: number, g: number, b: number}} 0-255
     */
    hslToRgb: function (h, s, l) {
      h = h / 360
      s = s / 100
      l = l / 100

      var r, g, b

      if (s === 0) {
        r = g = b = l // 灰色
      } else {
        var hue2rgb = function (p, q, t) {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1 / 6) return p + (q - p) * 6 * t
          if (t < 1 / 2) return q
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
          return p
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s
        var p = 2 * l - q

        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      }
    },

    // ============================================
    // RGB ↔ HSV
    // ============================================

    /**
     * RGB 转 HSV
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @returns {{h: number, s: number, v: number}} h: 0-360, s: 0-100, v: 0-100
     */
    rgbToHsv: function (r, g, b) {
      r /= 255
      g /= 255
      b /= 255

      var max = Math.max(r, g, b)
      var min = Math.min(r, g, b)
      var h, s, v = max

      var d = max - min
      s = max === 0 ? 0 : d / max

      if (max === min) {
        h = 0
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
      }
    },

    /**
     * HSV 转 RGB
     * @param {number} h - 0-360
     * @param {number} s - 0-100
     * @param {number} v - 0-100
     * @returns {{r: number, g: number, b: number}} 0-255
     */
    hsvToRgb: function (h, s, v) {
      h = h / 360
      s = s / 100
      v = v / 100

      var r, g, b

      var i = Math.floor(h * 6)
      var f = h * 6 - i
      var p = v * (1 - s)
      var q = v * (1 - f * s)
      var t = v * (1 - (1 - f) * s)

      switch (i % 6) {
        case 0: r = v; g = t; b = p; break
        case 1: r = q; g = v; b = p; break
        case 2: r = p; g = v; b = t; break
        case 3: r = p; g = q; b = v; break
        case 4: r = t; g = p; b = v; break
        case 5: r = v; g = p; b = q; break
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      }
    },

    // ============================================
    // 颜色解析与格式化
    // ============================================

    /**
     * 解析颜色输入，自动识别格式
     * @param {string} input - HEX/RGB/HSL/HSV 格式
     * @returns {{r: number, g: number, b: number}|null}
     */
    parseColor: function (input) {
      if (!input) return null

      // 尝试 HEX
      if (input.startsWith('#')) {
        return this.hexToRgb(input)
      }

      // 尝试 rgb()
      var rgbMatch = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1], 10),
          g: parseInt(rgbMatch[2], 10),
          b: parseInt(rgbMatch[3], 10)
        }
      }

      // 尝试 hsl()
      var hslMatch = input.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i)
      if (hslMatch) {
        return this.hslToRgb(
          parseInt(hslMatch[1], 10),
          parseInt(hslMatch[2], 10),
          parseInt(hslMatch[3], 10)
        )
      }

      // 尝试 hsv()
      var hsvMatch = input.match(/^hsv\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i)
      if (hsvMatch) {
        return this.hsvToRgb(
          parseInt(hsvMatch[1], 10),
          parseInt(hsvMatch[2], 10),
          parseInt(hsvMatch[3], 10)
        )
      }

      return null
    },

    /**
     * 按指定格式输出颜色
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @param {string} format - 'hex' | 'rgb' | 'hsl' | 'hsv'
     * @returns {string}
     */
    formatColor: function (r, g, b, format) {
      format = format || 'hex'

      switch (format) {
        case 'hex':
          return this.rgbToHex(r, g, b)
        case 'rgb':
          return 'rgb(' + r + ', ' + g + ', ' + b + ')'
        case 'hsl': {
          var hsl = this.rgbToHsl(r, g, b)
          return 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
        }
        case 'hsv': {
          var hsv = this.rgbToHsv(r, g, b)
          return 'hsv(' + hsv.h + ', ' + hsv.s + '%, ' + hsv.v + '%)'
        }
        default:
          return this.rgbToHex(r, g, b)
      }
    },

    /**
     * 获取所有格式的颜色值
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @returns {{hex: string, rgb: string, hsl: string, hsv: string}}
     */
    getAllFormats: function (r, g, b) {
      var hsl = this.rgbToHsl(r, g, b)
      var hsv = this.rgbToHsv(r, g, b)

      return {
        hex: this.rgbToHex(r, g, b),
        rgb: 'rgb(' + r + ', ' + g + ', ' + b + ')',
        hsl: 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)',
        hsv: 'hsv(' + hsv.h + ', ' + hsv.s + '%, ' + hsv.v + '%)'
      }
    },

    // ============================================
    // 对比度检测
    // ============================================

    /**
     * 计算相对亮度（WCAG 标准）
     * @param {number} r - 0-255
     * @param {number} g - 0-255
     * @param {number} b - 0-255
     * @returns {number} 0-1
     */
    getRelativeLuminance: function (r, g, b) {
      var srgb = [r / 255, g / 255, b / 255]
      var linear = srgb.map(function (c) {
        if (c <= 0.03928) {
          return c / 12.92
        }
        return Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
    },

    /**
     * 计算两个颜色的对比度
     * @param {string} hex1 - #RRGGBB
     * @param {string} hex2 - #RRGGBB
     * @returns {number} 对比度比值
     */
    getContrastRatio: function (hex1, hex2) {
      var rgb1 = this.hexToRgb(hex1)
      var rgb2 = this.hexToRgb(hex2)
      if (!rgb1 || !rgb2) return 0

      var l1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
      var l2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

      var lighter = Math.max(l1, l2)
      var darker = Math.min(l1, l2)

      return (lighter + 0.05) / (darker + 0.05)
    },

    /**
     * 检查 WCAG 标准
     * @param {number} ratio - 对比度比值
     * @returns {{AA: boolean, AAA: boolean, AALarge: boolean, AAALarge: boolean}}
     */
    checkWCAG: function (ratio) {
      return {
        AA: ratio >= 4.5,
        AAA: ratio >= 7,
        AALarge: ratio >= 3,
        AAALarge: ratio >= 4.5
      }
    },

    // ============================================
    // 图片颜色提取
    // ============================================

    /**
     * 从图片提取主色调
     * @param {ImageData} imageData - Canvas 的 ImageData
     * @param {number} count - 提取颜色数量
     * @returns {Array<{hex: string, ratio: number}>}
     */
    extractColorsFromImage: function (imageData, count) {
      count = count || 5
      var pixels = imageData.data
      var colorMap = {}
      var totalPixels = 0

      // 采样像素（每隔 4 个像素采样一次以提高性能）
      for (var i = 0; i < pixels.length; i += 16) {
        var r = pixels[i]
        var g = pixels[i + 1]
        var b = pixels[i + 2]
        var a = pixels[i + 3]

        // 忽略透明像素
        if (a < 128) continue

        // 量化颜色以减少颜色数量
        var quantizedR = Math.round(r / 16) * 16
        var quantizedG = Math.round(g / 16) * 16
        var quantizedB = Math.round(b / 16) * 16

        var key = quantizedR + ',' + quantizedG + ',' + quantizedB
        colorMap[key] = (colorMap[key] || 0) + 1
        totalPixels++
      }

      if (totalPixels === 0) return []

      // 转换为数组并排序
      var colorArray = []
      for (var key in colorMap) {
        if (colorMap.hasOwnProperty(key)) {
          var parts = key.split(',')
          var hex = this.rgbToHex(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10),
            parseInt(parts[2], 10)
          )
          colorArray.push({
            hex: hex,
            count: colorMap[key],
            ratio: colorMap[key] / totalPixels
          })
        }
      }

      colorArray.sort(function (a, b) { return b.count - a.count })

      return colorArray.slice(0, count)
    },

    // ============================================
    // 工具方法
    // ============================================

    /**
     * 判断颜色是亮色还是暗色
     * @param {string} hex - #RRGGBB
     * @returns {boolean} true=亮色, false=暗色
     */
    isLightColor: function (hex) {
      var rgb = this.hexToRgb(hex)
      if (!rgb) return true
      // 计算亮度感知
      var brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
      return brightness > 128
    },

    /**
     * 获取适合在背景色上使用的文本颜色（黑或白）
     * @param {string} bgHex - 背景色 #RRGGBB
     * @returns {string} '#000000' 或 '#FFFFFF'
     */
    getTextColorForBackground: function (bgHex) {
      return this.isLightColor(bgHex) ? '#000000' : '#FFFFFF'
    },

    /**
     * 验证 HEX 颜色值
     * @param {string} hex
     * @returns {boolean}
     */
    isValidHex: function (hex) {
      return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
    },

    /**
     * 将颜色值限制在有效范围内
     */
    clamp: function (value, min, max) {
      return Math.max(min, Math.min(max, value))
    }
  }

  // 暴露到全局
  global.ColorUtils = ColorUtils

})(typeof window !== 'undefined' ? window : this)