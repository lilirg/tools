/**
 * Color Picker - 调色板生成引擎
 * 基于颜色理论生成各种配色方案
 *
 * 依赖: ColorConfig, ColorUtils
 */
;(function (global) {
  'use strict'

  var Config = global.ColorConfig
  var ColorUtils = global.ColorUtils

  var PaletteEngine = {
    // ============================================
    // 配色方案生成
    // ============================================

    /**
     * 生成单色系配色方案
     * @param {string} baseHex - 基础色 #RRGGBB
     * @param {number} count - 颜色数量
     * @returns {Array<{hex: string, name: string}>}
     */
    generateMonochromatic: function (baseHex, count) {
      count = count || 5
      var rgb = ColorUtils.hexToRgb(baseHex)
      if (!rgb) return []

      var hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b)
      var colors = []

      // 在亮度上均匀分布
      var step = 80 / (count - 1)
      for (var i = 0; i < count; i++) {
        var l = Math.round(10 + i * step)
        var c = ColorUtils.hslToRgb(hsl.h, hsl.s, l)
        colors.push({
          hex: ColorUtils.rgbToHex(c.r, c.g, c.b),
          name: this._getShadeName(i, count)
        })
      }

      return colors
    },

    /**
     * 生成互补色方案
     * @param {string} baseHex - 基础色 #RRGGBB
     * @returns {Array<{hex: string, name: string}>}
     */
    generateComplementary: function (baseHex) {
      var rgb = ColorUtils.hexToRgb(baseHex)
      if (!rgb) return []

      var hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b)
      var compHue = (hsl.h + 180) % 360
      var compRgb = ColorUtils.hslToRgb(compHue, hsl.s, hsl.l)

      return [
        { hex: baseHex, name: '主色' },
        { hex: ColorUtils.rgbToHex(compRgb.r, compRgb.g, compRgb.b), name: '互补色' }
      ]
    },

    /**
     * 生成三色系方案
     * @param {string} baseHex - 基础色 #RRGGBB
     * @returns {Array<{hex: string, name: string}>}
     */
    generateTriadic: function (baseHex) {
      var rgb = ColorUtils.hexToRgb(baseHex)
      if (!rgb) return []

      var hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b)
      var colors = []

      for (var i = 0; i < 3; i++) {
        var hue = (hsl.h + i * 120) % 360
        var c = ColorUtils.hslToRgb(hue, hsl.s, hsl.l)
        colors.push({
          hex: ColorUtils.rgbToHex(c.r, c.g, c.b),
          name: i === 0 ? '主色' : '配色 ' + i
        })
      }

      return colors
    },

    /**
     * 生成四色系方案（矩形配色）
     * @param {string} baseHex - 基础色 #RRGGBB
     * @returns {Array<{hex: string, name: string}>}
     */
    generateTetradic: function (baseHex) {
      var rgb = ColorUtils.hexToRgb(baseHex)
      if (!rgb) return []

      var hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b)
      var colors = []

      for (var i = 0; i < 4; i++) {
        var hue = (hsl.h + i * 90) % 360
        var c = ColorUtils.hslToRgb(hue, hsl.s, hsl.l)
        colors.push({
          hex: ColorUtils.rgbToHex(c.r, c.g, c.b),
          name: i === 0 ? '主色' : '配色 ' + i
        })
      }

      return colors
    },

    /**
     * 生成类似色方案
     * @param {string} baseHex - 基础色 #RRGGBB
     * @param {number} count - 颜色数量
     * @returns {Array<{hex: string, name: string}>}
     */
    generateAnalogous: function (baseHex, count) {
      count = count || 5
      var rgb = ColorUtils.hexToRgb(baseHex)
      if (!rgb) return []

      var hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b)
      var colors = []

      // 在色相环上取相邻颜色
      var range = 60 // 范围 ±30 度
      var step = range / (count - 1)

      for (var i = 0; i < count; i++) {
        var hue = (hsl.h - range / 2 + i * step + 360) % 360
        var c = ColorUtils.hslToRgb(hue, hsl.s, hsl.l)
        colors.push({
          hex: ColorUtils.rgbToHex(c.r, c.g, c.b),
          name: this._getShadeName(i, count)
        })
      }

      return colors
    },

    /**
     * 统一入口：根据类型生成配色方案
     * @param {string} type - 方案类型
     * @param {string} baseHex - 基础色
     * @param {number} count - 颜色数量
     * @returns {Array<{hex: string, name: string}>}
     */
    generatePalette: function (type, baseHex, count) {
      count = count || 5

      switch (type) {
        case 'monochromatic':
          return this.generateMonochromatic(baseHex, count)
        case 'complementary':
          return this.generateComplementary(baseHex)
        case 'triadic':
          return this.generateTriadic(baseHex)
        case 'tetradic':
          return this.generateTetradic(baseHex)
        case 'analogous':
          return this.generateAnalogous(baseHex, count)
        default:
          return this.generateComplementary(baseHex)
      }
    },

    // ============================================
    // 内部方法
    // ============================================

    /**
     * 获取色调用名称
     */
    _getShadeName: function (index, total) {
      var names = ['最深', '较深', '适中', '较浅', '最浅']
      if (total <= 3) {
        return ['深色', '主色', '浅色'][index] || '色 ' + (index + 1)
      }
      if (index < names.length) {
        return names[index]
      }
      return '色 ' + (index + 1)
    }
  }

  // 暴露到全局
  global.PaletteEngine = PaletteEngine

})(typeof window !== 'undefined' ? window : this)